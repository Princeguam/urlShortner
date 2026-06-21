import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    generateJwtToken,
    prismaClient,
    sendEmail,
    systemResponse,
} from "../../../utilities/index.js";
import {
    HandleServerError,
    ErrorType,
    kDefaultSuccessMessage,
    kDefaultRateLimitMaxRequest,
    kDefaultWindowSeconds,
    $Enums,
    kForgotPasswordSubject,
    kForgotPasswordHTMLText,
} from "../../../constants/index.js";
import { rateLimiter } from "../../../middleware/index.js";
import { addDays, addMinutes } from "date-fns";
import * as uuid from "uuid";
import { publish } from "../../../worker/producer.js";

const ForgotPasswordRoute = express.Router();

ForgotPasswordRoute.use(
    rateLimiter(kDefaultRateLimitMaxRequest, kDefaultWindowSeconds),
);

ForgotPasswordRoute.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let email: string = req.body.email.toLowerCase();

        if (!email) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.EmailMissing,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let userExist = await prismaClient.users.findFirst({
            where: {
                Email: email,
            },
            select: {
                Id: true,
                IsActive: true,
                Username: true,
            },
        });

        if (!userExist) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UserUnavailable,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        if (!userExist.IsActive) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UserUnavailable,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let now = new Date();

        let sessionId = uuid.v4();
        let tokenExpiration = addMinutes(now, 15);

        let token = generateJwtToken(
            JSON.stringify({
                token: sessionId,
                expiresIn: tokenExpiration.getTime(),
            }),
            "15m",
        );

        await prismaClient.userToken.create({
            data: {
                UserId: userExist.Id,
                Token: token,
                Expiration: tokenExpiration,
                Type: $Enums.TokenType.PasswordReset,
            },
        });

        // worker to send the email work to rabbitmq
        publish("email.send", {
            to: email,
            subject: kForgotPasswordSubject,
            name: userExist.Username,
            template: "forgot-password",
        });

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                "emailSent",
                undefined,
            ),
        );
    }),
);

export default ForgotPasswordRoute;
