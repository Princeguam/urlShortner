import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    base62Encode,
    cleanUrl,
} from "../../../utilities/index.js";
import {
    ErrorType,
    HandleServerError,
    kUserEmailStoreKey,
    kUsernameStoreKey,
    kUserSessionIdStoreKey,
    kDefaultSuccessMessage,
    kUserIdStoreKey,
    kBaseUrl,
    kDefaultLinkExpirationTimeHR,
} from "../../../constans/index.js";
import v1AuthMiddleware from "../../../middleware/authMiddleware.js";
import humps from "humps";
import { addHours } from "date-fns";
import { nanoid } from "nanoid";

const UrlShortneroute = express.Router();

UrlShortneroute.use(v1AuthMiddleware());

UrlShortneroute.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let email = req.store.get(kUserEmailStoreKey);
        let username = req.store.get(kUsernameStoreKey);
        let userId = req.store.get(kUserIdStoreKey);

        let history = await prismaClient.urls.findMany({
            where: {
                UserId: userId,
            },
            select: {
                Id: true,
                LongUrl: true,
                ShortUrl: true,
                IsActive: true,
                ExpiresAt: true,
            },
        });

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(history),
                undefined,
            ),
        );
    }),
);

UrlShortneroute.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        let sessionId = req.store.get(kUserSessionIdStoreKey);
        let userId = req.store.get(kUserIdStoreKey);
        let parentUrl = cleanUrl(req.body.parentUrl);

        let now = new Date();

        if (!parentUrl) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.InvalidUrl,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let url = parentUrl.toString();

        let longUrlExist = await prismaClient.urls.findFirst({
            where: {
                LongUrl: url,
            },
            select: {
                LongUrl: true,
                ShortUrl: true,
                Clicks: true,
                IsActive: true,
                ExpiresAt: true,
            },
        });

        if (longUrlExist) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.UrlAlreadyExist,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let registerUrl = await prismaClient.urls.create({
            data: {
                UserId: userId,
                LongUrl: url,
                ExpiresAt: addHours(now, kDefaultLinkExpirationTimeHR),
            },
            select: {
                Id: true,
            },
        });

        let shortUrlCode = `${base62Encode(registerUrl.Id)}${nanoid(4)}`;

        let updateUrls = await prismaClient.urls.update({
            where: {
                Id: registerUrl.Id,
            },
            data: {
                ShortUrl: shortUrlCode,
                ExpiresAt: addHours(now, kDefaultLinkExpirationTimeHR),
                IsActive: true,
            },
        });

        let pageData = {
            Id: updateUrls.Id,
            LongUrl: updateUrls.LongUrl,
            ShortUrl: `${kBaseUrl}${updateUrls.ShortUrl}`,
            Clicks: updateUrls.Clicks,
            IsActive: updateUrls.IsActive,
            Expiration: updateUrls.ExpiresAt,
        };

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(pageData),
                undefined,
            ),
        );
    }),
);

export default UrlShortneroute;
