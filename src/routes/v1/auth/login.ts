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
} from "../../../constans/index.js";
import { compareSync } from "bcrypt";
import { addDays } from "date-fns";
import * as uuid from "uuid";

const LoginRoute = express.Router();

LoginRoute.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let body: SignUpBody = req.body;

        if (!body.email && !body.username) {
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

        const user = await prismaClient.users.findFirst({
            where: {
                OR: [{ Email: body.email }, { Username: body.username }],
            },
            select: {
                Id: true,
                Email: true,
                Password: true,
                Username: true,
                Role: true,
            },
        });

        if (!user) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UsernameOrEmailUnavailable,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        if (!user.Password || !compareSync(body.password, user.Password)) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.IncorrectPassword,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

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
                expiresIn: refreshTokenExpiration,
            }),
            kDefaultRefreshTokenExpirationIn,
        );

        let expiration = refreshTokenExpiration;

        await prismaClient.userSessions.create({
            data: {
                Id: sessionId,
                UserId: user.Id,
                Expiration: expiration,
                RefreshToken: refreshToken,
            },
        });

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    role: user.Role,
                },
                undefined,
            ),
        );
    }),
);

export default LoginRoute;
