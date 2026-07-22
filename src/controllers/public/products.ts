import type { Request, Response } from "express";
import { prisma } from "#db/prisma.js";

export const getPublicProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: "active",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        descriptionHtml: true,
        price: true,
        quantity: true,
        hasVariations: true,
        status: true,
        metaTitle: true,
        metaDescription: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            imageUrl: true,
            imageAltText: true,
            isPrimary: true,
            order: true,
          },
        },
        attributes: {
          select: {
            id: true,
            name: true,
            type: true,
            values: {
              select: {
                id: true,
                value: true,
                images: {
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    imageUrl: true,
                    imageAltText: true,
                    isPrimary: true,
                    order: true,
                  },
                },
              },
            },
          },
        },
        skus: {
          select: {
            id: true,
            sku: true,
            price: true,
            quantity: true,
            attributeValues: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ data: product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch product" });
  }
};
