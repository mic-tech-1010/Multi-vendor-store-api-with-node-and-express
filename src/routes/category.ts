import { prisma } from "#db/prisma.js";
import validate from "#lib/validator.js";
import { CreateCategorySchema } from "#schemas/validation/categorySchema.js";
import express from "express";

const router = express.Router();

/* =========================================================
   GET ALL CATEGORIES (search + filter + pagination)
========================================================= */
router.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 10, departmentId, excludedId } = req.query;

    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);
    const offset = (currentPage - 1) * limitPerPage;

    const whereCondition: any = {};

    // 🔍 SEARCH
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    // 🎯 FILTER BY DEPARTMENT
    if (departmentId && typeof departmentId === "string") {
      const id = Number(departmentId);
      if (!isNaN(id)) {
        whereCondition.departmentId = id;
      }
    }

    // 🎯 FILTER TO EXCLUDE THE PARTICULAR CATEGORY
    if (excludedId) {
      whereCondition.id = {
        not: Number(excludedId)
      }
    }

    const totalCount = await prisma.category.count({
      where: whereCondition,
    });

    const categories = await prisma.category.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limitPerPage,
      include: {
        department: true,
        parent: true,
      },
    });

    return res.status(200).json({
      data: categories,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /categories error:", error);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
});

/* =========================================================
   GET SINGLE CATEGORY
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: {
        department: true,
        parent: true,
        children: true,
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json(category);
  } catch (error) {
    console.error("GET /categories/:id error:", error);
    return res.status(500).json({ message: "Failed to fetch category" });
  }
});

/* =========================================================
   CREATE CATEGORY
========================================================= */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      slug,
      metaTitle,
      metaDescription,
      bannerUrl,
      bannerCldPubId,
      parentId,
      departmentId,
    } = req.body;

    if (!validate(CreateCategorySchema, req, res)) {
      return;
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        metaTitle,
        metaDescription,
        bannerUrl,
        bannerCldPubId,

        // 🧠 safe handling for optional relation
        parentId:
          parentId && parentId !== ""
            ? Number(parentId)
            : null,

        departmentId: Number(departmentId),
      },
    });

    return res.status(201).json({
      data: newCategory,
    });
  } catch (error) {
    console.error("POST /categories error:", error);
    return res.status(500).json({
      message: "Failed to create category",
    });
  }
});

/* =========================================================
   UPDATE CATEGORY
========================================================= */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      slug,
      metaTitle,
      metaDescription,
      bannerUrl,
      bannerCldPubId,
      parentId,
      departmentId,
    } = req.body;

    const existing = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updated = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        name,
        slug,
        metaTitle,
        metaDescription,
        bannerUrl,
        bannerCldPubId,

        parentId:
          parentId && parentId !== ""
            ? Number(parentId)
            : null,

        departmentId: departmentId
          ? Number(departmentId)
          : existing.departmentId,
      },
    });

    return res.status(200).json({
      data: updated,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("PATCH /categories/:id error:", error);
    return res.status(500).json({
      message: "Failed to update category",
    });
  }
});

/* =========================================================
   DELETE CATEGORY 
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: {
        children: true,
        products: true,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // 🚫 prevent deletion if it has children or products
    if (category.children.length > 0 || category.products.length > 0) {
      return res.status(400).json({
        message:
          "This category cannot be deleted because it has subcategories or products.",
      });
    }

    await prisma.category.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /categories/:id error:", error);
    return res.status(500).json({
      message: "Failed to delete category",
    });
  }
});

export default router;