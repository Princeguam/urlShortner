import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    base62Encode,
    cleanUrl,
    getSkippedPrismaVale,
    convertToBoolean,
    Prisma,
} from "../../../utilities/index.js";
import {
    ErrorType,
    HandleServerError,
    kUserSessionIdStoreKey,
    kDefaultSuccessMessage,
    kUserIdStoreKey,
    kBaseUrl,
    kDefaultLinkExpirationTimeHR,
    kDefaultRateLimitMaxRequest,
    kDefaultWindowSeconds,
    kDefaultQueryPage,
    kDefaultSearchQuery,
    kDefaultQueryCount,
    $Types,
} from "../../../constants/index.js";
import humps from "humps";
import { addDays, addHours, isAfter, add } from "date-fns";
import { nanoid } from "nanoid";
import { $Enums } from "../../../../generated/prisma/browser.js";
import {
    rateLimiter,
    v1AuthMiddleware,
    cache,
    invalidateCache,
} from "../../../middleware/index.js";

const UrlShortneroute = express.Router();

UrlShortneroute.use(v1AuthMiddleware());

UrlShortneroute.use(
    rateLimiter(kDefaultRateLimitMaxRequest, kDefaultWindowSeconds),
);

type ArrangeBy = "LongUrl" | "ShortUrl" | "PreviousLongUrl" | "Created";

type ArrangeOrder = "asc" | "desc";

type QueryOrderByObject = Partial<Record<ArrangeBy, ArrangeOrder>>;

interface UrlShortnerPostBody {
    parentUrl: string;
    expiration: Date | null;
    customSlug: string;
    isCustom: boolean;
}

interface UrlShortnerUpdateBody extends UrlShortnerPostBody {
    urlId: number;
}

UrlShortneroute.get(
    "/",
    cache({ ttlSeconds: 60 }),
    asyncHandler(async (req: Request, res: Response) => {
        let userId = req.store.get(kUserIdStoreKey);

        console.log("THIS GETS HERE");

        let url = new URL(req.url || String(), `http://${req.headers.host}`);
        let search = url.searchParams.get("search") || kDefaultSearchQuery;
        let page = Number(url.searchParams.get("page") || kDefaultQueryPage);
        page = !isNaN(page) ? page : kDefaultQueryPage;

        let count = Number(url.searchParams.get("count") || kDefaultQueryCount);
        count = !isNaN(count) ? count : kDefaultQueryCount;
        count = Math.min(Math.max(0, count), kDefaultQueryCount);

        let getAllRecord =
            url.searchParams.has("all") &&
            convertToBoolean(url.searchParams.get("all"));

        let searchOrderBy: ArrangeBy = "Created";

        if (url.searchParams.has("by")) {
            let searchParamValue =
                String(url.searchParams.get("by")) || String();
            searchOrderBy = ["LongUrl", "ShortUrl", "PreviousLongUrl"].includes(
                searchParamValue,
            )
                ? (searchParamValue as ArrangeBy)
                : "Created";
        }

        let searchOrder: ArrangeOrder = "desc";
        if (url.searchParams.has("order")) {
            let searchParamValue =
                String(url.searchParams.get("order")) || String();
            searchOrder = ["asc", "desc"].includes(searchParamValue)
                ? (searchParamValue as ArrangeOrder)
                : "desc";
        }

        let orderBy: QueryOrderByObject = {
            [searchOrderBy]: searchOrder,
        };

        if (searchOrderBy == "LongUrl") {
            orderBy = {
                LongUrl: searchOrder,
            };
        } else if (searchOrderBy == "ShortUrl") {
            orderBy = {
                ShortUrl: searchOrder,
            };
        }

        let whereClause: Prisma.UrlsWhereInput = {
            UserId: userId,

            ...(search && {
                OR: [
                    {
                        LongUrl: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        ShortUrl: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            }),
        };

        let [totalItems, urls] = await prismaClient.$transaction([
            prismaClient.urls.count({ where: whereClause }),
            prismaClient.urls.findMany({
                where: whereClause,
                orderBy: orderBy,
                select: $Types.Url,
                take: !getAllRecord ? count : kDefaultQueryCount,
                skip: !getAllRecord ? getSkippedPrismaVale(page, count) : 0,
            }),
        ]);

        let pageData = urls.map(({ History, ...otherData }) => ({
            ...otherData,
            History: History,
        }));

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                {
                    page: !getAllRecord ? page : kDefaultQueryPage,
                    count: pageData.length,
                    totalPages: !getAllRecord
                        ? Math.ceil(totalItems / page)
                        : kDefaultQueryPage,
                    totalItems,
                    pageData,
                },
                undefined,
            ),
        );
    }),
);

