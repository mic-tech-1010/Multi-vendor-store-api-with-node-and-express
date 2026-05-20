import express from "express";
import { prisma } from "../db/prisma";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET ALL HOME PAGE SECTION ITEMS
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
    try {

        const {
            page = 1,
            limit = 10,
            sectionId,
            productId,
            categoryId,
        } = req.query;

        const currentPage =
            Math.max(1, Number(page));

        const limitPerPage =
            Math.max(1, Number(limit));

        const offset =
            (currentPage - 1) * limitPerPage;

        const whereCondition: any = {};

        /*
        |--------------------------------------------------------------------------
        | FILTER BY SECTION
        |--------------------------------------------------------------------------
        */

        if (
            sectionId &&
            typeof sectionId === "string"
        ) {
            const id = Number(sectionId);

            if (!isNaN(id)) {
                whereCondition.sectionId = id;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | FILTER BY PRODUCT
        |--------------------------------------------------------------------------
        */

        if (
            productId &&
            typeof productId === "string"
        ) {
            const id = Number(productId);

            if (!isNaN(id)) {
                whereCondition.productId = id;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | FILTER BY CATEGORY
        |--------------------------------------------------------------------------
        */

        if (
            categoryId &&
            typeof categoryId === "string"
        ) {
            const id = Number(categoryId);

            if (!isNaN(id)) {
                whereCondition.categoryId = id;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | TOTAL
        |--------------------------------------------------------------------------
        */

        const totalCount =
            await prisma.homePageSectionItem.count(
                {
                    where: whereCondition,
                }
            );

        /*
        |--------------------------------------------------------------------------
        | DATA
        |--------------------------------------------------------------------------
        */

        const items =
            await prisma.homePageSectionItem.findMany(
                {
                    where: whereCondition,

                    include: {
                        section: true,

                        product: {
                            include: {
                                images: {
                                    orderBy: {
                                        order: "asc",
                                    },
                                },
                            },
                        },

                        category: true,
                    },

                    orderBy: {
                        position: "asc",
                    },

                    skip: offset,

                    take: limitPerPage,
                }
            );

        return res.status(200).json({
            data: items,

            pagination: {
                page: currentPage,

                limit: limitPerPage,

                total: totalCount,

                totalPages: Math.ceil(
                    totalCount / limitPerPage
                ),
            },
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message:
                "Failed to fetch homepage section items",
        });

    }
});

/*
|--------------------------------------------------------------------------
| GET SINGLE HOME PAGE SECTION ITEM
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const item =
            await prisma.homePageSectionItem.findUnique(
                {
                    where: {
                        id: Number(id),
                    },

                    include: {
                        section: true,

                        product: {
                            include: {
                                images: {
                                    orderBy: {
                                        order: "asc",
                                    },
                                },
                            },
                        },

                        category: true,
                    },
                }
            );

        if (!item) {
            return res.status(404).json({
                message:
                    "Homepage section item not found",
            });
        }

        return res.status(200).json(item);

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message:
                "Failed to fetch homepage section item",
        });

    }
});

/*
|--------------------------------------------------------------------------
| CREATE HOME PAGE SECTION ITEM
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
    try {

        const {
            sectionId,
            productId,
            categoryId,
            imageUrl,
            position = 0,
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | VALIDATE SECTION
        |--------------------------------------------------------------------------
        */

        const existingSection =
            await prisma.homePageSection.findUnique(
                {
                    where: {
                        id: Number(sectionId),
                    },
                }
            );

        if (!existingSection) {
            return res.status(404).json({
                message:
                    "Homepage section not found",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE ITEM
        |--------------------------------------------------------------------------
        */

        const item =
            await prisma.homePageSectionItem.create(
                {
                    data: {
                        sectionId:
                            Number(sectionId),

                        productId:
                            productId &&
                            productId !== ""
                                ? Number(productId)
                                : null,

                        categoryId:
                            categoryId &&
                            categoryId !== ""
                                ? Number(categoryId)
                                : null,

                        imageUrl:
                            imageUrl || null,

                        position:
                            Number(position),
                    },

                    include: {
                        section: true,

                        product: {
                            include: {
                                images: true,
                            },
                        },

                        category: true,
                    },
                }
            );

        return res.status(201).json({
            data: item,

            message:
                "Homepage section item created successfully",
        });

    } catch (error: any) {

        console.error(error);

        /*
        |--------------------------------------------------------------------------
        | UNIQUE CONSTRAINT
        |--------------------------------------------------------------------------
        */

        if (error.code === "P2002") {
            return res.status(400).json({
                message:
                    "This product or category already exists in this section",
            });
        }

        return res.status(500).json({
            message:
                "Failed to create homepage section item",
        });

    }
});

/*
|--------------------------------------------------------------------------
| UPDATE HOME PAGE SECTION ITEM
|--------------------------------------------------------------------------
*/

router.patch("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const {
            productId,
            categoryId,
            imageUrl,
            position,
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | EXISTING ITEM
        |--------------------------------------------------------------------------
        */

        const existingItem =
            await prisma.homePageSectionItem.findUnique(
                {
                    where: {
                        id: Number(id),
                    },
                }
            );

        if (!existingItem) {
            return res.status(404).json({
                message:
                    "Homepage section item not found",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE ITEM
        |--------------------------------------------------------------------------
        */

        const updatedItem =
            await prisma.homePageSectionItem.update(
                {
                    where: {
                        id: Number(id),
                    },

                    data: {
                        ...(productId !==
                            undefined && {
                                productId:
                                    productId &&
                                    productId !== ""
                                        ? Number(productId)
                                        : null,
                            }),

                        ...(categoryId !==
                            undefined && {
                                categoryId:
                                    categoryId &&
                                    categoryId !== ""
                                        ? Number(categoryId)
                                        : null,
                            }),

                        ...(imageUrl !==
                            undefined && {
                                imageUrl:
                                    imageUrl ||
                                    null,
                            }),

                        ...(position !==
                            undefined && {
                                position:
                                    Number(position),
                            }),
                    },

                    include: {
                        section: true,

                        product: {
                            include: {
                                images: true,
                            },
                        },

                        category: true,
                    },
                }
            );

        return res.status(200).json({
            data: updatedItem,

            message:
                "Homepage section item updated successfully",
        });

    } catch (error: any) {

        console.error(error);

        /*
        |--------------------------------------------------------------------------
        | UNIQUE CONSTRAINT
        |--------------------------------------------------------------------------
        */

        if (error.code === "P2002") {
            return res.status(400).json({
                message:
                    "This product or category already exists in this section",
            });
        }

        return res.status(500).json({
            message:
                "Failed to update homepage section item",
        });

    }
});

/*
|--------------------------------------------------------------------------
| DELETE HOME PAGE SECTION ITEM
|--------------------------------------------------------------------------
*/

router.delete("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const item =
            await prisma.homePageSectionItem.findUnique(
                {
                    where: {
                        id: Number(id),
                    },
                }
            );

        if (!item) {
            return res.status(404).json({
                message:
                    "Homepage section item not found",
            });
        }

        await prisma.homePageSectionItem.delete(
            {
                where: {
                    id: Number(id),
                },
            }
        );

        return res.status(200).json({
            message:
                "Homepage section item deleted successfully",
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message:
                "Failed to delete homepage section item",
        });

    }
});

export default router;