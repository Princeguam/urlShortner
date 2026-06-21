import * as nodemailer from "nodemailer";
import { kBaseName } from "../constants/index.js";

let EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
let EMAIL_HOST = process.env.EMAIL_HOST;
let EMAIL_PORT = process.env.EMAIL_PORT;
let EMAIL_SMTP_KEY = process.env.EMAIL_SMTP_KEY;
let EMAIL_HOST_ADDRESS = process.env.EMAL_HOST_ADDRESS;

let transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: false,
    auth: {
        user: EMAIL_HOST_ADDRESS,
        pass: EMAIL_SMTP_KEY,
    },
});

export async function sendEmail(
    to: string,
    emailSubject: string,
    htmlText: string,
): Promise<boolean> {
    let mailOption = {
        from: `${kBaseName} ${EMAIL_ADDRESS}`,
        to: to,
        subject: emailSubject,
        html: htmlText,
    };
    try {
        const info = await transporter.sendMail(mailOption);
        console.log("Message Sent: %s", info.messageId);
        console.log(info.response);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        return true;
    } catch (error) {
        console.error("Error while sending Email: ", error);
        return false;
    }
}
