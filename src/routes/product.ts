import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

// get all products with optional search, filtering and pagination
router.get("/", async (req, res) => {
    try {
        const { search, category, department, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(1, +limit);

        const offset = (currentPage - 1) * limitPerPage;

        const whereCondition: any = {};

        if (search) {
            whereCondition.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (department) {
            whereCondition.department = { name: { contains: department, mode: 'insensitive' } };
        }

        if (category) {
            whereCondition.category = { name: { contains: category, mode: 'insensitive' } };
        }

        const totalCount = await prisma.product.count({
            where: whereCondition
        });

        const productLists = await prisma.product.findMany({
            where: whereCondition,
            include: {
                category: true,
                department: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: offset,
            take: limitPerPage
        });

        res.status(200).json({
            data: productLists,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
});

export default router;