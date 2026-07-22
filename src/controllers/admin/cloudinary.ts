import type { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const deleteCloudinaryAssets = async (req: Request, res: Response) => {
  const { publicIds } = req.body;

  if (!publicIds?.length) {
    return res.json({ success: true });
  }

  try {
    await Promise.all(publicIds.map((id: string) => cloudinary.uploader.destroy(id)));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
};
