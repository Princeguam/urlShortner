import type { ClickPayload } from "../types.js";
import { EXCHANGE, getChannel } from "../connection.js";
import { prismaClient, getReferrerSource } from "../../utilities/index.js";
import {
    kDeadletterExchangeKey,
    kDeadLetterMessageTTL,
    kDeadletterRoutingKey,
} from "../../constants/index.js";

const QUEUE = "analytics.queue";
const DLQ = "analytics.dlq";
const ROUTINGKEY = "analytics.#";

export async function startAnalyticsConsumer() {
    const channel = await getChannel();

    await channel.assertQueue(DLQ, { durable: true });

    await channel.assertQueue(QUEUE, {
        durable: true,
        arguments: {
            [kDeadletterExchangeKey]: "",
            [kDeadletterRoutingKey]: DLQ,
            [kDeadLetterMessageTTL]: 60 * 60,
        },
    });

    await channel.bindQueue(QUEUE, EXCHANGE, ROUTINGKEY);

    channel.prefetch(2);

    channel.consume(QUEUE, async (message) => {
        if (!message) return;

        try {
            const payload: ClickPayload = JSON.parse(
                message.content.toString(),
            );

            let referer = getReferrerSource(payload?.referrer);
            let language = String(payload.language?.split(",")[0]);
            console.log(language);
            console.log(referer);
            console.log(payload.browser);
            console.log(payload.ipAddress);

            let transact = await prismaClient.$transaction(async (tx) => {
                let url = await tx.urls.findFirst({
                    where: {
                        ShortUrl: payload.shortUrl,
                    },
                    select: {
                        Id: true,
                    },
                });

                let reffered = await tx.referrers.upsert({
                    where: {
                        Domain: referer,
                    },
                    create: {
                        Domain: referer,
                    },
                    update: {},
                    select: {
                        Id: true,
                    },
                });

                if (!url) {
                    throw new Error("Short Url not found");
                }

                await tx.clickLogs.create({
                    data: {
                        IpAddress: payload.ipAddress,
                        Browser: payload.browser,
                        UrlId: url.Id,
                        CickedAt: payload?.clickedAt,
                        ReferrerId: reffered.Id,
                        Language: language,
                    },
                });

                await tx.urls.update({
                    where: {
                        Id: url.Id,
                    },
                    data: {
                        Clicks: { increment: 1 },
                    },
                });
            });

            channel.ack(message);
        } catch (err) {
            console.error(`[analytics.consumer] Erorr`, err);
            channel.nack(message, false, false);
        }
    });

    console.log("[analytics.consumer] listening on", QUEUE);
}
