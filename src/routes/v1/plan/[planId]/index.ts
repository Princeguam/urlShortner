import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    convertToBoolean,
} from "../../../../utilities/index.js";
import {
    $Types,
    ErrorType,
    HandleServerError,
    kDefaultSuccessMessage,
} from "../../../../constants/index.js";
import humps from "humps";
import { userRolePermit } from "../../../../middleware/userpermit.js";

const PlanIDRoute = express.Router();

PlanIDRoute.get(
    "/:planId",
    asyncHandler(async (req: Request, res: Response) => {
        let planId = req.params.planId?.toString();

        if (!planId) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.PlanIdMissing,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let plan = await prismaClient.plan.findFirst({
            where: { Id: planId },
            select: $Types.Plan,
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

        let getPlan = {
            Id: plan.Id,
            Name: plan.Name,
            Price: Number(plan.Price),
            MaxUrls: plan.MaxUrls,
            MaxClicks: plan.MaxClicks,
            CustomSlug: plan.CustomSlug,
            Analytics: plan.Analytics,
            AnnualPrice: plan.AnnualPrice,
        };

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(getPlan),
                undefined,
            ),
        );
    }),
);

PlanIDRoute.put(
    "/:planId",
    userRolePermit(),
    asyncHandler(async (req: Request, res: Response) => {
        let planId = req.params.planId?.toString();

        let body = req.body || {};

        if (!planId) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.PlanIdMissing,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let planExist = await prismaClient.plan.findFirst({
            where: { Id: planId },
            select: $Types.Plan,
        });

        if (!planExist) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.PlanUnavailable,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let updatePlan = await prismaClient.plan.update({
            where: { Id: planId },
            data: {
                Name: body.name,
                Price: body.price,
                MaxClicks: body.maxClicks ?? planExist.MaxClicks,
                MaxUrls: body.maxUrls ?? planExist.MaxUrls,
                Analytics: body.analytics ?? planExist.Analytics,
                CustomSlug: body.customSlug ?? planExist.CustomSlug,
            },
        });

        let getPlan = {
            Id: updatePlan.Id,
            Name: updatePlan.Name,
            Price: Number(updatePlan.Price),
            MaxUrls: updatePlan.MaxUrls,
            MaxClicks: updatePlan.MaxClicks,
            CustomSlug: updatePlan.CustomSlug,
            Analytics: updatePlan.Analytics,
            AnnualPrice: updatePlan.AnnualPrice,
        };
        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(getPlan),
                undefined,
            ),
        );
    }),
);

export default PlanIDRoute;
