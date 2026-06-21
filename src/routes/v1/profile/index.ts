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
    $Enums,
} from "../../../constants/index.js";
import humps from "humps";
import {
    rateLimiter,
    v1AuthMiddleware,
    cache,
    invalidateCache,
} from "../../../middleware/index.js";

const ProfileRoute = express.Router();

ProfileRoute.use(v1AuthMiddleware());

ProfileRoute.get(
    "/",
    cache({ ttlSeconds: 60 }),
    asyncHandler(async (req: Request, res: Response) => {
        let userId = req.store.get(kUserIdStoreKey);

        let profile = await prismaClient.users.findFirst({
            where: {
                Id: userId,
            },
            select: {
                Id: true,
                IsActive: true,
                Username: true,
                Email: true,
                EmailVerified: true,
                IsDeleted: true,
            },
        });

        if (!profile || profile.IsActive === false) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UserUnavailable,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }
        if (profile.IsDeleted) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UserDeactivated,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        res.status(200).json(
            systemResponse(true, kDefaultSuccessMessage, profile, undefined),
        );
    }),
);

// ADD THAT WHEN DELETING A USER, A SOFT DELETE IS WHAT IS TO BE APPLIED NOT TO DELETE THE USERS DATA COMPLETELY

ProfileRoute.get(
    "/analytics",
    asyncHandler(async (req: Request, res: Response) => {
        let userId = req.store.get(kUserIdStoreKey);

        // for the profile analytics, the

        res.status(200).json(
            systemResponse(true, kDefaultSuccessMessage, null, undefined),
        );
    }),
);

export default ProfileRoute;
