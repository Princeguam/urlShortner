import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import { systemResponse, prismaClient } from "../../../utilities/index.js";
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
} from "../../../constants/index.js";
import humps from "humps";
import { addDays, addHours, isAfter } from "date-fns";
import { nanoid } from "nanoid";
import { $Enums } from "../../../../generated/prisma/browser.js";
import {
    rateLimiter,
    v1AuthMiddleware,
    userRolePermit,
} from "../../../middleware/index.js";
import PlanRoute from "./plan.js";

const AdminRoute = express.Router();

AdminRoute.use(v1AuthMiddleware());
AdminRoute.use(userRolePermit());
AdminRoute.use(rateLimiter(kDefaultRateLimitMaxRequest, kDefaultWindowSeconds));

AdminRoute.get(
    "/all",
    asyncHandler(async (req: Request, res: Response) => {
        let userId = req.store.get(kUserIdStoreKey);

        let users = await prismaClient.users.findMany({
            select: {
                Id: true,
                Username: true,
                Created: true,
                Role: true,
                Url: {
                    select: {
                        Id: true,
                        LongUrl: true,
                        ShortUrl: true,
                        IsActive: true,
                        ExpiresAt: true,
                        Clicks: true,
                    },
                },
            },
        });

        // ADD PAGINATION TO THIS ENDPOINT AS WELL

        let pageData = users.map(({ Username, Created, ...otherData }) => ({
            Username: Username,
            Created: Created,
            ...otherData,
        }));
        res.status(200).json(
            systemResponse(true, kDefaultSuccessMessage, pageData, undefined),
        );
    }),
);

AdminRoute.use("/plan", PlanRoute);

export default AdminRoute;
