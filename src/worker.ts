// import "dotenv/config";
import { startAllConsumers } from "./worker/consumer/index.js";

(async () => {
    console.log("[worker] is starting consuming... ");
    await startAllConsumers();
})();
