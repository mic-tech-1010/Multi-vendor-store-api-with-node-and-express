import express from "express";
import { getPublicProductBySlug } from "#controllers/public/products.js";

const router = express.Router();

router.get("/:slug", getPublicProductBySlug);

export default router;

