export interface SignUpBody {
    username: string;
    email: string;
    password: string;
}

export * from "./error.js";
export * from "./strings.js";
export * from "./values.js";
export { $Enums } from "../generated/prisma/browser.js";
export * as $Types from "./prisma-types.js";
