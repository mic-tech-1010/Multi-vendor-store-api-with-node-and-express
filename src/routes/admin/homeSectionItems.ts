import express from "express";
import {
    createHomePageSectionItem,
    deleteHomePageSectionItem,
    getHomePageSectionItemById,
    listHomePageSectionItems,
    reorderHomePageSectionItems,
    updateHomePageSectionItem,
} from "#controllers/admin/homeSectionItems.js";

const router = express.Router();

router.get("/", listHomePageSectionItems);
router.get("/:id", getHomePageSectionItemById);
router.post("/", createHomePageSectionItem);
router.patch("/reorder", reorderHomePageSectionItems);
router.patch("/:id", updateHomePageSectionItem);
router.delete("/:id", deleteHomePageSectionItem);

export default router;