UrlShortneroute.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let userId = req.store.get(kUserIdStoreKey);

        let body: UrlShortnerPostBody = req.body;

        let now = new Date();

        if (!body.parentUrl) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.LongUrlMissing,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let [subscriptonPlan, customCheck, urlLimitReached] =
            await prismaClient.$transaction([
                prismaClient.subscription.findFirst({
                    where: {
                        UserId: userId,
                        IsActive: true,
                    },
                    select: {
                        Id: true,
                        IsActive: true,
                        StartDate: true,
                        Plan: {
                            select: {
                                Id: true,
                                MaxUrls: true,
                                CustomSlug: true,
                            },
                        },
                    },
                }),

                prismaClient.urls.count({
                    where: {
                        UserId: userId,
                        IsCustom: true,
                    },
                }),

                prismaClient.urls.count({
                    where: {
                        UserId: userId,
                    },
                }),
            ]);

        if (urlLimitReached >= subscriptonPlan?.Plan.MaxUrls!) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.InvalidUrl,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        if (customCheck >= subscriptonPlan?.Plan.CustomSlug!) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.InvalidUrl,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let url = body.parentUrl.toString();

        let longUrlExist = await prismaClient.urls.findFirst({
            where: {
                UserId: userId,
                LongUrl: url,
            },
            select: {
                Id: true,
                LongUrl: true,
                ShortUrl: true,
                Clicks: true,
                IsActive: true,
                ExpiresAt: true,
                IsCustom: true,
            },
        });

        if (longUrlExist) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UrlAlreadyExist,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let registerUrl = await prismaClient.urls.create({
            data: {
                UserId: userId,
                LongUrl: url,
                ExpiresAt: body.expiration
                    ? new Date(body.expiration)
                    : addHours(now, kDefaultLinkExpirationTimeHR),
                ShortUrl: body.customSlug ?? "dummy",
            },
            select: {
                Id: true,
            },
        });

        let shortUrlCode = `${base62Encode(registerUrl.Id)}${nanoid(4)}`;

        let updateUrls = await prismaClient.urls.update({
            where: {
                Id: registerUrl.Id,
            },
            data: {
                ShortUrl: body.isCustom ? body.customSlug : shortUrlCode,
                IsActive: true,
                IsCustom: body.isCustom,
            },
        });

        let pageData = {
            Id: updateUrls.Id,
            LongUrl: updateUrls.LongUrl,
            ShortUrl: `${kBaseUrl}${updateUrls.ShortUrl}`,
            Clicks: updateUrls.Clicks,
            IsActive: updateUrls.IsActive,
            Expiration: updateUrls.ExpiresAt,
        };

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(pageData),
                undefined,
            ),
        );
    }),
);

UrlShortneroute.put(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let userId = req.store.get(kUserIdStoreKey);

        let body: UrlShortnerUpdateBody = req.body;

        let urlExist = await prismaClient.urls.findFirst({
            where: {
                Id: body.urlId,
                UserId: userId,
            },
            select: $Types.Url,
        });

        if (!urlExist) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.InvalidUrl,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let transactionResult = await prismaClient.$transaction(async (tx) => {
            let updatedUrl = await tx.urls.update({
                where: {
                    Id: body.urlId,
                    UserId: userId,
                },
                data: {
                    LongUrl: body.parentUrl ? body.parentUrl : urlExist.LongUrl,
                    ExpiresAt: body.expiration ?? urlExist.ExpiresAt,
                    ShortUrl: body.customSlug ?? urlExist.ShortUrl,
                },
            });

            let history = await tx.history.create({
                data: {
                    ChangedById: userId,
                    UrlId: body.urlId,
                    PreviousShortUrl: urlExist.ShortUrl,
                    NewShortUrl: updatedUrl ? updatedUrl.ShortUrl : null,
                    PreviousLongUrl: urlExist.LongUrl,
                    NewLongUrl: updatedUrl ? updatedUrl.LongUrl : null,
                    Action: $Enums.ChangeAction.UPDATE,
                    PreviousExpiration: urlExist.ExpiresAt,
                    NewExpiration: updatedUrl
                        ? updatedUrl.ExpiresAt
                        : urlExist.ExpiresAt,
                },
                select: $Types.History,
            });
            return { updatedUrl, history };
        });
        await invalidateCache(
            "json",
            transactionResult.history.PreviousLongUrl,
        );
        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(transactionResult.history),
                undefined,
            ),
        );
    }),
);

UrlShortneroute.delete(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let body = req.body;
        let userId = req.store.get(kUserIdStoreKey);

        console.log("DELETED");

        let deleted = await prismaClient.urls.deleteMany({
            where: {
                Id: {
                    in: body.urlIds,
                },
                UserId: userId,
            },
        });
        res.status(200).json(
            systemResponse(true, kDefaultSuccessMessage, deleted, undefined),
        );
    }),
);

export default UrlShortneroute;
