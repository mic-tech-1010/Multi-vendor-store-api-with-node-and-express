import { prisma } from "#db/prisma.js";
import validate from "#lib/validator.js";
import { CreateDepartmentSchema } from "#schemas/validation/departmentSchema.js";
import express from "express";

const router = express.Router();

// get all departments with optional search, filtering and pagination
router.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);

    const offset = (currentPage - 1) * limitPerPage;

    const whereCondition: any = {};

    // 🔍 SEARCH (same as product)
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalCount = await prisma.department.count({
      where: whereCondition,
    });

    const departments = await prisma.department.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limitPerPage,
    });

    res.status(200).json({
      data: departments,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage)
      }
    });

  } catch (error) {
    console.error("GET /departments error:", error);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id: Number(id) },
    });

    if (!department) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch department" });
  }
});

// create a new department
router.post("/", async (req, res) => {
  try {

    const { name, slug, metaTitle, metaDescription, bannerUrl, bannerCldPubId } = req.body;

    if (!validate(CreateDepartmentSchema, req, res)) {
      return;
    }

    const newDepartment = await prisma.department.create({
      data: {
        name: name,
        slug: slug,
        metaTitle: metaTitle,
        metaDescription: metaDescription,
        bannerUrl: bannerUrl,
        bannerCldPubId: bannerCldPubId
      }
    })

    if (!newDepartment) {
      return res.status(400).json({ error: "Failed to create department" });
    }
    res.status(201).json(newDepartment);
  } catch (error) {
    console.error('POST /departments error:', error);
    res.status(500).json({ error: "Failed to create department" });
  }
});

export default router;