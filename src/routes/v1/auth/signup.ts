import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    generateJwtToken,
    decodeJwtToken,
    sendWelcomeEmail,
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
    kUserIdStoreKey,
    kUserEmailStoreKey,
    kDefaultRateLimitMaxRequest,
    kDefaultWindowSeconds,
} from "../../../constants/index.js";
import { hash } from "bcrypt";
import { $Enums } from "../../../../generated/prisma/browser.js";
import * as uuid from "uuid";
import { addDays, addMinutes, isAfter } from "date-fns";
import * as humps from "humps";
import { rateLimiter } from "../../../middleware/rateLimitter.js";

const SignUpRoute = express.Router();

SignUpRoute.post(
    "/",
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

        const roleMap = {
            user: $Enums.Role.USER,
            admin: $Enums.Role.ADMIN,
        };

        const roleBody = body.role?.toLowerCase();

        const role =
            roleBody && roleBody in roleMap
                ? roleMap[roleBody as keyof typeof roleMap]
                : undefined;

        if (!role) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.InvalidRole,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

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

        let user = await prismaClient.users.create({
            data: {
                Username: body.username,
                Email: body.email,
                Password: hashedPassword,
                Role: role,
            },
            select: {
                Id: true,
                Role: true,
                EmailVerified: true,
            },
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
                UserId: user.Id,
                RefreshToken: refreshToken,
                Expiration: refreshTokenExpiration,
            },
        });

        //EMAIL VERIFICATION SENDING
        let emailVerificationToken = uuid.v4();
        let emailTokenExpiration = addMinutes(now, 15);

        await prismaClient.userToken.create({
            data: {
                UserId: user.Id,
                Token: emailVerificationToken,
                Expiration: emailTokenExpiration,
                Type: $Enums.TokenType.EmailVerification,
            },
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
                    refreshToken: refreshToken,
                    expiresIn: expiration.getTime(),
                    role: user.Role,
                },
                undefined,
            ),
        );
    }),
);

SignUpRoute.get(
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

export default SignUpRoute;
