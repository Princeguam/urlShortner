import express from "express";
import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { v1AuthMiddleware } from "../../../middleware/authMiddleware.js";
import {
    kDefaultSuccessMessage,
    kLocalHost,
    kUserEmailStoreKey,
    kUserIdStoreKey,
} from "../../../constants/strings.js";
import { prismaClient } from "../../../utilities/prismaClient.js";
import * as uuid from "uuid";
import {
    $Enums,
    ErrorType,
    HandleServerError,
} from "../../../constants/index.js";
import {
    initializePayment,
    verifyPayment,
    systemResponse,
    kPaymentChannels,
    kPaymentCurrency,
    webhookVerify,
} from "../../../utilities/index.js";
import humps from "humps";
import { addMonths } from "date-fns";
const PaymentRoute = express.Router();

PaymentRoute.post(
    "/subscription",
    v1AuthMiddleware(),
    asyncHandler(async (req: Request, res: Response) => {
        let userId = req.store.get(kUserIdStoreKey);
        let email = req.store.get(kUserEmailStoreKey);
        let body = req.body;

        let plan = await prismaClient.plan.findUnique({
            where: {
                Id: body.planId,
            },
            select: {
                Id: true,
                Name: true,
                Price: true,
                AnnualPrice: true,
                MaxClicks: true,
                PlanCode: true,
            },
        });

        if (!plan) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.PlanUnavailable,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let amount = Number(plan.Price) * 100;

        let reference = `URL_${uuid.v4()}`;

        let { subscription, payment } = await prismaClient.$transaction(
            async (tx) => {
                let subscription = await tx.subscription.create({
                    data: {
                        UserId: userId,
                        PlanId: plan.Id,
                        BillingCycle: body.billingCycle,
                    },
                    select: {
                        Id: true,
                        IsActive: true,
                        GatewaySubscriptionCode: true,
                        GatewayCustomerCode: true,
                        BillingCycle: true,
                    },
                });

                let payment = await tx.payments.create({
                    data: {
                        UserId: userId,
                        SubscriptionId: subscription.Id,
                        Amount: amount,
                        Currency: kPaymentCurrency.NGN,
                        Reference: reference,
                        Status: $Enums.PaymentStatus.PENDING,
                        Description: `Plan: ${plan.Name} ${subscription.BillingCycle} Subscription`,
                        // PaystackChannel: kPaymentChannels
                    },
                    select: {
                        Id: true,
                        UserId: true,
                        SubscriptionId: true,
                        Amount: true,
                        Currency: true,
                        Status: true,
                        Reference: true,
                        Description: true,
                    },
                });

                return { subscription, payment };
            },
        );

        let transaction = await initializePayment({
            email: email,
            amount: payment.Amount.toNumber(),
            currency: kPaymentCurrency.NGN,
            plan: plan.PlanCode,
            reference: payment.Reference,
            callback_url: `${kLocalHost}/verify?reference=${reference}`,
            metadata: {
                userId: payment.UserId,
                subscriptionId: payment.SubscriptionId,
                description: payment.Description,
                billingCycle: subscription.BillingCycle,
                planName: plan.Name,
            },
        });

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(transaction),
                undefined,
            ),
        );
    }),
);

PaymentRoute.get(
    "/verify",
    v1AuthMiddleware(),
    asyncHandler(async (req: Request, res: Response) => {
        let reference = req.query.reference?.toString();

        if (!reference) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.PlanUnavailable,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let verified = await verifyPayment({ reference });

        if (verified.data.status !== "success") {
            await prismaClient.payments.update({
                where: {
                    Reference: reference,
                },
                data: {
                    Status: $Enums.PaymentStatus.FAILED,
                },
            });
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.PaymentFailed,
            );
            res.status(statusCode).json(
                systemResponse(
                    false,
                    `status:${verified.data.status} message:${verified.data.gateway_response}` ||
                        message,
                    undefined,
                    errorCode,
                ),
            );
            return;
        }

        let { userId, subscriptionId, billingCycle } = verified.data.metadata;
        let now = new Date();

        await prismaClient.payments.update({
            where: {
                Reference: reference,
            },
            data: {
                Status: $Enums.PaymentStatus.SUCCESS,
                PaystackRef: String(verified.data.id),
                PaystackChannel: verified.data.channel,
                PaidAt: verified.data.paidAt,
            },
        });

        await prismaClient.subscription.update({
            where: {
                Id: subscriptionId,
            },
            data: {
                IsActive: true,
                StartDate: verified.data.paidAt,
                EndDate: addMonths(now, 1),
            },
        });

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(verified.data),
                undefined,
            ),
        );
    }),
);

PaymentRoute.post(
    "/webhook",
    asyncHandler(async (req: Request, res: Response) => {
        let signature = req.headers["x-paystack-signature"] as string;
        if (!webhookVerify(req.body, signature)) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.InvalidSignature,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let { event, data } = req.body;
        let { userId, subscriptionId, planId } = data.metadata;

        if (event === "charge.success") {
            let now = new Date();
            let endDate = addMonths(now, 1);

            let existPayment = await prismaClient.payments.findUnique({
                where: {
                    Reference: data.reference,
                },
                select: {
                    Id: true,
                    Status: true,
                },
            });

            if (!existPayment) {
                await prismaClient.payments.create({
                    data: {
                        UserId: parseInt(userId),
                        SubscriptionId: subscriptionId,
                        Amount: data.amount / 100,
                        Currency: data.currency,
                        Status: $Enums.PaymentStatus.SUCCESS,
                        Reference: `URL_${uuid.v4()}`,
                        Description: `Recurring payment for Subscription`,
                        PaystackRef: String(data.id),
                        PaystackChannel: data.channel,
                        PaidAt: new Date(data.paidAt),
                    },
                });
                return;
            }

            if (existPayment.Status === $Enums.PaymentStatus.SUCCESS) {
                res.status(200).json(
                    systemResponse(
                        true,
                        kDefaultSuccessMessage,
                        event,
                        undefined,
                    ),
                );
                return;
            }

            await prismaClient.$transaction(async (tx) => {
                await tx.payments.update({
                    where: {
                        Reference: data.reference,
                    },
                    data: {
                        PaidAt: data.paidAt,
                        Status: $Enums.PaymentStatus.SUCCESS,
                        PaystackChannel: data.channel,
                        PaystackRef: String(data.id),
                    },
                });

                await tx.subscription.update({
                    where: {
                        Id: subscriptionId,
                    },
                    data: {
                        IsActive: true,
                        StartDate: data.paidAt,
                        EndDate: endDate,
                    },
                });
            });
        }

        if (event === "invoice.payment_failed") {
            await prismaClient.subscription.update({
                where: {
                    Id: subscriptionId,
                },
                data: {
                    IsActive: false,
                },
            });
        }

        if (event === "subscription.disable") {
            await prismaClient.subscription.update({
                where: { Id: subscriptionId },
                data: { IsActive: false, CancelledAt: new Date() },
            });
        }
        res.status(200).json(
            systemResponse(true, kDefaultSuccessMessage, event, undefined),
        );
    }),
);

export default PaymentRoute;
