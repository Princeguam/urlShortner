import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    convertToBoolean,
} from "../../../utilities/index.js";
import {
    ErrorType,
    HandleServerError,
    kDefaultSuccessMessage,
} from "../../../constants/index.js";
import humps from "humps";
import { userRolePermit } from "../../../middleware/userpermit.js";

const PlanRoute = express.Router();

PlanRoute.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        // let userId = req.store.get(kUserIdStoreKey);

        let planExist = await prismaClient.plan.findMany({
            select: {
                Id: true,
                Name: true,
                Price: true,
                MaxUrls: true,
                MaxClicks: true,
                CustomSlug: true,
                Analytics: true,
                AnnualPrice: true,
            },
        });

        let plan = planExist.map(({ Price, ...otherData }) => ({
            ...otherData,
            Price: Number(Price),
        }));

        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(plan),
                undefined,
            ),
        );
    }),
);

PlanRoute.get(
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
            select: {
                Id: true,
                Name: true,
                Price: true,
                MaxUrls: true,
                MaxClicks: true,
                CustomSlug: true,
                Analytics: true,
                AnnualPrice: true,
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

PlanRoute.post(
    "/",
    userRolePermit(),
    asyncHandler(async (req: Request, res: Response) => {
        let body = req.body || {};

        console.log(body);

        if (!body.name) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.PlanNameMissing,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }
        if (body.price === undefined) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.PlanPriceMissing,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let planExist = await prismaClient.plan.findFirst({
            where: {
                Name: body.name,
            },
        });

        if (planExist) {
            let { message, errorCode, statusCode } = HandleServerError(
                ErrorType.PlanAlreadyExist,
            );
            res.status(statusCode).json(
                systemResponse(false, message, undefined, errorCode),
            );
            return;
        }

        let plan = await prismaClient.plan.create({
            data: {
                Name: body.name,
                Price: body.price,
                MaxClicks: body.maxClicks ?? undefined,
                MaxUrls: body.maxUrls ?? undefined,
                CustomSlug: body.customSlug ?? undefined,
                Analytics: convertToBoolean(body.analytics),
            },
            select: {
                Id: true,
                Name: true,
                Price: true,
                MaxClicks: true,
                MaxUrls: true,
                CustomSlug: true,
                Analytics: true,
            },
        });
        res.status(200).json(
            systemResponse(
                true,
                kDefaultSuccessMessage,
                humps.camelizeKeys(plan),
                undefined,
            ),
        );
    }),
);

PlanRoute.put(
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
            select: {
                Id: true,
                Name: true,
                Price: true,
                MaxClicks: true,
                MaxUrls: true,
                CustomSlug: true,
                Analytics: true,
            },
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

PlanRoute.delete(
    "/",
    userRolePermit(),
    asyncHandler(async (req: Request, res: Response) => {
        let body = req.body || {};
        body.planIds = body.planIds || [];

        let deleted = await prismaClient.plan.deleteMany({
            where: {
                Id: {
                    in: body.planIds,
                },
            },
        });
        res.status(200).json(
            systemResponse(true, kDefaultSuccessMessage, deleted, undefined),
        );
    }),
);

export default PlanRoute;
