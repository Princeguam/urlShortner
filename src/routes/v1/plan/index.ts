import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import {
    systemResponse,
    prismaClient,
    convertToBoolean,
} from "../../../utilities/index.js";
import {
    $Types,
    ErrorType,
    HandleServerError,
    kDefaultSuccessMessage,
} from "../../../constants/index.js";
import humps from "humps";
import { userRolePermit } from "../../../middleware/userpermit.js";
import PlanIDRoute from "./[planId]/index.js";

const PlanRoute = express.Router();

PlanRoute.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        // let userId = req.store.get(kUserIdStoreKey);

        let planExist = await prismaClient.plan.findMany({
            select: $Types.Plan,
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

PlanRoute.use("/", PlanIDRoute);

export default PlanRoute;
