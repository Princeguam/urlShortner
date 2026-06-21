import express from "express";
import type { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { decodeJwtToken, systemResponse } from "../utilities/index.js";
import { kUserRoleStoreKey } from "../constants/strings.js";
import { ErrorType, HandleServerError, $Enums } from "../constants/index.js";

export function userRolePermit() {
    return asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const allowedRole = $Enums.Role.ADMIN;
            const role = req.store.get(kUserRoleStoreKey);

            if (!role) {
                console.log("NO USER ROLE YET");
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.UserUnavailable,
                );
                res.status(statusCode).json(
                    systemResponse(false, message, undefined, errorCode),
                );
                return;
            }
            if (role != allowedRole) {
                let { message, errorCode, statusCode } = HandleServerError(
                    ErrorType.NotAuthorized,
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
