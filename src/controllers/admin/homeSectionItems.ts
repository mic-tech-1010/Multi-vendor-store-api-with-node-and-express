import type { Request, Response } from "express";
import { prisma } from "#db/prisma.js";

export const listHomePageSectionItems = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, sectionId, productId, categoryId } = req.query;

    const currentPage = Math.max(1, Number(page));
    const limitPerPage = Math.max(1, Number(limit));
    const offset = (currentPage - 1) * limitPerPage;

    const whereCondition: Record<string, unknown> = {};

    if (sectionId && typeof sectionId === "string") {
      const id = Number(sectionId);
      if (!isNaN(id)) {
        whereCondition.sectionId = id;
      }
    }

    if (productId && typeof productId === "string") {
      const id = Number(productId);
      if (!isNaN(id)) {
        whereCondition.productId = id;
      }
    }

    if (categoryId && typeof categoryId === "string") {
      const id = Number(categoryId);
      if (!isNaN(id)) {
        whereCondition.categoryId = id;
      }
    }

    const totalCount = await prisma.homePageSectionItem.count({ where: whereCondition });

    const items = await prisma.homePageSectionItem.findMany({
      where: whereCondition,
      include: {
        section: true,
        product: {
          include: {
            images: { orderBy: { order: "asc" } },
          },
        },
        category: true,
      },
      orderBy: { position: "asc" },
      skip: offset,
      take: limitPerPage,
    });

    return res.status(200).json({
      data: items,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch homepage section items" });
  }
};

export const getHomePageSectionItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.homePageSectionItem.findUnique({
      where: { id: Number(id) },
      include: {
        section: true,
        product: {
          include: {
            images: { orderBy: { order: "asc" } },
          },
        },
        category: true,
      },
    });

    if (!item) {
      return res.status(404).json({ message: "Homepage section item not found" });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch homepage section item" });
  }
};

export const createHomePageSectionItem = async (req: Request, res: Response) => {
  try {
    const { sectionId, productIds = [], categoryIds = [], imageUrl } = req.body;

    const existingSection = await prisma.homePageSection.findUnique({
      where: { id: Number(sectionId) },
    });

    if (!existingSection) {
      return res.status(404).json({ message: "Homepage section not found" });
    }

    const lastItem = await prisma.homePageSectionItem.findFirst({
      where: { sectionId: Number(sectionId) },
      orderBy: { position: "desc" },
    });

    const startPosition = lastItem ? lastItem.position + 1 : 1;
    const itemsToCreate: Array<Record<string, unknown>> = [];

    for (const [index, productId] of productIds.entries()) {
      itemsToCreate.push({
        sectionId: Number(sectionId),
        productId: Number(productId),
        categoryId: null,
        imageUrl: imageUrl || null,
        position: startPosition + index,
      });
    }

    for (const [index, categoryId] of categoryIds.entries()) {
      itemsToCreate.push({
        sectionId: Number(sectionId),
        productId: null,
        categoryId: Number(categoryId),
        imageUrl: imageUrl || null,
        position: startPosition + index,
      });
    }

    await prisma.homePageSectionItem.createMany({ data: itemsToCreate as any[] });

    return res.status(201).json({ message: "Homepage section item created successfully" });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(400).json({ message: "This product or category already exists in this section" });
    }

    return res.status(500).json({ message: "Failed to create homepage section item" });
  }
};

export const reorderHomePageSectionItems = async (req: Request, res: Response) => {
  try {
    const { sectionId, items } = req.body;

    if (!sectionId || !Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const existingSection = await prisma.homePageSection.findUnique({
      where: { id: Number(sectionId) },
    });

    if (!existingSection) {
      return res.status(404).json({ message: "Homepage section not found" });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.homePageSectionItem.update({
          where: { id: Number(item.id) },
          data: { position: Number(item.position) + 1000 },
        });
      }

      for (const [index, item] of items.entries()) {
        await tx.homePageSectionItem.update({
          where: { id: Number(item.id) },
          data: { position: index + 1 },
        });
      }
    });

    return res.status(200).json({ message: "Items reordered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to reorder items" });
  }
};

export const updateHomePageSectionItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { productId, categoryId, imageUrl, position } = req.body;

    const existingItem = await prisma.homePageSectionItem.findUnique({
      where: { id: Number(id) },
    });

    if (!existingItem) {
      return res.status(404).json({ message: "Homepage section item not found" });
    }

    const updatedItem = await prisma.homePageSectionItem.update({
      where: { id: Number(id) },
      data: {
        ...(productId !== undefined && {
          productId: productId && productId !== "" ? Number(productId) : null,
        }),
        ...(categoryId !== undefined && {
          categoryId: categoryId && categoryId !== "" ? Number(categoryId) : null,
        }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(position !== undefined && { position: Number(position) }),
      },
      include: {
        section: true,
        product: {
          include: { images: true },
        },
        category: true,
      },
    });

    return res.status(200).json({
      data: updatedItem,
      message: "Homepage section item updated successfully",
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(400).json({ message: "This product or category already exists in this section" });
    }

    return res.status(500).json({ message: "Failed to update homepage section item" });
  }
};

export const deleteHomePageSectionItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.homePageSectionItem.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      return res.status(404).json({ message: "Homepage section item not found" });
    }

    await prisma.homePageSectionItem.delete({ where: { id: Number(id) } });

    return res.status(200).json({ message: "Homepage section item deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete homepage section item" });
  }
};
