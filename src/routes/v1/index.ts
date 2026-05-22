import express from "express";
import AuthRoute from "./auth/index.js";
import UrlShortneroute from "./home/index.js";
import RedirectRoute from "./redirect.js";
import EmailRoute from "./home/emailVerification.js";
import AdminRoute from "./admin/index.js";
import PaymentRoute from "./payment/index.js";
import ProfileRoute from "./profile/index.js";

const V1Route = express.Router();

V1Route.use("/redirect", RedirectRoute);
V1Route.use("/auth", AuthRoute);
V1Route.use("/admin", AdminRoute);
V1Route.use("/email", EmailRoute);
V1Route.use("/home", UrlShortneroute);
V1Route.use("/payment", PaymentRoute);
V1Route.use("/profile", ProfileRoute);

export default V1Route;
