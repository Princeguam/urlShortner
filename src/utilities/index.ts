import jwt from "jsonwebtoken";
import { BASE62 } from "../constants/index.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "MY SECRET";

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
export * from "./sendResponse.js";
export * from "./prismaClient.js";
export * from "./email.js";
