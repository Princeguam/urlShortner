import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    generateJwtToken,
    prismaClient,
    systemResponse,
} from "../../../utilities/index.js";
import {
    HandleServerError,
    ErrorType,
    kDefaultSuccessMessage,
    type SignUpBody,
    kDefaultAccessTokenExpirationIn,
    kDefaultRefreshTokenExpirationIn,
    kDefaultRateLimitMaxRequest,
    kDefaultWindowSeconds,
    kUserIdStoreKey,
    kRrefreshTokenKey,
} from "../../../constants/index.js";
import { rateLimiter } from "../../../middleware/index.js";
import { compareSync } from "bcrypt";
import { addDays } from "date-fns";
import * as uuid from "uuid";
import { kHttpOnlyCookieOption } from "../../../constants/objects.js";

const LogoutRoute = express.Router();

LogoutRoute.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let userId = req.store.get(kUserIdStoreKey);
        let refreshToken = req.cookies.refreshToken;
        let body = req.body;

        if (!body.allDevices) {
            await prismaClient.userSessions.deleteMany({
                where: {
                    RefreshToken: refreshToken,
                },
            });
        } else {
            await prismaClient.userSessions.deleteMany({
                where: {
                    UserId: userId,
                },
            });
        }

        res.clearCookie(kRrefreshTokenKey, kHttpOnlyCookieOption); // clear the httpOnly cookie

        res.status(200).json(
            systemResponse(true, kDefaultSuccessMessage, null, undefined),
        );
    }),
);
