import jwt from "jsonwebtoken";
import { BASE62 } from "../constants/index.js";

if (!process.env.JWT_SECRET) {
    throw new Error(
        "JWT_SECRET is undefined, generate one and declare it in .env",
    );
}

const JWT_SECRET = process.env.JWT_SECRET;

export function decodeJwtToken(token: string): {
    value?: string;
    error?: string;
} {
    const payload = jwt.verify(token, JWT_SECRET) as { value: string };

    if (!payload?.value) {
        return { error: "invalid token" };
    }

    return { value: payload.value };
}

export function generateJwtToken(value: string, expiresIn?: string): string {
    const jwtPayload = { value };

    if (expiresIn) {
        const options = { expiresIn };
        return jwt.sign(jwtPayload, JWT_SECRET, {
            // a way to improve this is to add an algorithm to the jwt sigining
            expiresIn: expiresIn as any,
        });
    } else {
        return jwt.sign(jwtPayload, JWT_SECRET);
    }
}

export function base62Encode(num: number): string {
    if (num === 0) return "0";

    let result = "";
    while (num > 0) {
        let remainder = num % 62;
        result = BASE62[remainder] + result;
        num = Math.floor(num / 62);
    }
    return result;
}

export function base62Decode(str: string): number {
    let num = 0;
    for (const char of str) {
        const index = BASE62.indexOf(char);
        num = num * 62 + index;
    }
    return num;
}
export function cleanUrl(url: string) {
    if (!url) return null;
    try {
        return new URL(url);
    } catch {
        try {
            return new URL("https://", url);
        } catch {
            return null;
        }
    }
}
export function convertToBoolean(value: string | number | null) {
    if (typeof value == "boolean") return value;
    if (typeof value == "number") return value !== 0;
    if (value === null) return false;

    if (typeof value == "string") {
        switch (value.trim().toLowerCase()) {
            case "true":
            case "t":
            case "1":
            case "yes":
            case "y":
            case "on":
                return true;
            case "false":
            case "f":
            case "0":
            case "no":
            case "n":
            case "off":
                return false;
        }
    }

    if (typeof value == "number") {
        return value !== 0;
    }

    return Boolean(value);
}

export function getSkippedPrismaVale(page: number, count: number): number {
    return Math.max((page - 1) * count, 0);
}

export function getReferrerSource(value: string | null): string {
    if (!value) return "Default";
    let referrer = new URL(value).hostname.replace("/^www./", "");
    return referrer;
}

export * from "./paystack.js";
export * from "./sendResponse.js";
export * from "./prismaClient.js";
export * from "./email.js";
export * from "./redis.js";
