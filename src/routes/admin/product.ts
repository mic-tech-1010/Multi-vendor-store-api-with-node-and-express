import express from 'express';
import {
    createProduct,
    deleteProduct,
    getProductById,
    listProducts,
    toggleVariations,
    updateProduct,
    updateProductAttributes,
    updateProductSkus,
} from '#controllers/admin/product.js';
import { validateBody } from '#lib/validator.js';
import { CreateProductSchema, UpdateProductSchema } from '#schemas/validation/productSchema.js';

const router = express.Router();

router.get("/", listProducts);
router.get("/:id", getProductById);
router.post("/", validateBody(CreateProductSchema), createProduct);
router.put("/:id/attributes", updateProductAttributes);
router.put("/:id/skus", updateProductSkus);
router.patch("/:id/toggle-variations", toggleVariations);
router.patch("/:id", validateBody(UpdateProductSchema), updateProduct);
router.delete("/:id", deleteProduct);

export default router;

