import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    sendEmail,
} from "../../../utilities/index.js";
import {
    ErrorType,
    HandleServerError,
    kDefaultSuccessMessage,
    kDefaultRateLimitMaxRequest,
    kDefaultWindowSeconds,
    kWelcomeEmailSubject,
    kWelcomeHTMLText,
} from "../../../constants/index.js";
import { addMinutes, isAfter } from "date-fns";
import { rateLimiter, v1AuthMiddleware } from "../../../middleware/index.js";
import * as uuid from "uuid";

const VerifyEmailRoute = express.Router();

VerifyEmailRoute.use(
    rateLimiter(kDefaultRateLimitMaxRequest - 90, kDefaultWindowSeconds - 3000),
);

VerifyEmailRoute.get(
    "/",
    rateLimiter(kDefaultRateLimitMaxRequest - 95, kDefaultWindowSeconds - 1800),
    asyncHandler(async (req: Request, res: Response) => {
        let token = String(req.query.token);
        let now = new Date();

        let userTokenExist = await prismaClient.userToken.findUnique({
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

        if (!userTokenExist) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UserUnavailable,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        if (userTokenExist.UsedAt != null) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.VerificationLinkExpired,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        if (isAfter(now, userTokenExist.Expiration)) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.VerificationLinkExpired,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }
        if (userTokenExist.User.EmailVerified === true) {
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
                Id: userTokenExist.Id,
                Token: token,
                UserId: userTokenExist.UserId,
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

        sendEmail(
            userTokenExist.User.Email,
            kWelcomeEmailSubject,
            kWelcomeHTMLText(userTokenExist.User.Username),
        );
        res.status(200).json(
            systemResponse(true, kDefaultSuccessMessage, null, undefined),
        );
    }),
);

export default VerifyEmailRoute;
