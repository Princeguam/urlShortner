import "dotenv/config";
import "./utilities/redis.js";
import express, { type Request, type Response } from "express";
import V1Route from "./routes/index.js";
import { requestTempStore } from "./middleware/index.js";
import { userAgent } from "./middleware/index.js";
import cors from "cors";
import { kDefaultApiVersion } from "./constants/strings.js";

const app = express();
const PORT = process.env.PORT;
const ENV = process.env.DEPLOYMENT_ENV;

app.use(
    cors({
        origin: ["http://localhost:4000", "http://localhost:5174"],
        credentials: true,
    }),
);

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

app.get(`/docs`, (_: Request, res: Response) => {
    res.redirect(`/api/${kDefaultApiVersion}/docs`);
});

app.use("/api/v1", V1Route);

app.listen(PORT, () => {
    console.log(`APP IS RUNNING ON PORT: ${PORT}`);
});
