import express from "express";
import AuthRoute from "./auth/index.js";
import UrlShortneroute from "./home/index.js";
import RedirectRoute from "./url.js";

const V1Route = express.Router();

V1Route.use("/auth", AuthRoute);
V1Route.use("/home", UrlShortneroute);
V1Route.use("/", RedirectRoute);

export default V1Route;
