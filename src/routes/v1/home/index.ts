import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    base62Encode,
    cleanUrl,
} from "../../../utilities/index.js";
import {
    ErrorType,
    HandleServerError,
    kUserEmailStoreKey,
    kUsernameStoreKey,
    kUserSessionIdStoreKey,
    kDefaultSuccessMessage,
    kUserIdStoreKey,
    kBaseUrl,
    kDefaultLinkExpirationTimeHR,
    kDefaultRateLimitMaxRequest,
    kDefaultWindowSeconds,
} from "../../../constants/index.js";
import v1AuthMiddleware from "../../../middleware/authMiddleware.js";
import humps from "humps";
import { addDays, addHours, isAfter } from "date-fns";
import { nanoid } from "nanoid";
import { $Enums } from "../../../../generated/prisma/browser.js";
import { rateLimiter } from "../../../middleware/rateLimitter.js";
import { cache } from "../../../middleware/cacheMiddleware.js";

const UrlShortneroute = express.Router();

UrlShortneroute.use(v1AuthMiddleware());

UrlShortneroute.use(
    rateLimiter(kDefaultRateLimitMaxRequest, kDefaultWindowSeconds),
);

UrlShortneroute.get(
    "/",
    cache(60),
    asyncHandler(async (req: Request, res: Response) => {
        let userId = req.store.get(kUserIdStoreKey);

        let history = await prismaClient.urls.findMany({
            where: {
                UserId: userId,
            },
            select: {
                Id: true,
                LongUrl: true,
                ShortUrl: true,
                IsActive: true,
                ExpiresAt: true,
            },
        });

        console.log("THIS key: ", req.store.get(kUserIdStoreKey));

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(history),
                undefined,
            ),
        );
    }),
);

UrlShortneroute.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let sessionId = req.store.get(kUserSessionIdStoreKey);
        let userId = req.store.get(kUserIdStoreKey);
        let parentUrl = cleanUrl(req.body.parentUrl);

        let now = new Date();

        if (!parentUrl) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.InvalidUrl,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let url = parentUrl.toString();

        let longUrlExist = await prismaClient.urls.findFirst({
            where: {
                LongUrl: url,
            },
            select: {
                LongUrl: true,
                ShortUrl: true,
                Clicks: true,
                IsActive: true,
                ExpiresAt: true,
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
                ExpiresAt: addHours(now, kDefaultLinkExpirationTimeHR),
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
                ShortUrl: shortUrlCode,
                ExpiresAt: addHours(now, kDefaultLinkExpirationTimeHR),
                IsActive: true,
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
        let urlId = parseInt(req.body.urlId);
        let longUrl = req.body.longUrl;
        let expiration = new Date(req.body?.expiration);
        let now = new Date();

        if (!expiration) expiration = addDays(now, 1);

        let urlExist = await prismaClient.urls.findFirst({
            where: {
                Id: urlId,
                UserId: userId,
            },
            select: {
                LongUrl: true,
                ShortUrl: true,
                IsActive: true,
                ExpiresAt: true,
            },
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

        let updatedUrl = await prismaClient.urls.update({
            where: {
                Id: urlId,
                UserId: userId,
            },
            data: {
                LongUrl: longUrl,
                ExpiresAt: expiration,
            },
        });

        let history = await prismaClient.history.create({
            data: {
                ChangedById: userId,
                UrlId: urlId,
                PreviousLongUrl: urlExist.LongUrl,
                NewLongUrl: longUrl,
                Action: $Enums.ChangeAction.UPDATE,
            },
            select: {
                Id: true,
                PreviousLongUrl: true,
                NewLongUrl: true,
                Action: true,
                Url: {
                    select: {
                        ShortUrl: true,
                        LongUrl: true,
                        ExpiresAt: true,
                    },
                },
            },
        });

        console.log(updatedUrl);
        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(history),
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
