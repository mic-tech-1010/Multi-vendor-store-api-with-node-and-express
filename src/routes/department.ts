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

    // 🔍 SEARCH
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

// get a single department
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

// update a department
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      slug,
      metaTitle,
      metaDescription,
      bannerUrl,
      bannerCldPubId
    } = req.body;


    const existingDepartment = await prisma.department.findUnique({
      where: { id: Number(id) },
    });
    

    if (!existingDepartment) {
      return res.status(404).json({ message: "Department not found" });
    }

    const updatedDepartment = await prisma.department.update({
      where: { id: Number(id) },
      data: {
        name,
        slug,
        metaTitle,
        metaDescription,
        bannerUrl,
        bannerCldPubId,
      },
    });

    res.status(200).json({
      data: updatedDepartment,
      message: "Department updated successfully",
    });

  } catch (error) {
    console.error("PATCH /departments/:id error:", error);
    res.status(500).json({ message: "Failed to update department" });
  }
});

// delete a department
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch department WITH relations
    const department = await prisma.department.findUnique({
      where: { id: Number(id) },
      include: {
        categories: true,
        products: true,
      },
    });

    //  Not found
    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    // Prevent delete if dependencies exist
    if (department.categories.length > 0 || department.products.length > 0) {
      return res.status(400).json({
        message:
          "This department cannot be deleted because it still contains categories or products. Remove them first.",
      });
    }

    // Safe delete
    await prisma.department.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({
      message: "Department deleted successfully",
    });

  } catch (error) {
    console.error("DELETE /departments/:id error:", error);

    return res.status(500).json({
      message: "Failed to delete department",
    });
  }
});


export default router;