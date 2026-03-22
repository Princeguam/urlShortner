import express from "express";
import LoginRoute from "./login.js";
import SignUpRoute from "./signup.js";

const AuthRoute = express.Router();

AuthRoute.use("/login", LoginRoute);
AuthRoute.use("/signup", SignUpRoute);

export default AuthRoute;
