import express from "express";
import { getPublicHomepage } from "#controllers/public/home.js";

const router = express.Router();

router.get("/", getPublicHomepage);

export default router;