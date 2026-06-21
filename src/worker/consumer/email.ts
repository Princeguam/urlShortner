import type { EmailPayload } from "../types.js";
import { EXCHANGE, getChannel } from "../connection.js";
import {
    kDeadletterExchangeKey,
    kDeadLetterMessageTTL,
    kDeadletterRoutingKey,
    kEmailVerificationHTMLText,
    kPasswordChangedHTMLText,
    kForgotPasswordHTMLText,
    kWelcomeHTMLText,
} from "../../constants/strings.js";
import { sendEmail } from "../../utilities/email.js";

const QUEUE = "email.queue";
const DLQ = "email.dlq";
const ROUTINGKEY = "email.#";

export async function startEmailConsumer() {
    const channel = await getChannel();

    await channel.assertQueue(DLQ, { durable: true });

    await channel.assertQueue(QUEUE, {
        durable: true,
        arguments: {
            [kDeadletterExchangeKey]: "",
            [kDeadletterRoutingKey]: ROUTINGKEY,
            [kDeadLetterMessageTTL]: 60 * 60,
        },
    });

    await channel.bindQueue(QUEUE, EXCHANGE, ROUTINGKEY);

    channel.prefetch(5);

    channel.consume(QUEUE, async (message) => {
        if (!message) return;

        try {
            const payload: EmailPayload = JSON.parse(
                message.content.toString(),
            );
            let html: string;
            switch (payload.template) {
                case "verify":
                    if (!payload.token)
                        throw new Error("Token required for verify email");
                    html = kEmailVerificationHTMLText(
                        payload.name,
                        payload.token,
                    );
                    break;
                case "forgot-password":
                    if (!payload.token)
                        throw new Error("Token required for reset password");

                    html = kForgotPasswordHTMLText(payload.name, payload.token);
                    break;
                case "welcome":
                    html = kWelcomeHTMLText(payload.name);
                    break;
                case "password-changed":
                    html = kPasswordChangedHTMLText(payload.name);
                    break;
                default:
                    throw new Error("Unknown Email Template");
            }

            await sendEmail(payload.to, payload.subject, html);

            channel.ack(message);
        } catch (err) {
            console.error("[email.consumer] Error", err);
            channel.nack(message, false, false);
        }
    });

    console.log("[email.consumer] listening on", QUEUE);
}
