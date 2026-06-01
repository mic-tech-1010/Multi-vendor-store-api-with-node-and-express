import express from 'express';
import { prisma } from '../../db/prisma';
import validate from '#lib/validator.js';
import { CreateProductSchema, UpdateProductSchema } from '#schemas/validation/productSchema.js';
import { generateProductSkus } from '#services/product-sku-generator.js';

const router = express.Router();

// get all products with optional search, filtering and pagination
router.get("/", async (req, res) => {
    try {
        const { search, category, department, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(1, +limit);

        const offset = (currentPage - 1) * limitPerPage;

        const whereCondition: any = {};

        if (search) {
            whereCondition.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (department) {
            whereCondition.department = { name: { contains: department, mode: 'insensitive' } };
        }

        if (category) {
            whereCondition.category = { name: { contains: category, mode: 'insensitive' } };
        }

        const totalCount = await prisma.product.count({
            where: whereCondition
        });

        const productLists = await prisma.product.findMany({
            where: whereCondition,
            include: {
                category: true,
                department: true,
                images: {
                    where: { isPrimary: true },
                    take: 1
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: offset,
            take: limitPerPage
        });

        res.status(200).json({
            data: productLists,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
});

// get a single product
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                category: true,
                department: true,
                images: {
                    orderBy: { order: 'asc' }
                },
                skus: {
                    include: {
                        attributeValues: {
                            select: {
                                id: true,
                                value: true,
                            },
                        },
                    },
                },
                attributes: {
                    include: {
                        values: {
                            include: {
                                images: {
                                    orderBy: {
                                        order: "asc",
                                    },
                                },
                            },
                        },
                    },
                },
                createdByUser: {
                    select: { id: true, name: true, email: true }
                },
                updatedByUser: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        console.error("GET /products/:id error:", error);
        res.status(500).json({ message: "Failed to fetch product" });
    }
});

// create a new product
router.post("/", async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            departmentId,
            categoryId,
            status = 'active',
            price,
            quantity,
            metaTitle,
            metaDescription,
            hasVariations = false,
            images = [],
            createdBy,
            updatedBy
        } = req.body;

        if (!validate(CreateProductSchema, req, res)) {
            return;
        }

        //Verify department and category exist
        const department = await prisma.department.findUnique({
            where: { id: Number(departmentId) }
        });

        if (!department) {
            return res.status(400).json({ error: "Invalid department ID" });
        }

        const category = await prisma.category.findUnique({
            where: { id: Number(categoryId) }
        });

        if (!category) {
            return res.status(400).json({ error: "Invalid category ID" });
        }

        // // Verify category belongs to department
        if (category.departmentId !== Number(departmentId)) {
            return res.status(400).json({ error: "Category does not belong to the specified department" });
        }

        const newProduct = await prisma.product.create({
            data: {
                name,
                slug,
                description: description || {},
                departmentId: Number(departmentId),
                categoryId: Number(categoryId),
                status,
                price: Number(price),
                quantity: quantity ? Number(quantity) : null,
                metaTitle,
                metaDescription,
                hasVariations,
                createdBy: createdBy || "user_vendor",
                updatedBy: updatedBy || "user_vendor"
            },
        });

        // Create product images if provided
        if (images && images.length > 0) {
            const imageData = images.map((img, index) => ({
                productId: newProduct.id,
                imageUrl: img.imageUrl,
                imageCldPubId: img.imageCldPubId,
                imageAltText: img.imageAltText || `${newProduct.name} image ${index + 1}`,
                isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0,
                order: img.order !== undefined ? img.order : index
            }));

            await prisma.productImage.createMany({
                data: imageData
            });
        }

        // Fetch the product with images for response
        const productWithImages = await prisma.product.findUnique({
            where: { id: newProduct.id },
            include: {
                category: true,
                department: true,
                images: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        res.status(201).json({
            data: productWithImages,
            message: "Product created successfully"
        });
    } catch (error) {
        console.error('POST /products error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Product with this slug already exists" });
        }
        res.status(500).json({ error: "Failed to create product" });
    }
});

// create or update product attributes
router.put(
    "/:id/attributes",
    async (req, res) => {
        try {
            const productId = Number(
                req.params.id
            );

            const {
                productAttributes,
            } = req.body;



            /*
            |--------------------------------------------------------------------------
            | PRODUCT
            |--------------------------------------------------------------------------
            */

            const product =
                await prisma.product.findUnique({
                    where: {
                        id: productId,
                    },

                    include: {
                        attributes: {
                            include: {
                                values: {
                                    include: {
                                        images: true,
                                    },
                                },
                            },
                        },
                    },
                });

            if (!product) {
                return res.status(404).json({
                    error: "Product not found",
                });
            }

            /*
            |--------------------------------------------------------------------------
            | TRANSACTION
            |--------------------------------------------------------------------------
            */

            await prisma.$transaction(
                async (tx) => {
                    /*
                    |--------------------------------------------------------------------------
                    | EXISTING ATTRIBUTES
                    |--------------------------------------------------------------------------
                    */

                    const existingAttributes =
                        product.attributes;

                    /*
                    |--------------------------------------------------------------------------
                    | DELETE REMOVED ATTRIBUTES
                    |--------------------------------------------------------------------------
                    */

                    const incomingAttributeIds =
                        productAttributes
                            .filter(
                                (attr: any) => attr.id
                            )
                            .map(
                                (attr: any) => attr.id
                            );

                    const attributesToDelete =
                        existingAttributes.filter(
                            (existing) =>
                                !incomingAttributeIds.includes(
                                    existing.id
                                )
                        );

                    for (const attribute of attributesToDelete) {
                        await tx.productAttribute.delete({
                            where: {
                                id: attribute.id,
                            },
                        });
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | UPSERT ATTRIBUTES
                    |--------------------------------------------------------------------------
                    */

                    for (const incomingAttribute of productAttributes) {
                        let attributeId =
                            incomingAttribute.id;

                        /*
                        |--------------------------------------------------------------------------
                        | UPDATE ATTRIBUTE
                        |--------------------------------------------------------------------------
                        */

                        if (attributeId) {
                            await tx.productAttribute.update({
                                where: {
                                    id: attributeId,
                                },

                                data: {
                                    name:
                                        incomingAttribute.name,

                                    type:
                                        incomingAttribute.type,
                                },
                            });
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | CREATE ATTRIBUTE
                        |--------------------------------------------------------------------------
                        */

                        else {
                            const createdAttribute =
                                await tx.productAttribute.create(
                                    {
                                        data: {
                                            productId,

                                            name:
                                                incomingAttribute.name,

                                            type:
                                                incomingAttribute.type,
                                        },
                                    }
                                );

                            attributeId =
                                createdAttribute.id;
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | EXISTING VALUES
                        |--------------------------------------------------------------------------
                        */

                        const existingAttribute =
                            existingAttributes.find(
                                (attr) =>
                                    attr.id === attributeId
                            );

                        const existingValues =
                            existingAttribute?.values ||
                            [];

                        /*
                        |--------------------------------------------------------------------------
                        | DELETE REMOVED VALUES
                        |--------------------------------------------------------------------------
                        */

                        const incomingValueIds =
                            incomingAttribute.options
                                .filter(
                                    (option: any) =>
                                        option.id
                                )
                                .map(
                                    (option: any) =>
                                        option.id
                                );

                        const valuesToDelete =
                            existingValues.filter(
                                (existingValue) =>
                                    !incomingValueIds.includes(
                                        existingValue.id
                                    )
                            );

                        for (const value of valuesToDelete) {
                            await tx.productAttributeValue.delete(
                                {
                                    where: {
                                        id: value.id,
                                    },
                                }
                            );
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | UPSERT VALUES
                        |--------------------------------------------------------------------------
                        */

                        for (const option of incomingAttribute.options) {
                            let valueId = option.id;

                            /*
                            |--------------------------------------------------------------------------
                            | UPDATE VALUE
                            |--------------------------------------------------------------------------
                            */

                            if (valueId) {
                                await tx.productAttributeValue.update(
                                    {
                                        where: {
                                            id: valueId,
                                        },

                                        data: {
                                            value:
                                                option.value,
                                        },
                                    }
                                );
                            }

                            /*
                            |--------------------------------------------------------------------------
                            | CREATE VALUE
                            |--------------------------------------------------------------------------
                            */

                            else {
                                const createdValue =
                                    await tx.productAttributeValue.create(
                                        {
                                            data: {
                                                productAttributeId:
                                                    attributeId,

                                                value:
                                                    option.value,
                                            },
                                        }
                                    );

                                valueId =
                                    createdValue.id;
                            }

                            /*
                            |--------------------------------------------------------------------------
                            | REPLACE IMAGES
                            |--------------------------------------------------------------------------
                            */

                            await tx.productAttributeValueImage.deleteMany(
                                {
                                    where: {
                                        productAttributeValueId:
                                            valueId,
                                    },
                                }
                            );

                            if (
                                option.images &&
                                option.images.length > 0
                            ) {
                                await tx.productAttributeValueImage.createMany(
                                    {
                                        data:
                                            option.images.map(
                                                (
                                                    image: any,
                                                    index: number
                                                ) => ({
                                                    productAttributeValueId:
                                                        valueId,

                                                    imageUrl:
                                                        image.url,

                                                    imageCldPubId:
                                                        image.publicId,

                                                    imageAltText:
                                                        option.value,

                                                    order: index,

                                                    isPrimary:
                                                        index === 0,
                                                })
                                            ),
                                    }
                                );
                            }
                        }
                    }
                }
            );

            await generateProductSkus(productId);

            return res.status(200).json({
                message:
                    "Attributes updated successfully",

            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                error:
                    "Failed to update product attributes",
            });
        }
    }
);

// create or update product skus
router.put(
    "/:id/skus",
    async (req, res) => {
        try {
            const productId = Number(req.params.id);

            const { productSkus } = req.body;

            const product =
                await prisma.product.findUnique({
                    where: {
                        id: productId,
                    },
                });

            if (!product) {
                return res.status(404).json({
                    error: "Product not found",
                });
            }

            await prisma.$transaction(
                productSkus.map((sku: any) =>
                    prisma.productSku.update({
                        where: {
                            id: sku.id,
                        },

                        data: {
                            price: sku.price,

                            quantity: sku.quantity,
                        },
                    })
                )
            );

            return res.status(200).json({
                message: "SKUs updated successfully",
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                error: "Failed to update SKUs",
            });
        }
    }
);

// toggle variations
router.patch(
    "/:id/toggle-variations",
    async (req, res) => {
        try {
            const { id } = req.params;

            const {
                hasVariations,
            } = req.body;

            const product =
                await prisma.product.update({
                    where: {
                        id: Number(id),
                    },

                    data: {
                        hasVariations,
                    },
                });

            // future logic
            if (!hasVariations) {
                // delete skus
                // delete combinations
                // delete inventories
            }

            res.status(200).json({
                data: product,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message:
                    "Failed to toggle variations",
            });
        }
    }
);

// update a product
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            slug,
            description,
            departmentId,
            categoryId,
            status,
            price,
            quantity,
            metaTitle,
            metaDescription,
            hasVariations,
            images,
            updatedBy
        } = req.body;

        if (!validate(UpdateProductSchema, req, res)) {
            return;
        }

        const existingProduct = await prisma.product.findUnique({
            where: { id: Number(id) }
        });

        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        // If departmentId or categoryId provided, validate them
        if (departmentId || categoryId) {
            const deptId = departmentId ? Number(departmentId) : existingProduct.departmentId;
            const catId = categoryId ? Number(categoryId) : existingProduct.categoryId;

            const department = await prisma.department.findUnique({
                where: { id: deptId }
            });

            if (!department) {
                return res.status(400).json({ error: "Invalid department ID" });
            }

            const category = await prisma.category.findUnique({
                where: { id: catId }
            });

            if (!category) {
                return res.status(400).json({ error: "Invalid category ID" });
            }

            if (category.departmentId !== deptId) {
                return res.status(400).json({ error: "Category does not belong to the specified department" });
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) updateData.slug = slug;
        if (description !== undefined) updateData.description = description;
        if (departmentId !== undefined) updateData.departmentId = Number(departmentId);
        if (categoryId !== undefined) updateData.categoryId = Number(categoryId);
        if (status !== undefined) updateData.status = status;
        if (price !== undefined) updateData.price = Number(price);
        if (quantity !== undefined) updateData.quantity = quantity ? Number(quantity) : null;
        if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
        if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
        if (hasVariations !== undefined) updateData.hasVariations = hasVariations;
        if (updatedBy !== undefined) updateData.updatedBy = updatedBy;

        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                category: true,
                department: true
            }
        });

        // Handle images update if provided
        if (images !== undefined) {
            // Delete existing images
            await prisma.productImage.deleteMany({
                where: { productId: Number(id) }
            });

            // Create new images if provided
            if (images && images.length > 0) {
                const imageData = images.map((img, index) => ({
                    productId: Number(id),
                    imageUrl: img.imageUrl,
                    imageCldPubId: img.imageCldPubId,
                    imageAltText: img.imageAltText || `${updatedProduct.name} image ${index + 1}`,
                    isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0,
                    order: img.order !== undefined ? img.order : index
                }));

                await prisma.productImage.createMany({
                    data: imageData
                });
            }
        }

        // Fetch the updated product with images
        const productWithImages = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                category: true,
                department: true,
                images: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        res.status(200).json({
            data: productWithImages,
            message: "Product updated successfully"
        });
    } catch (error) {
        console.error("PATCH /products/:id error:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Product with this slug already exists" });
        }
        res.status(500).json({ message: "Failed to update product" });
    }
});

// delete a product
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                images: true
            }
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Delete associated images first (cascade should handle this, but being explicit)
        await prisma.productImage.deleteMany({
            where: { productId: Number(id) }
        });

        // Delete the product
        await prisma.product.delete({
            where: { id: Number(id) }
        });

        return res.status(200).json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("DELETE /products/:id error:", error);
        return res.status(500).json({
            message: "Failed to delete product"
        });
    }
});

export default router;

