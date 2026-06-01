import { prisma } from "#db/prisma.js";
import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const groups = await prisma.homePageSectionGroup.findMany({
      where: {
        active: true,
      },

      orderBy: {
        position: "asc",
      },

      include: {
        sections: {
          where: {
            active: true,
          },

          orderBy: {
            position: "asc",
          },

          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            layout: true,
            ctaText: true,
            position: true,
            config: true,

            items: {
              orderBy: {
                position: "asc",
              },

              select: {
                id: true,
                position: true,
                imageUrl: true,

                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    status: true,

                    images: {
                      where: {
                        isPrimary: true,
                      },
                      take: 1,
                      select: {
                        imageUrl: true,
                      },
                    },

                    category: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },

                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    bannerUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      data: groups,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch homepage data",
    });
  }
});

export default router;