import type { Request, Response } from "express";
import { prisma } from "#db/prisma.js";

export const listHomePageSections = async (req: Request, res: Response) => {
  try {
    const { search, active, type, groupId, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, Number(page));
    const limitPerPage = Math.max(1, Number(limit));

    const offset = (currentPage - 1) * limitPerPage;

    const whereCondition: Record<string, unknown> = {};

    if (search) {
      whereCondition.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (active !== undefined) {
      whereCondition.active = active === "true";
    }

    if (type) {
      whereCondition.type = type;
    }

    if (groupId && typeof groupId === "string") {
      const id = Number(groupId);
      if (!isNaN(id)) {
        whereCondition.groupId = id;
      }
    }

    const totalCount = await prisma.homePageSection.count({ where: whereCondition });

    const sections = await prisma.homePageSection.findMany({
      where: whereCondition,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
            category: true,
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { position: "asc" },
      skip: offset,
      take: limitPerPage,
    });

    return res.status(200).json({
      data: sections,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch homepage sections" });
  }
};

export const getHomePageSectionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const section = await prisma.homePageSection.findUnique({
      where: { id: Number(id) },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { order: "asc" },
                },
              },
            },
            category: true,
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!section) {
      return res.status(404).json({ message: "Home page section not found" });
    }

    return res.status(200).json(section);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch homepage section" });
  }
};

export const createHomePageSection = async (req: Request, res: Response) => {
  try {
    const { title, slug, ctaText, type, layout, groupId, active = true, config } = req.body;

    const lastSection = await prisma.homePageSection.findFirst({ orderBy: { position: "desc" } });
    const startPosition = lastSection ? lastSection.position + 1 : 1;

    const section = await prisma.homePageSection.create({
      data: {
        title,
        slug,
        ctaText,
        type,
        layout,
        groupId,
        active,
        position: startPosition,
        config: config || {},
      },
    });

    const createdSection = await prisma.homePageSection.findUnique({
      where: { id: section.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
            category: true,
          },
          orderBy: { position: "asc" },
        },
      },
    });

    return res.status(201).json({
      data: createdSection,
      message: "Homepage section created successfully",
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Section with this slug already exists",
      });
    }

    return res.status(500).json({ error: "Failed to create homepage section" });
  }
};

export const reorderHomePageSections = async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.homePageSection.update({
          where: { id: Number(item.id) },
          data: { position: Number(item.position) + 1000 },
        });
      }

      for (const [index, item] of items.entries()) {
        await tx.homePageSection.update({
          where: { id: Number(item.id) },
          data: { position: index + 1 },
        });
      }
    });

    return res.status(200).json({ message: "Homepage sections reordered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to reorder homepage sections" });
  }
};

export const updateHomePageSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, slug, ctaText, type, layout, active, position, config, items } = req.body;

    const existingSection = await prisma.homePageSection.findUnique({
      where: { id: Number(id) },
    });

    if (!existingSection) {
      return res.status(404).json({ message: "Homepage section not found" });
    }

    const updatedSection = await prisma.homePageSection.update({
      where: { id: Number(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(ctaText !== undefined && { ctaText }),
        ...(type !== undefined && { type }),
        ...(layout !== undefined && { layout }),
        ...(active !== undefined && { active }),
        ...(position !== undefined && { position: Number(position) }),
        ...(config !== undefined && { config }),
      },
    });

    if (items !== undefined) {
      await prisma.homePageSectionItem.deleteMany({ where: { sectionId: Number(id) } });

      if (items.length > 0) {
        await prisma.homePageSectionItem.createMany({
          data: items.map((item: any, index: number) => ({
            sectionId: Number(id),
            productId: item.productId ? Number(item.productId) : null,
            categoryId: item.categoryId ? Number(item.categoryId) : null,
            imageUrl: item.imageUrl || null,
            position: item.position ?? index,
          })),
        });
      }
    }

    const sectionWithItems = await prisma.homePageSection.findUnique({
      where: { id: updatedSection.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
            category: true,
          },
          orderBy: { position: "asc" },
        },
      },
    });

    return res.status(200).json({
      data: sectionWithItems,
      message: "Homepage section updated successfully",
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(400).json({ error: "Section with this slug already exists" });
    }

    return res.status(500).json({ message: "Failed to update homepage section" });
  }
};

export const deleteHomePageSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const section = await prisma.homePageSection.findUnique({ where: { id: Number(id) } });

    if (!section) {
      return res.status(404).json({ message: "Homepage section not found" });
    }

    await prisma.homePageSectionItem.deleteMany({ where: { sectionId: Number(id) } });
    await prisma.homePageSection.delete({ where: { id: Number(id) } });

    return res.status(200).json({ message: "Homepage section deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete homepage section" });
  }
};
