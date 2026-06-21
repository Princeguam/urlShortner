import { startAnalyticsConsumer } from "./analytics.js";
import { startEmailConsumer } from "./email.js";

export async function startAllConsumers() {
    Promise.all([startAnalyticsConsumer(), startEmailConsumer()]);
}
