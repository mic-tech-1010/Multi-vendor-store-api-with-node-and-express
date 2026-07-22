import type { Request, Response } from "express";
import { prisma } from "#db/prisma.js";

export const listHomePageSectionGroups = async (req: Request, res: Response) => {
  try {
    const { active, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, Number(page));
    const limitPerPage = Math.max(1, Number(limit));
    const offset = (currentPage - 1) * limitPerPage;

    const whereCondition: Record<string, unknown> = {};

    if (active !== undefined) {
      whereCondition.active = active === "true";
    }

    const totalCount = await prisma.homePageSectionGroup.count({ where: whereCondition });

    const groups = await prisma.homePageSectionGroup.findMany({
      where: whereCondition,
      include: {
        sections: {
          select: {
            id: true,
            title: true,
            slug: true,
            layout: true,
            type: true,
            active: true,
            position: true,
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { position: "asc" },
      skip: offset,
      take: limitPerPage,
    });

    return res.status(200).json({
      data: groups,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch homepage section groups" });
  }
};

export const getHomePageSectionGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const group = await prisma.homePageSectionGroup.findUnique({
      where: { id: Number(id) },
      include: {
        sections: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: { where: { isPrimary: true }, take: 1 },
                  },
                },
                category: true,
              },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ message: "Homepage section group not found" });
    }

    return res.status(200).json({ data: group });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch homepage section group" });
  }
};

export const createHomePageSectionGroup = async (req: Request, res: Response) => {
  try {
    const { isFullWidth = true, active = true, sectionIds = [] } = req.body;

    const lastGroup = await prisma.homePageSectionGroup.findFirst({ orderBy: { position: "desc" } });
    const nextPosition = lastGroup ? lastGroup.position + 1 : 1;

    const group = await prisma.homePageSectionGroup.create({
      data: {
        isFullWidth,
        active,
        position: nextPosition,
      },
    });

    if (sectionIds.length > 0) {
      await prisma.homePageSection.updateMany({
        where: { id: { in: sectionIds.map((id: number) => Number(id)) } },
        data: { groupId: group.id },
      });
    }

    const createdGroup = await prisma.homePageSectionGroup.findUnique({
      where: { id: group.id },
      include: {
        sections: {
          orderBy: { position: "asc" },
        },
      },
    });

    return res.status(201).json({
      data: createdGroup,
      message: "Homepage section group created successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create homepage section group" });
  }
};

export const reorderHomePageSectionGroups = async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.homePageSectionGroup.update({
          where: { id: Number(item.id) },
          data: { position: Number(item.position) + 1000 },
        });
      }

      for (const [index, item] of items.entries()) {
        await tx.homePageSectionGroup.update({
          where: { id: Number(item.id) },
          data: { position: index + 1 },
        });
      }
    });

    return res.status(200).json({ message: "Homepage section groups reordered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to reorder homepage section groups" });
  }
};

export const updateHomePageSectionGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isFullWidth, active, position, sectionIds } = req.body;

    const existingGroup = await prisma.homePageSectionGroup.findUnique({
      where: { id: Number(id) },
    });

    if (!existingGroup) {
      return res.status(404).json({ message: "Homepage section group not found" });
    }

    await prisma.homePageSectionGroup.update({
      where: { id: Number(id) },
      data: {
        ...(isFullWidth !== undefined && { isFullWidth }),
        ...(active !== undefined && { active }),
        ...(position !== undefined && { position: Number(position) }),
      },
    });

    if (sectionIds !== undefined) {
      await prisma.homePageSection.updateMany({
        where: { groupId: Number(id) },
        data: { groupId: null },
      });

      if (sectionIds.length > 0) {
        await prisma.homePageSection.updateMany({
          where: { id: { in: sectionIds.map((id: number) => Number(id)) } },
          data: { groupId: Number(id) },
        });
      }
    }

    const updatedGroup = await prisma.homePageSectionGroup.findUnique({
      where: { id: Number(id) },
      include: {
        sections: {
          include: {
            items: {
              include: {
                product: true,
                category: true,
              },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    return res.status(200).json({
      data: updatedGroup,
      message: "Homepage section group updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update homepage section group" });
  }
};

export const deleteHomePageSectionGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingGroup = await prisma.homePageSectionGroup.findUnique({
      where: { id: Number(id) },
    });

    if (!existingGroup) {
      return res.status(404).json({ message: "Homepage section group not found" });
    }

    await prisma.homePageSection.updateMany({
      where: { groupId: Number(id) },
      data: { groupId: null },
    });

    await prisma.homePageSectionGroup.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({ message: "Homepage section group deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete homepage section group" });
  }
};
