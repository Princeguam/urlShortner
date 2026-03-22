import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    generateJwtToken,
} from "../../../utilities/index.js";
import {
    HandleServerError,
    ErrorType,
    kDefaultSuccessMessage,
    type SignUpBody,
    kDefaultSaltRounds,
    kDefaultAccessTokenExpirationIn,
    kDefaultRefreshTokenExpirationIn,
} from "../../../constans/index.js";
import { hash } from "bcrypt";
import { $Enums } from "../../../../generated/prisma/browser.js";
import * as uuid from "uuid";
import { addDays, isAfter } from "date-fns";
import * as humps from "humps";

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

export default SignUpRoute;
