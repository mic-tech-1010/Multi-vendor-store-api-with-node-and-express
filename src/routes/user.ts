import express from "express";
import { prisma } from "../db/prisma";

const router = express.Router();

/**
 * GET ALL USERS
 * search + role filter + pagination
 */
router.get("/", async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);
    const offset = (currentPage - 1) * limitPerPage;

    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      whereCondition.role = role;
    }

    const totalCount = await prisma.user.count({
      where: whereCondition,
    });

    const usersList = await prisma.user.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limitPerPage,
    });

    res.status(200).json({
      data: usersList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * GET SINGLE USER
 */
router.get("/:id", async (req, res) => {
  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ data: userRecord });
  } catch (error) {
    console.error("GET /users/:id error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

/**
 * GET USER PRODUCTS (Created by user)
 */
router.get("/:id/products", async (req, res) => {
  try {
    const userId = req.params.id;
    const { search, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);
    const offset = (currentPage - 1) * limitPerPage;

    const whereCondition: any = {
      createdById: userId, 
    };

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalCount = await prisma.product.count({
      where: whereCondition,
    });

    const productLists = await prisma.product.findMany({
      where: whereCondition,
      include: {
        category: true,
        department: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limitPerPage,
    });

    res.status(200).json({
      data: productLists,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /users/:id/products error:", error);
    res.status(500).json({ error: "Failed to fetch user products" });
  }
});

export default router;