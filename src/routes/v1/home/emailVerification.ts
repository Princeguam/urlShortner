import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    sendMailVerificationEmail,
    sendWelcomeEmail,
} from "../../../utilities/index.js";
import {
    ErrorType,
    HandleServerError,
    kDefaultSuccessMessage,
    kUserIdStoreKey,
    kDefaultRateLimitMaxRequest,
    kDefaultWindowSeconds,
    kUsernameStoreKey,
    kUserEmailStoreKey,
} from "../../../constants/index.js";
import { addMinutes, isAfter } from "date-fns";
import { $Enums } from "../../../../generated/prisma/browser.js";
import { rateLimiter, v1AuthMiddleware } from "../../../middleware/index.js";
import * as uuid from "uuid";

const EmailRoute = express.Router();

EmailRoute.use(
    rateLimiter(kDefaultRateLimitMaxRequest - 90, kDefaultWindowSeconds - 3000),
);
EmailRoute.use(v1AuthMiddleware());

EmailRoute.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let userId = req.store.get(kUserIdStoreKey);
        let username = req.store.get(kUsernameStoreKey);
        let userEmail = req.store.get(kUserEmailStoreKey);
        let now = new Date();

        let user = await prismaClient.users.findUnique({
            where: {
                Id: userId,
                Email: userEmail,
            },
            select: {
                Id: true,
                Email: true,
                Role: true,
                EmailVerified: true,
            },
        });

        let emailVerify = await prismaClient.userToken.findFirst({
            where: {
                UserId: userId,
                Type: $Enums.TokenType.EmailVerification,
            },
            select: {
                Id: true,
                Token: true,
                UsedAt: true,
                Expiration: true,
            },
        });

        if (user?.EmailVerified === true) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.EmailAlreadyVerfified,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        if (emailVerify?.UsedAt) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.EmailAlreadyVerfified,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        // if (emailVerify && isAfter(now, emailVerify.Expiration)) {
        //     let { message, errorCode, statusCode } = HandleServerError(
        //         ErrorType.VerificationLinkExpired,
        //     );
        //     res.status(statusCode).json(
        //         systemResponse(false, message, undefined, errorCode),
        //     );
        //     return;
        // }

        let emailToken = uuid.v4();
        let expiration = addMinutes(now, 30);

        let emailVerification = await prismaClient.userToken.upsert({
            where: {
                UserId_Type: {
                    UserId: userId,
                    Type: $Enums.TokenType.EmailVerification,
                },
            },
            update: {
                Token: emailToken,
                Expiration: expiration,
            },
            create: {
                Token: emailToken,
                UserId: userId,
                Type: $Enums.TokenType.EmailVerification,
                Expiration: expiration,
            },
        });
        sendMailVerificationEmail(userEmail, username, emailToken);
        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                emailVerification,
                undefined,
            ),
        );
    }),
);

EmailRoute.get(
    "/verify",
    rateLimiter(kDefaultRateLimitMaxRequest - 95, kDefaultWindowSeconds - 1800),
    asyncHandler(async (req: Request, res: Response) => {
        let token = String(req.query.token);
        let now = new Date();

        let user = await prismaClient.userToken.findUnique({
            where: {
                Token: token,
            },
            select: {
                Id: true,
                UserId: true,
                Expiration: true,
                Type: true,
                UsedAt: true,
                User: {
                    select: {
                        EmailVerified: true,
                        Email: true,
                        Username: true,
                    },
                },
            },
        });

        if (!user) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UserUnavailable,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        if (user.UsedAt != null) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.VerificationLinkExpired,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        if (isAfter(now, user.Expiration)) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.VerificationLinkExpired,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }
        if (user.User.EmailVerified === true) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.EmailAlreadyVerfified,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        await prismaClient.userToken.update({
            where: {
                Token: token,
                UserId: user.UserId,
            },
            data: {
                UsedAt: new Date(),
                User: {
                    update: {
                        data: {
                            EmailVerified: true,
                        },
                    },
                },
            },
        });

        sendWelcomeEmail(user.User.Email, user.User.Username);
        res.status(200).json(
            systemResponse(true, kDefaultSuccessMessage, null, undefined),
        );
    }),
);

export default EmailRoute;
