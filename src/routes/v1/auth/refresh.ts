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
    kDefaultAccessTokenExpirationIn,
} from "../../../constants/index.js";
import { addDays, isAfter, toDate } from "date-fns";
import { rateLimiter, expressCookieParser } from "../../../middleware/index.js";

const RefreshRoute = express.Router();

RefreshRoute.use(rateLimiter(10, 3000));

RefreshRoute.use(expressCookieParser());

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Refresh the access token using the refresh token stored in http only cookie
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *
 *     responses:
 *       200:
 *         description: refreshed user authentication data
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
 *                   allOf:
 *                     - $ref: "#/components/schemas/ServerError"
 *                   nullable: true
 *       400:
 *         description: Invalid or Expired refresh token
 *       403:
 *         description: Authorization Expired
 *
 *
 */

RefreshRoute.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.RefreshTokenMissing,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        try {
            let decodedJwt = decodeJwtToken(refreshToken);

            if (!decodedJwt.value) {
                throw Error();
            }
            let { sessionId, expiresIn, isRefreshToken } = JSON.parse(
                decodedJwt.value,
            );

            if (!isRefreshToken || isAfter(new Date(), toDate(expiresIn))) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.AuthorizationExpired,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }

            let user = await prismaClient.userSessions.findFirst({
                where: {
                    Id: sessionId,
                },
                select: {
                    Id: true,
                    Expiration: true,
                    RefreshToken: true,
                    User: {
                        select: {
                            Id: true,
                            IsActive: true,
                            Role: true,
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

            if (user.User.IsActive === false) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.UserDeactivated,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }

            let accessTokenExpiration = addDays(new Date(), 1);

            let newAccessToken = generateJwtToken(
                JSON.stringify({
                    sessionId: sessionId,
                    expiresIn: accessTokenExpiration.getTime(),
                }),
                kDefaultAccessTokenExpirationIn,
            );

            res.status(200).json(
                systemResponse(
                    true,
                    kDefaultSuccessMessage,
                    {
                        accessToken: newAccessToken,
                        expiresIn: accessTokenExpiration.getTime(),
                        role: user.User.Role,
                    },
                    undefined,
                ),
            );
        } catch (error) {
            console.log(error);
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.InvalidRefreshToken,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }
    }),
);

export default RefreshRoute;
