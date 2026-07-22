import express from "express";
import {
    createHomePageSectionGroup,
    deleteHomePageSectionGroup,
    getHomePageSectionGroupById,
    listHomePageSectionGroups,
    reorderHomePageSectionGroups,
    updateHomePageSectionGroup,
} from "#controllers/admin/homeSectionGroup.js";

const router = express.Router();

router.get("/", listHomePageSectionGroups);
router.get("/:id", getHomePageSectionGroupById);
router.post("/", createHomePageSectionGroup);
router.patch("/reorder", reorderHomePageSectionGroups);
router.patch("/:id", updateHomePageSectionGroup);
router.delete("/:id", deleteHomePageSectionGroup);

export default router;