import express from 'express';
import { prisma } from '../db/prisma';
import validate from '#lib/validator.js';
import { CreateProductSchema, UpdateProductSchema } from '#schemas/validation/productSchema.js';

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

