import { error } from "node:console";
import { kPaystackAPIURL } from "../constants/strings.js";
import * as crypto from "crypto";

interface PaymentResponse<T = any> {
    data: T | null;
    error: unknown | null;
}

export enum kPaymentChannels {
    card = "card",
    bank = "bank",
    ussd = "ussd",
    bankTransfer = "bank_transfer",
}

export enum kPaymentCurrency {
    NGN = "NGN",
    USD = "USD",
}

type PaymentRequest = Record<
    "reference" | "accessCode" | "authorizationUrl",
    string
>;

const APIKEY = process.env.PAYSTACK_TEST_SECRET_KEY || "PAYSTACK_TEST_KEY";

export async function initializePayment<T = any>(
    data: { email: string; amount: number } & Partial<{
        channels: kPaymentChannels[];
        currency: kPaymentCurrency;
        reference: string;
        plan: string | null;
        metadata: { [name: string]: any };
        callback_url: string;
    }>,
): Promise<PaymentResponse<PaymentRequest>> {
    let url = new URL("/transaction/initialize", kPaystackAPIURL);

    data.channels = data.channels || [];

    data.currency = data.currency || kPaymentCurrency.NGN;

    if (data.channels.length <= 0) {
        data.channels = [
            kPaymentChannels.bank,
            kPaymentChannels.bankTransfer,
            kPaymentChannels.card,
            kPaymentChannels.ussd,
        ];
    }

    let response = await fetch(url.toString(), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${APIKEY}`,
        },
        body: data ? JSON.stringify(data) : null,
    });
    try {
        const responseData = await response.json();
        console.log(responseData);
        if (!responseData.status) {
            throw new Error(responseData.message);
        }
        return {
            error: null,
            data: {
                authorizationUrl: responseData.data.authorization_url,
                accessCode: responseData.data.access_code,
                reference: responseData.data.reference,
            },
        };
    } catch (error: any) {
        return {
            error,
            data: null,
        };
    }
}

export async function verifyPayment(
    data: Omit<PaymentRequest, "accessCode" | "authorizationUrl">,
): Promise<PaymentResponse> {
    let url = new URL(`/transaction/verify/${data.reference}`, kPaystackAPIURL);

    let response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: `Bearer ${APIKEY}`,
        },
    });

    try {
        let responseData = await response.json();
        console.log(responseData);

        if (!responseData.status) {
            throw new Error(responseData.message);
        }
        return {
            data: responseData.data,
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error,
        };
    }
}

export function webhookVerify(
    payload: Record<string, any>,
    signature: string,
): boolean {
    let hash = crypto
        .createHmac("sha512", APIKEY)
        .update(JSON.stringify(payload))
        .digest("hex");
    return hash === signature;
}

// export async function cancelPlan(data: Record<string){}

// export { initializePayment, verifyPayment };
