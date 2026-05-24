import express from "express";
import LoginRoute from "./login.js";
import SignUpRoute from "./signup.js";
import RefreshRoute from "./refresh.js";

const AuthRoute = express.Router();

AuthRoute.use("/login", LoginRoute);
AuthRoute.use("/signup", SignUpRoute);
AuthRoute.use("/refresh", RefreshRoute);

export default AuthRoute;

/**
 * @swagger
 * components:
 *  schemas:
 *      Auth:
 *        type: object
 *        properties:
 *          accessToken:
 *            type: string
 *            description: The access token for the user's new session
 *            example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2YWx1ZS....
 *          expiresIn:
 *            type: number
 *            description: The expiration time of the user's new session access token is in milliseconds since midnight, January 1, 1970 UTC.
 *            example: 17002345453232
 *          role:
 *           type: string
 *           description: The role of the user
 *           example: "USER"
 *        example:
 *         accessToken: eyJhbGciOijTdPuT7Ja93....
 *         expiresIn: 17002345453232
 *         role: USER
 *
 */
