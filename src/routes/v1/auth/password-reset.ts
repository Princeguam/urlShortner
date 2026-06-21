import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    decodeJwtToken,
    generateJwtToken,
    prismaClient,
    sendEmail,
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
    $Enums,
    kForgotPasswordSubject,
    kForgotPasswordHTMLText,
    kDefaultSaltRounds,
    kRrefreshTokenKey,
} from "../../../constants/index.js";
import { rateLimiter, v1AuthMiddleware } from "../../../middleware/index.js";
import { compareSync, hash } from "bcrypt";
import { addDays, addMinutes, isAfter } from "date-fns";
import * as uuid from "uuid";
import { kHttpOnlyCookieOption } from "../../../constants/objects.js";

const PasswordResetRoute = express.Router();

PasswordResetRoute.use(
    rateLimiter(kDefaultRateLimitMaxRequest, kDefaultWindowSeconds),
);

interface PasswordRestBody {
    newPassword: string;
    token: string;
}

PasswordResetRoute.get(
    "/verify",
    asyncHandler(async (req: Request, res: Response) => {
        let token = String(req.query.token);
        let now = new Date();

        try {
            let decoded = decodeJwtToken(token);

            if (!decoded.value) {
                throw new Error();
            }

            // the token is saved as sessionId to follow the same pattern as other jwt signing

            let { sessionId, expiresIn } = JSON.parse(decoded.value);

            if (!sessionId) {
                throw new Error();
            }

            let userToken = await prismaClient.userToken.findFirst({
                where: {
                    Token: sessionId,
                    Type: $Enums.TokenType.PasswordReset,
                },
                select: {
                    Id: true,
                    Expiration: true,
                    UsedAt: true,
                    UserId: true,
                },
            });

            if (!userToken) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.InvalidToken,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }

            if (isAfter(now, userToken?.Expiration)) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.VerificationLinkExpired,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }

            // here if the token used at is not null, throw an error to say the verification link is expired
            if (userToken.UsedAt) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.VerificationLinkExpired,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }

            res.status(200).json(
                systemResponse(true, kDefaultSuccessMessage, null, undefined),
            );
        } catch (err) {
            console.error(err);
            // add a way to catch any other error so it does not just fail silently
        }
    }),
);

PasswordResetRoute.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let body: PasswordRestBody = req.body;
        let now = new Date();

        try {
            let decoded = decodeJwtToken(body.token);

            if (!decoded.value) {
                throw new Error();
            }

            // the token is saved as sessionId to follow the same pattern as other jwt signing

            let { sessionId, expiresIn } = JSON.parse(decoded.value);

            if (!sessionId) {
                throw new Error();
            }

            let userToken = await prismaClient.userToken.findFirst({
                where: {
                    Token: sessionId,
                    Type: $Enums.TokenType.PasswordReset,
                },
                select: {
                    Id: true,
                    Expiration: true,
                    UsedAt: true,
                    UserId: true,
                },
            });

            if (!userToken) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.InvalidToken,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }

            if (isAfter(now, userToken?.Expiration)) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.VerificationLinkExpired,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }

            // here if the token used at is not null, throw an error to say the verification link is expired
            if (userToken.UsedAt) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.VerificationLinkExpired,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }

            const hashedPassword = await hash(
                body.newPassword,
                kDefaultSaltRounds,
            );

            let userExist = await prismaClient.users.findFirst({
                where: {
                    Id: userToken.UserId,
                },
                select: {
                    Id: true,
                    Email: true,
                    Role: true,
                    IsDeleted: true,
                    IsActive: true,
                    EmailVerified: true,
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
            if (!userExist.IsActive || userExist.IsDeleted) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.UserDeactivated,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }

            let newNow = new Date();
            let newSessionId = uuid.v4();
            let accessTokenExpiration = addMinutes(newNow, 30);
            let refreshTokenExpiration = addDays(newNow, 7);

            let accessToken = generateJwtToken(
                JSON.stringify({
                    sessionId: newSessionId,
                    expiresIn: accessTokenExpiration.getTime(),
                }),
                kDefaultAccessTokenExpirationIn,
            );

            let refreshToken = generateJwtToken(
                JSON.stringify({
                    sessionId: newSessionId,
                    expiresIn: refreshTokenExpiration,
                    isRefreshToken: true,
                }),
                kDefaultRefreshTokenExpirationIn,
            );
            let expiration = refreshTokenExpiration;

            await prismaClient.$transaction(async (tx) => {
                await tx.userSessions.deleteMany({
                    where: {
                        UserId: userExist.Id,
                    },
                });

                await tx.users.update({
                    where: {
                        Id: userExist.Id,
                    },
                    data: {
                        Password: hashedPassword,
                    },
                });

                await tx.userToken.update({
                    where: {
                        Id: userToken.Id,
                    },
                    data: {
                        UsedAt: new Date(),
                    },
                });
                await prismaClient.userSessions.create({
                    data: {
                        Id: newSessionId,
                        UserId: userExist.Id,
                        Expiration: expiration,
                        RefreshToken: refreshToken,
                    },
                });
            });

            res.cookie(kRrefreshTokenKey, refreshToken, kHttpOnlyCookieOption); // httpOnly cookie is set here

            res.status(200).json(
                systemResponse(
                    true,
                    kDefaultSuccessMessage,
                    {
                        accessToken: accessToken,
                        expiresIn: accessTokenExpiration.getTime(),
                        role: userExist.Role,
                        emailVerified: userExist.EmailVerified,
                    },
                    undefined,
                ),
            );
        } catch (err) {
            console.error(err);

            // do something here to catch the error
        }
    }),
);

export default PasswordResetRoute;
