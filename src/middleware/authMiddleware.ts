import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import {
    decodeJwtToken,
    systemResponse,
    prismaClient,
} from "../utilities/index.js";
import asyncHandler from "express-async-handler";
import {
    ErrorType,
    HandleServerError,
    kUserIdStoreKey,
    kUserSessionIdStoreKey,
    kUsernameStoreKey,
    kUserRoleStoreKey,
    kUserEmailStoreKey,
} from "../constans/index.js";
import { isAfter, toDate } from "date-fns";
export function v1AuthMiddleware() {
    return asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.AuthorizationMissing,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }
            let token = (authHeader && authHeader.split(" ")[1]) || undefined;

            if (!token) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.AuthorizationMissing,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }

            try {
                let decodedJwt = decodeJwtToken(token);

                if (!decodedJwt.value) {
                    throw new Error();
                }
                let { sessionId, expiresIn } = JSON.parse(decodedJwt.value);

                if (!sessionId || !expiresIn) {
                    throw new Error();
                }

                if (isAfter(Date.now(), toDate(expiresIn))) {
                    let { message, errorCode, statusCode } = HandleServerError(
                        ErrorType.AuthorizationExpired,
                    );
                    res.status(statusCode).json(
                        systemResponse(false, message, undefined, errorCode),
                    );
                    return;
                }

                let session = await prismaClient.userSessions.findUnique({
                    where: {
                        Id: sessionId,
                    },
                    select: {
                        Id: true,
                        Created: true,
                        User: {
                            select: {
                                Id: true,
                                Username: true,
                                Email: true,
                                Role: true,
                            },
                        },
                    },
                });

                if (!session) throw new Error();

                req.store.set(kUserIdStoreKey, session.User.Id);
                req.store.set(kUserRoleStoreKey, session.User.Role);
                req.store.set(kUserSessionIdStoreKey, session.Id);
                req.store.set(kUsernameStoreKey, session.User.Username);
                req.store.set(kUserEmailStoreKey, session.User.Email);
            } catch (err) {
                console.log(err);
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.AuthorizationInvalid,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }
            next();
        },
    );
}

export default v1AuthMiddleware;
