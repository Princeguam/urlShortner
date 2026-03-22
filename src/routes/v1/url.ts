import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    cleanUrl,
    base62Encode,
    base62Decode,
} from "../../utilities/index.js";
import {
    ErrorType,
    HandleServerError,
    kUserIdStoreKey,
} from "../../constans/index.js";
import { isAfter } from "date-fns";

const RedirectRoute = express.Router();

RedirectRoute.get(
    "/:shortCode",
    asyncHandler(async (req: Request, res: Response) => {
        let url = req.params.shortCode?.toString();
        let now = new Date();

        if (!url) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UrlExpired,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let decode = base62Decode(url.slice(0, -4));
        let getUrl = await prismaClient.urls.findFirst({
            where: {
                Id: decode,
                ShortUrl: url,
            },
            select: {
                Id: true,
                LongUrl: true,
                ShortUrl: true,
                IsActive: true,
                Clicks: true,
                ExpiresAt: true,
            },
        });

        if (!getUrl) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UrlNotAvailable,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        await prismaClient.urls.update({
            where: {
                Id: getUrl.Id,
            },
            data: {
                Clicks: { increment: 1 },
            },
        });

        if (isAfter(now, getUrl.ExpiresAt) || getUrl.IsActive == false) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UrlExpired,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        await prismaClient.clickLogs.create({
            data: {
                UserAgent: req.useragent?.browser.toString() ?? null,
                IpAddress: req.ip?.toString() ?? null,
                UrlId: getUrl.Id,
            },
            select: {
                IpAddress: true,
                UserAgent: true,
                UrlId: true,
            },
        });

        res.redirect(302, getUrl.LongUrl);
    }),
);

export default RedirectRoute;
