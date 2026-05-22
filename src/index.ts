import "dotenv/config";
import "./utilities/redis.js";
import express, { type Request, type Response } from "express";
import V1Route from "./routes/index.js";
import { requestTempStore } from "./middleware/index.js";
import { userAgent } from "./middleware/index.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT;
const ENV = process.env.DEPLOYMENT_ENV;

if (ENV === "PROD") {
    const allowedOrigins = [
        "http://localhost:5173/",
        "https://www.yourfrontend.com",
    ];
    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin) {
                    return callback(null, true);
                }
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }

                return callback(new Error("Not Allowed by CORS"));
            },
            credentials: true,
        }),
    );
} else {
    app.use(
        cors({
            origin: "*", // Accept all
            credentials: true,
        }),
    );
}
app.use(express.json());
app.use(userAgent());
app.use(requestTempStore());

app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "server Health: Ok!",
        timeStamp: new Date().toISOString(),
    });
});
app.get("/api", (req: Request, res: Response) => {
    res.send("Everything works as it should");
});

app.use("/api/v1", V1Route);

app.listen(PORT, () => {
    console.log(`APP IS RUNNING ON PORT: ${PORT}`);
});
