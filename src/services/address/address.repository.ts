import { prisma } from "#db/prisma.js";

export class AddressRepository {

    async create(data: any) {
        return prisma.address.create({
            data
        });
    }

    async findByUser(userId: string) {
        return prisma.address.findMany({
            where: {
                userId
            },
            include: {
                deliveryArea: true
            },
            orderBy: {
                isDefault: "desc"
            }
        });
    }

    async findById(id: number) {
        return prisma.address.findUnique({
            where: {
                id
            },
            include: {
                deliveryArea: true
            }
        });
    }

}