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
    kDefaultRefreshTokenExpiration,
} from "../../../constants/index.js";
import { rateLimiter } from "../../../middleware/index.js";
import { compareSync } from "bcrypt";
import { addDays } from "date-fns";
import * as uuid from "uuid";
import { kHttpOnlyCookieOption } from "../../../constants/objects.js";

const LoginRoute = express.Router();

const loginMaxRequest = kDefaultRateLimitMaxRequest - 95;
const loginWindowSeconds = kDefaultWindowSeconds - 3200;

LoginRoute.use(rateLimiter(loginMaxRequest, loginWindowSeconds));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login a user
 *     description: Authenticate user and return access token
 *     requestBody:
 *       required: true
 *       content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/LoginRequestBody"
 *     responses:
 *       200:
 *         description: The user authentication data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Request Successful"
 *                 data:
 *                   $ref: "#/components/schemas/Auth"
 *                 error:
 *                   $ref: "#/components/schemas/ServerError"
 *                   nullable: true
 *       400:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Password Incorrect"
 *                 data:
 *                   $ref: "#/components/schemas/Auth"
 *                   nullable: true,
 *                   example: null
 *                 error:
 *                   $ref: "#/components/schemas/ServerError"
 *
 *
 *
 *
 *
 */
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
                EmailVerified: true,
                IsActive: true,
                IsDeleted: true,
            },
        });

        if (!user) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.IncorrectPassword,
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

        if (user.IsDeleted) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UserDeactivated,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let now = new Date();
        let sessionId = uuid.v4();
        let accessTokenExpiration = addDays(now, 1);
        let refreshTokenExpiration = addDays(now, 7);

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
                isRefreshToken: true,
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

        res.cookie(kRrefreshTokenKey, refreshToken, kHttpOnlyCookieOption); // set httpOnly cookie

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                {
                    accessToken: accessToken,
                    expiresIn: accessTokenExpiration.getTime(),
                    role: user.Role,
                    emailVerified: user.EmailVerified,
                },
                undefined,
            ),
        );
    }),
);

export default LoginRoute;

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequestBody:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: The user's email
 *           example: "example@email.com"
 *         password:
 *           type: string
 *           description: The user's password
 *           example: password
 *
 */
