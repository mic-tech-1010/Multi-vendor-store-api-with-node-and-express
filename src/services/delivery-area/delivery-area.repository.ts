import { prisma } from "#db/prisma.js";

export class DeliveryAreaRepository {

    async findAllActive() {
        return prisma.deliveryArea.findMany({
            where: {
                status: "active",
            },
        });
    }

    async findById(id: number) {
        return prisma.deliveryArea.findUnique({
            where: { id },
        });
    }

}