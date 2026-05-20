import express from "express";
import { prisma } from "../db/prisma";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET ALL HOME PAGE SECTIONS
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
    try {
        const {
            search,
            active,
            type,
            page = 1,
            limit = 10,
        } = req.query;

        const currentPage = Math.max(1, Number(page));
        const limitPerPage = Math.max(1, Number(limit));

        const offset =
            (currentPage - 1) * limitPerPage;

        const whereCondition: any = {};

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if (search) {
            whereCondition.OR = [
                {
                    title: {
                        contains: search,
                        mode: "insensitive",
                    },
                },

                {
                    slug: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | ACTIVE
        |--------------------------------------------------------------------------
        */

        if (active !== undefined) {
            whereCondition.active =
                active === "true";
        }

        /*
        |--------------------------------------------------------------------------
        | TYPE
        |--------------------------------------------------------------------------
        */

        if (type) {
            whereCondition.type = type;
        }

        /*
        |--------------------------------------------------------------------------
        | TOTAL
        |--------------------------------------------------------------------------
        */

        const totalCount =
            await prisma.homePageSection.count({
                where: whereCondition,
            });

        /*
        |--------------------------------------------------------------------------
        | DATA
        |--------------------------------------------------------------------------
        */

        const sections =
            await prisma.homePageSection.findMany(
                {
                    where: whereCondition,

                    include: {
                        items: {
                            include: {
                                product: {
                                    include: {
                                        images: {
                                            where: {
                                                isPrimary: true,
                                            },

                                            take: 1,
                                        },
                                    },
                                },

                                category: true,
                            },

                            orderBy: {
                                position: "asc",
                            },
                        },
                    },

                    orderBy: {
                        position: "asc",
                    },

                    skip: offset,

                    take: limitPerPage,
                }
            );

        return res.status(200).json({
            data: sections,

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
                "Failed to fetch homepage sections",
        });
    }
});

/*
|--------------------------------------------------------------------------
| GET SINGLE HOME PAGE SECTION
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const section =
            await prisma.homePageSection.findUnique(
                {
                    where: {
                        id: Number(id),
                    },

                    include: {
                        items: {
                            include: {
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
                        },
                    },
                }
            );

        if (!section) {
            return res.status(404).json({
                message:
                    "Home page section not found",
            });
        }

        return res.status(200).json(section);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message:
                "Failed to fetch homepage section",
        });
    }
});

/*
|--------------------------------------------------------------------------
| CREATE HOME PAGE SECTION
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
    try {
        const {
            title,
            slug,
            ctaText,
            type,
            layout,
            active = true,
            position = 0,
            config,
            items = [],
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | CREATE SECTION
        |--------------------------------------------------------------------------
        */

        const section =
            await prisma.homePageSection.create({
                data: {
                    title,

                    slug,

                    ctaText,

                    type,

                    layout,

                    active,

                    position: Number(position),

                    config: config || {},
                },
            });

        /*
        |--------------------------------------------------------------------------
        | CREATE ITEMS
        |--------------------------------------------------------------------------
        */

        if (items.length > 0) {
            const itemData = items.map(
                (
                    item: any,
                    index: number
                ) => ({
                    sectionId: section.id,

                    productId:
                        item.productId
                            ? Number(
                                item.productId
                            )
                            : null,

                    categoryId:
                        item.categoryId
                            ? Number(
                                item.categoryId
                            )
                            : null,

                    imageUrl:
                        item.imageUrl || null,

                    position:
                        item.position ??
                        index,
                })
            );

            await prisma.homePageSectionItem.createMany(
                {
                    data: itemData,
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | FETCH CREATED SECTION
        |--------------------------------------------------------------------------
        */

        const createdSection =
            await prisma.homePageSection.findUnique(
                {
                    where: {
                        id: section.id,
                    },

                    include: {
                        items: {
                            include: {
                                product: {
                                    include: {
                                        images: true,
                                    },
                                },

                                category: true,
                            },

                            orderBy: {
                                position: "asc",
                            },
                        },
                    },
                }
            );

        return res.status(201).json({
            data: createdSection,

            message:
                "Homepage section created successfully",
        });
    } catch (error: any) {
        console.error(error);

        if (error.code === "P2002") {
            return res.status(400).json({
                error:
                    "Section with this slug already exists",
            });
        }

        return res.status(500).json({
            error:
                "Failed to create homepage section",
        });
    }
});

/*
|--------------------------------------------------------------------------
| UPDATE HOME PAGE SECTION
|--------------------------------------------------------------------------
*/

router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            slug,
            ctaText,
            type,
            layout,
            active,
            position,
            config,
            items,
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | EXISTING SECTION
        |--------------------------------------------------------------------------
        */

        const existingSection =
            await prisma.homePageSection.findUnique(
                {
                    where: {
                        id: Number(id),
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
        | UPDATE SECTION
        |--------------------------------------------------------------------------
        */

        const updatedSection =
            await prisma.homePageSection.update({
                where: {
                    id: Number(id),
                },

                data: {
                    ...(title !== undefined && {
                        title,
                    }),

                    ...(slug !== undefined && {
                        slug,
                    }),

                    ...(ctaText !==
                        undefined && {
                            ctaText,
                        }),

                    ...(type !== undefined && {
                        type,
                    }),

                    ...(layout !== undefined && {
                        layout,
                    }),

                    ...(active !== undefined && {
                        active,
                    }),

                    ...(position !==
                        undefined && {
                            position:
                                Number(position),
                        }),

                    ...(config !== undefined && {
                        config,
                    }),
                },
            });

        /*
        |--------------------------------------------------------------------------
        | REPLACE ITEMS
        |--------------------------------------------------------------------------
        */

        if (items !== undefined) {
            await prisma.homePageSectionItem.deleteMany(
                {
                    where: {
                        sectionId:
                            Number(id),
                    },
                }
            );

            if (items.length > 0) {
                await prisma.homePageSectionItem.createMany(
                    {
                        data: items.map(
                            (
                                item: any,
                                index: number
                            ) => ({
                                sectionId:
                                    Number(id),

                                productId:
                                    item.productId
                                        ? Number(
                                            item.productId
                                        )
                                        : null,

                                categoryId:
                                    item.categoryId
                                        ? Number(
                                            item.categoryId
                                        )
                                        : null,

                                imageUrl:
                                    item.imageUrl ||
                                    null,

                                position:
                                    item.position ??
                                    index,
                            })
                        ),
                    }
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | FETCH UPDATED SECTION
        |--------------------------------------------------------------------------
        */

        const sectionWithItems =
            await prisma.homePageSection.findUnique(
                {
                    where: {
                        id: updatedSection.id,
                    },

                    include: {
                        items: {
                            include: {
                                product: {
                                    include: {
                                        images: true,
                                    },
                                },

                                category: true,
                            },

                            orderBy: {
                                position: "asc",
                            },
                        },
                    },
                }
            );

        return res.status(200).json({
            data: sectionWithItems,

            message:
                "Homepage section updated successfully",
        });
    } catch (error: any) {
        console.error(error);

        if (error.code === "P2002") {
            return res.status(400).json({
                error:
                    "Section with this slug already exists",
            });
        }

        return res.status(500).json({
            message:
                "Failed to update homepage section",
        });
    }
});

/*
|--------------------------------------------------------------------------
| DELETE HOME PAGE SECTION
|--------------------------------------------------------------------------
*/

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const section =
            await prisma.homePageSection.findUnique(
                {
                    where: {
                        id: Number(id),
                    },
                }
            );

        if (!section) {
            return res.status(404).json({
                message:
                    "Homepage section not found",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | DELETE ITEMS
        |--------------------------------------------------------------------------
        */

        await prisma.homePageSectionItem.deleteMany(
            {
                where: {
                    sectionId:
                        Number(id),
                },
            }
        );

        /*
        |--------------------------------------------------------------------------
        | DELETE SECTION
        |--------------------------------------------------------------------------
        */

        await prisma.homePageSection.delete({
            where: {
                id: Number(id),
            },
        });

        return res.status(200).json({
            message:
                "Homepage section deleted successfully",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message:
                "Failed to delete homepage section",
        });
    }
});

export default router;