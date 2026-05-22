import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    generateJwtToken,
    decodeJwtToken,
    sendMailVerificationEmail,
} from "../../../utilities/index.js";
import {
    HandleServerError,
    ErrorType,
    kDefaultSuccessMessage,
    type SignUpBody,
    kDefaultSaltRounds,
    kDefaultAccessTokenExpirationIn,
    kDefaultRefreshTokenExpirationIn,
    $Enums,
} from "../../../constants/index.js";
import { hash } from "bcrypt";
import * as uuid from "uuid";
import { addDays, addMinutes, isAfter } from "date-fns";
import * as humps from "humps";
import { rateLimiter } from "../../../middleware/index.js";

const SignUpRoute = express.Router();

SignUpRoute.post(
    "/",
    rateLimiter(10, 600),
    asyncHandler(async (req: Request, res: Response) => {
        let body: SignUpBody = req.body;

        if (!body.email) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.EmailMissing,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }
        if (!body.password) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.PasswordMissing,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        if (!body.username) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.PasswordMissing,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        // const roleMap = {
        //     user: $Enums.Role.USER,
        //     admin: $Enums.Role.ADMIN,
        // };

        // const roleBody = body.role?.toLowerCase();

        // const role =
        //     roleBody && roleBody in roleMap
        //         ? roleMap[roleBody as keyof typeof roleMap]
        //         : undefined;

        // if (!role) {
        //     let { message, errorCode, statusCode } = HandleServerError(
        //         ErrorType.InvalidRole,
        //     );
        //     res.status(statusCode).json(
        //         systemResponse(false, message, undefined, errorCode),
        //     );
        //     return;
        // }

        let usernameExistQuery = prismaClient.users.findFirst({
            where: { Username: body.username },
        });
        let emailExistQuery = prismaClient.users.findFirst({
            where: { Email: body.email },
        });

        let [usernameExist, emailExist] = await Promise.all([
            usernameExistQuery,
            emailExistQuery,
        ]);

        if (usernameExist) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UsernameAlreadyExist,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }
        if (emailExist) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.EmailAlreadyExist,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        const hashedPassword = await hash(body.password, kDefaultSaltRounds);

        let planExist = await prismaClient.plan.findFirst({
            where: {
                Name: "Free",
            },
            select: {
                Id: true,
                Name: true,
            },
        });

        let transactionResult = await prismaClient.$transaction(async (tx) => {
            let user = await tx.users.create({
                data: {
                    Username: body.username,
                    Email: body.email,
                    Password: hashedPassword,
                    Role: $Enums.Role.USER,
                },
                select: {
                    Id: true,
                    Role: true,
                    EmailVerified: true,
                },
            });

            let subscription = await tx.subscription.create({
                data: {
                    UserId: user.Id,
                    PlanId: planExist!.Id,
                    BillingCycle: $Enums.BillingCycle.Monthly,
                    IsActive: true,
                },
            });
            return { user, subscription };
        });

        let now = new Date();
        let sessionId = uuid.v4();
        let accessTokenExpiration = addDays(now, 1);
        let refreshTokenExpiration = addDays(now, 14);

        let accessToken = generateJwtToken(
            JSON.stringify({
                sessionId: sessionId,
                expiresIn: accessTokenExpiration.getTime(),
            }),
            kDefaultAccessTokenExpirationIn,
        );

        let refreshToken = generateJwtToken(
            JSON.stringify({
                sessionId: sessionId,
                expiresIn: refreshTokenExpiration.getTime(),
                isRefreshToken: true,
            }),
            kDefaultRefreshTokenExpirationIn,
        );

        let expiration = refreshTokenExpiration;

        await prismaClient.userSessions.create({
            data: {
                Id: sessionId,
                UserId: transactionResult.user.Id,
                RefreshToken: refreshToken,
                Expiration: refreshTokenExpiration,
            },
        });

        //EMAIL VERIFICATION SENDING
        let emailVerificationToken = uuid.v4();
        let emailTokenExpiration = addMinutes(now, 15);

        await prismaClient.userToken.create({
            data: {
                UserId: transactionResult.user.Id,
                Token: emailVerificationToken,
                Expiration: emailTokenExpiration,
                Type: $Enums.TokenType.EmailVerification,
            },
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/auth/refresh",
            maxAge: 14 * 24 * 60 * 60 * 1000,
        });

        sendMailVerificationEmail(
            body.email,
            body.username,
            emailVerificationToken,
        );

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                {
                    accessToken: accessToken,
                    expiresIn: expiration.getTime(),
                    role: transactionResult.user.Role,
                },
                undefined,
            ),
        );
    }),
);

export default SignUpRoute;
