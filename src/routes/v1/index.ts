import express from "express";
import AuthRoute from "./auth/index.js";
import UrlShortneroute from "./url/index.js";
import RedirectRoute from "./redirect.js";
import EmailRoute from "./email/index.js";
import AdminRoute from "./admin/index.js";
import PaymentRoute from "./payment/index.js";
import ProfileRoute from "./profile/index.js";
import UtilsRoute from "./utils/index.js";
import swaggerJSDoc, {
    type Options as swaggerJsDocOption,
} from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { kBaseName } from "../../constants/strings.js";
import PlanRoute from "./plan/index.js";

const V1Route = express.Router();

const options: swaggerJsDocOption = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: `${kBaseName} Url Shortner API`,
            version: "1.0.0",
            description: `API documentation for ${kBaseName} Url Shortener System`,
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT}/api/v1`,
                title: "Development Server",
            },

            {
                url: `${process.env.HOST_URL}`,
                title: "Production Server",
            },
        ],
    },
    securityDefinitions: {
        bearerAuth: {
            type: "apiKey",
            name: "Authorization",
            scheme: "bearer",
            in: "header",
        },
    },

    apis: ["**/v1/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

V1Route.use("/docs", swaggerUi.serve);
V1Route.get("/docs", swaggerUi.setup(swaggerSpec));
V1Route.use("/auth", AuthRoute);
V1Route.use("/admin", AdminRoute);
V1Route.use("/email", EmailRoute);
V1Route.use("/home", UrlShortneroute);
V1Route.use("/payment", PaymentRoute);
V1Route.use("/profile", ProfileRoute);
V1Route.use("plan", PlanRoute);
V1Route.use("utils", UtilsRoute);
V1Route.use("/", RedirectRoute);

export default V1Route;

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *   schemas:
 *     ServerError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: The error's message
 *         code:
 *           type: integer
 *           description: The error's code
 *     ApiResponse:
 *       type: object
 *       require:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Request Successful"
 *         data:
 *           nullable: true,
 *           description: Response Payload
 *         error:
 *           nullable: true
 *           allOf:
 *             - $ref: "#/components/schemas/ServerError"
 *
 *     DeleteItemCount:
 *       type: object
 *       properties:
 *         count:
 *           type: number
 *           description: The total number of items deleted.
 *           example: 0
 *
 *
 *
 */
