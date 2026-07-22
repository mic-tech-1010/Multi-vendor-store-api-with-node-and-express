import express from "express";
import {
    createHomePageSection,
    deleteHomePageSection,
    getHomePageSectionById,
    listHomePageSections,
    reorderHomePageSections,
    updateHomePageSection,
} from "#controllers/admin/homeSection.js";

const router = express.Router();

router.get("/", listHomePageSections);
router.get("/:id", getHomePageSectionById);
router.post("/", createHomePageSection);
router.patch("/reorder", reorderHomePageSections);
router.patch("/:id", updateHomePageSection);
router.delete("/:id", deleteHomePageSection);

export default router;