export type RoutingKey = "analytics.click" | "email.send";

export interface ClickPayload {
    shortUrl: string;
    userAgent: string | null;
    ipAddress: string | null;
    clickedAt: Date | null;
    referrer: string | null;
    browser: string | null;
    language: string | null;
    // deviceType: string | null;
    // country: string | null;
    // timezone: string | null;
    // city: string | null;
}

export interface EmailPayload {
    to: string;
    template: "welcome" | "verify" | "forgot-password" | "password-changed";
    subject: string;
    name: string;
    token?: string;
}

export type MessagePayload = ClickPayload | EmailPayload;
