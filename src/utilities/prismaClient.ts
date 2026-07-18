import { PrismaClient, Prisma } from "../../generated/prisma/client.js";

Prisma.Decimal.prototype.toJSON = function () {
    return this.toNumber() as any;
};

export const prismaClient = new PrismaClient({ log: ["info"] });

export { Prisma };
