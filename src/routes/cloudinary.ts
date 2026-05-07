import { v2 as cloudinary } from "cloudinary";
import express from "express";

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

router.post("/delete", async (req, res) => {
  const { publicIds } = req.body;

  if (!publicIds?.length) {
    return res.json({ success: true });
  }

  try {
    await Promise.all(
      publicIds.map((id: string) =>
        cloudinary.uploader.destroy(id)
      )
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;