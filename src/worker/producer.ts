import { getChannel, closeConnection, EXCHANGE } from "./connection.js";
import type { RoutingKey, MessagePayload } from "./types.js";

export async function publish<T extends MessagePayload>(
    routingKey: RoutingKey,
    payload: T,
) {
    const channel = await getChannel();
    const content = Buffer.from(JSON.stringify(payload));

    let sent = channel.publish(EXCHANGE, routingKey, content, {
        persistent: true,
        contentType: "application/json",
        timestamp: Date.now(),
    });

    if (!sent) {
        throw new Error(`[Publisher] failed to publish to ${routingKey}`);
    }
}
