import type { Request, Response } from "express";
import { prisma } from "#db/prisma.js";

export const getPublicHomepage = async (req: Request, res: Response) => {
  try {
    const homepage = await prisma.homePageSectionGroup.findMany({
      where: { active: true },
      orderBy: { position: "asc" },
      include: {
        sections: {
          where: { active: true },
          orderBy: { position: "asc" },
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
        },
      },
    });

    return res.status(200).json({ data: homepage });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch homepage" });
  }
};
