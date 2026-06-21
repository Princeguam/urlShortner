import type { CookieOptions } from "express";
import { kDefaultRefreshTokenExpiration } from "./index.js";

export const kHttpOnlyCookieOption: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/auth/refresh",
    maxAge: kDefaultRefreshTokenExpiration,
};
