import express from "express";
import LoginRoute from "./login.js";
import SignUpRoute from "./signup.js";
import RefreshRoute from "./refresh.js";

const AuthRoute = express.Router();

AuthRoute.use("/login", LoginRoute);
AuthRoute.use("/signup", SignUpRoute);
AuthRoute.use("/refresh", RefreshRoute);

export default AuthRoute;
