import "dotenv/config";
import express, { type Request, type Response } from "express";
import "./utilities/redis.js";
import cors from "cors";
import {
    requestTempStore,
    userAgent,
    expressCookieParser,
} from "./middleware/index.js";
import V1Route from "./routes/index.js";
import { kDefaultApiVersion } from "./constants/strings.js";

const app = express();
const PORT = process.env.PORT;
const ENV = process.env.NODE_ENV; // development or production (spelt out like this)

app.use(
    cors({
        origin: ["http://localhost:4000", "http://localhost:5174"],
        credentials: true,
    }),
);

app.use(express.json());
app.set("trust proxy", 1);
app.use(userAgent());
app.use(requestTempStore());
app.use(expressCookieParser());

app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "server Health: Ok!",
        timeStamp: new Date().toISOString(),
    });
});

app.get("/api", (req: Request, res: Response) => {
    res.send("Everything works as it should");
});

app.get(`/docs`, (_: Request, res: Response) => {
    res.redirect(`/api/${kDefaultApiVersion}/docs`);
});

app.use("/api/v1", V1Route);

app.listen(PORT, () => {
    console.log(`APP IS RUNNING ON PORT: ${PORT}`);
});
