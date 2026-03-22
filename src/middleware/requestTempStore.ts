import type { NextFunction, Request, Response } from "express";

declare global {
    namespace Express {
        interface Request {
            store: Map<string, any>;
        }
    }
}

export function requestTempStore() {
    return function (req: Request, _: Response, next: NextFunction) {
        req.store = new Map();
        next();
    };
}
