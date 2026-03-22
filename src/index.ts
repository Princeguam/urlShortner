import express, { type Request, type Response } from "express";
import * as dotenv from "dotenv";
import V1Route from "./routes/index.js";
import { requestTempStore } from "./middleware/requestTempStore.js";
import { userAgent } from "./middleware/userAgent.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use(userAgent());
app.use(requestTempStore());
const PORT = process.env.PORT;

app.get("/", (req: Request, res: Response) => {
    res.send("Everything works as it should");
});

app.use("/v1", V1Route);

app.listen(PORT, () => {
    console.log(`APP IS RUNNING ON PORT: ${PORT}`);
});
