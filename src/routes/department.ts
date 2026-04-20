import { prisma } from "#db/prisma.js";
import validate from "#lib/validator.js";
import { CreateDepartmentSchema } from "#schemas/validation/departmentSchema.js";
import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
    try {

        const { name, slug, metaTitle, metaDescription, bannerUrl } = req.body;

        // if (!validate(CreateDepartmentSchema, req, res)) {
        //     return;
        // }

        console.log(bannerUrl);

        const newDepartment = await prisma.department.create({
            data: {
                name: name,
                slug: slug,
                metaTitle: metaTitle,
                metaDescription: metaDescription,
                imageCldPubId: bannerUrl
            }
        })

        if (!newDepartment) {
            return res.status(400).json({ error: "Failed to create department" });
        }
        res.status(201).json(newDepartment);
    } catch (error) {
        console.error('POST /departments error:', error);
        res.status(500).json({ error: "Failed to create department" });
    }
});

export default router;