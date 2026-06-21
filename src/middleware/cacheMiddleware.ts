import type { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";

import { redisClient } from "../utilities/index.js";
import { kDefaultCacheKey, kDefaultRedirectKey } from "../constants/strings.js";

type CacheType = "json" | "redirect";

interface CacheOptions {
    ttlSeconds: number;
    resType?: CacheType;
    onCacheHit?: (req: Request) => void; // this is to add more functionality if the cache is hit and some form of analytics need to be done
}

export function cache(option: CacheOptions) {
    const { ttlSeconds, resType = "json" } = option;
    return asyncHandler(
        async (
            req: Request,
            res: Response,
            next: NextFunction,
        ): Promise<void> => {
            let key =
                resType == "redirect"
                    ? `${kDefaultRedirectKey}:${req.params.shortCode}`
                    : `${kDefaultCacheKey}:${req.originalUrl}`;

            try {
                console.time("request");

                let cachedPromise = redisClient.get(key);

                let cached = await cachedPromise;

                if (cached) {
                    if (resType === "redirect") {
                        console.timeEnd("request");
                        console.log("CACHED NOW");
                        option.onCacheHit?.(req);
                        res.redirect(cached);
                    } else {
                        res.json(JSON.parse(cached));
                        console.timeEnd("request");
                    }
                    return;
                }

                console.log("NOT CACHED YET");

                if (resType === "redirect") {
                    let originalRedirect = res.redirect.bind(res);
                    (res.redirect as any) = (
                        urlOrString: string | number,
                        url?: string,
                    ): void => {
                        let redirectUrl =
                            typeof urlOrString === "string"
                                ? urlOrString
                                : url!;
                        redisClient.setex(key, ttlSeconds, redirectUrl);
                        console.timeEnd("request");
                        return originalRedirect(urlOrString as any, url as any);
                    };
                } else {
                    let originalJson = res.json.bind(res);
                    res.json = (body: any) => {
                        if (res.statusCode == 200 || body?.success === true) {
                            redisClient.setex(
                                key,
                                ttlSeconds,
                                JSON.stringify(body),
                            );
                        }
                        console.timeEnd("request");
                        return originalJson(body);
                    };
                }

                next();
            } catch (error) {
                console.error("Cache Error: ", error);
                next();
            }
        },
    );
}

export async function invalidateCache(resType: CacheType, pattern: string) {
    let key =
        resType === "redirect"
            ? `${kDefaultRedirectKey}:${pattern}`
            : `${kDefaultCacheKey}:${pattern}`;

    try {
        let wildcardKey = resType === "redirect" ? key : `${key}*`;
        let keys = await redisClient.keys(`${wildcardKey}*`);
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`${resType} Cache invalidated, key: `, keys);
        }
    } catch (err) {
        console.error("Cache Invalidation Error: ", err);
    }

    console.log("DONE");
}
