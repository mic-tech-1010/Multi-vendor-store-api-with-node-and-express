import { Router } from "express";
import { locationController } from "#controllers/public/location.js";
import { validateQuery } from "#lib/validator.js";
import { searchLocationSchema } from "#schemas/validation/userLocationSchema.js";

const router = Router();

router.get(
  "/search",
  validateQuery(searchLocationSchema),
  locationController.search
);

router.get(
    "/reverse",
    validateQuery(searchLocationSchema),
    locationController.reverse
);

export default router;