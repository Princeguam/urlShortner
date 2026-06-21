import amqp, { type Channel, type ChannelModel } from "amqplib";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export let EXCHANGE = "app.events";

let RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://localhost";

export async function getChannel(): Promise<Channel> {
    if (channel) return channel;

    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE, "topic", { durable: true });

    connection.on("error", (err) => {
        console.error("[Rabbitmq] Conneciton Error", err.message);
        channel = null;
        connection = null;
    });

    return channel;
}

export async function closeConnection() {
    await channel?.close();
    connection?.close();
}
