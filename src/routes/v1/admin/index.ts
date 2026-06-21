import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    convertToBoolean,
    Prisma,
    getSkippedPrismaVale,
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
    kDefaultRateLimitMaxRequest,
    kDefaultWindowSeconds,
    kDefaultSearchQuery,
    kDefaultQueryCount,
    kDefaultQueryPage,
    $Types,
    $Enums,
} from "../../../constants/index.js";
import humps from "humps";
import { addDays, addHours, isAfter } from "date-fns";
import { nanoid } from "nanoid";
import {
    rateLimiter,
    v1AuthMiddleware,
    userRolePermit,
} from "../../../middleware/index.js";
import PlanRoute from "../plan/index.js";

const AdminRoute = express.Router();

AdminRoute.use(v1AuthMiddleware());
AdminRoute.use(userRolePermit());
AdminRoute.use(rateLimiter(kDefaultRateLimitMaxRequest, kDefaultWindowSeconds));

type ArrangeBy = "Username" | "Email" | "IsActive" | "Created";

type ArrangeOrder = "asc" | "desc";

AdminRoute.get(
    "/all",
    asyncHandler(async (req: Request, res: Response) => {
        let userId = req.store.get(kUserIdStoreKey);

        let url = new URL(req.url || String(), `http://${req.headers.host}`);
        let search = url.searchParams.get("search") || kDefaultSearchQuery;

        let count = Number(url.searchParams.get("count") || kDefaultQueryCount);
        count = !isNaN(count) ? count : kDefaultQueryCount;
        count = Math.min(Math.max(0, count), kDefaultQueryCount);

        let page = Number(url.searchParams.get("page") || kDefaultQueryPage);
        page = !isNaN(page) ? page : kDefaultQueryPage;

        let getAllRecord =
            url.searchParams.get("all") &&
            convertToBoolean(url.searchParams.get("all"));

        let searchOrderBy: ArrangeBy = "Created";

        if (url.searchParams.has("by")) {
            let searchParamValue =
                String(url.searchParams.get("by")) || String();
            searchOrderBy = [
                "Username",
                "Email",
                "IsActive",
                "Created",
            ].includes(searchParamValue)
                ? (searchParamValue as ArrangeBy)
                : "Created";
        }

        let searchOrder: ArrangeOrder = "desc";
        if (url.searchParams.has("order")) {
            let searchParamValue =
                String(url.searchParams.get("order")) || String();
            searchOrder = ["asc", "desc"].includes(searchParamValue)
                ? (searchParamValue as ArrangeOrder)
                : "asc";
        }

        let orderBy = {
            [searchOrderBy]: searchOrder,
        };

        if (searchOrderBy == "Email") {
            orderBy = {
                Email: searchOrder,
            };
        } else if (searchOrderBy == "Username") {
            orderBy = {
                Username: searchOrder,
            };
        } else if (searchOrderBy == "IsActive") {
            orderBy = {
                ShortUrl: searchOrder,
            };
        }

        let whereClause: Prisma.UsersWhereInput = {
            ...(search && {
                OR: [
                    {
                        Email: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        Username: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            }),
        };

        let [totalItems, users] = await prismaClient.$transaction([
            prismaClient.users.count({ where: whereClause }),
            prismaClient.users.findMany({
                where: whereClause,
                orderBy: orderBy,
                select: $Types.User,
                take: !getAllRecord ? count : kDefaultQueryCount,
                skip: !getAllRecord ? getSkippedPrismaVale(page, count) : 0,
            }),
        ]);

        // ADD PAGINATION TO THIS ENDPOINT AS WELL

        let pageData = users.map(({ Username, Created, ...otherData }) => ({
            Username: Username,
            Created: Created,
            ...otherData,
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

export default AdminRoute;
