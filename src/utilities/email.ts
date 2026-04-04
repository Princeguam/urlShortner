import * as nodemailer from "nodemailer";
import { kBaseName, kDefaultWelcomeEmail } from "../constants/index.js";

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

// await transporter.verify();
// console.log("SMTP IS WORKING");

export async function sendWelcomeEmail(to: string, name: string) {
    let mailOption = {
        from: `${kBaseName} ${EMAIL_ADDRESS}`,
        to: to,
        subject: `${kDefaultWelcomeEmail}`,
        html: `<h1> Welcome, ${name} </h1> 
        <p> This is the text email! </p>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOption);
        console.log("Message Sent: %s", info.messageId);
        console.log(info.response);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error("Error while sending Email: ", error);
    }
}

export async function sendMailVerificationEmail(
    to: string,
    name: string,
    token: string,
) {
    let mailOption = {
        from: `${kBaseName} ${EMAIL_ADDRESS}`,
        to: to,
        subject: `${kDefaultWelcomeEmail}`,
        html: `<h1> Welcome to ${kBaseName} </h1> 
        <p> Hello ${name}</p>
        <p> We're happy to have you onboard. To get you started with ${kBaseName}, please Verify your email</p>
        <a href="127.0.0.1:3001/v1/auth/signup/verify?token=${encodeURIComponent(token)}" 
   style="
      display: inline-block;
      padding: 12px 24px;
      font-size: 16px;
      color: white;
      background-color: #007BFF;
      text-decoration: none;
      border-radius: 6px;
      font-family: Arial, sans-serif;
   ">
   Verify Email
</a>
        `,
    };
    try {
        const info = await transporter.sendMail(mailOption);
        console.log("Message Sent: %s", info.messageId);
        console.log(info.response);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error("Error while sending Email: ", error);
    }
}
