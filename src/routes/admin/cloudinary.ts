import express from "express";
import { deleteCloudinaryAssets } from "#controllers/admin/cloudinary.js";

const router = express.Router();

router.post("/delete", deleteCloudinaryAssets);

export default router;