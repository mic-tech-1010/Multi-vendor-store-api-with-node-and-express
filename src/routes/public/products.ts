
import express from "express";
import { prisma } from "#db/prisma.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET PRODUCT DETAILS
|--------------------------------------------------------------------------
|
| GET /api/products/:slug
|
*/

router.get("/:slug", async (req, res) => {
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

        /*
        |--------------------------------------------------------------------------
        | CATEGORY
        |--------------------------------------------------------------------------
        */

        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        /*
        |--------------------------------------------------------------------------
        | DEPARTMENT
        |--------------------------------------------------------------------------
        */

        department: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        /*
        |--------------------------------------------------------------------------
        | PRODUCT IMAGES
        |--------------------------------------------------------------------------
        */

        images: {
          orderBy: {
            order: "asc",
          },

          select: {
            id: true,
            imageUrl: true,
            imageAltText: true,
            isPrimary: true,
            order: true,
          },
        },

        /*
        |--------------------------------------------------------------------------
        | PRODUCT ATTRIBUTES
        |--------------------------------------------------------------------------
        */

        attributes: {
          select: {
            id: true,
            name: true,
            type: true,

            values: {
              select: {
                id: true,
                value: true,

                /*
                |--------------------------------------------------------------------------
                | ATTRIBUTE VALUE IMAGES
                |--------------------------------------------------------------------------
                */

                images: {
                  orderBy: {
                    order: "asc",
                  },

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

        /*
        |--------------------------------------------------------------------------
        | SKUS
        |--------------------------------------------------------------------------
        */

        skus: {
          select: {
            id: true,
            sku: true,
            price: true,
            quantity: true,

            attributeValues: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    /*
    |--------------------------------------------------------------------------
    | PRODUCT NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }


    return res.status(200).json({
      data: product,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch product",
    });

  }
});

export default router;

