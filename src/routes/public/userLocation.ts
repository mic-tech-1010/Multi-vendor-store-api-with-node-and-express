import { Router } from "express";
import { locationController } from "#controllers/public/location.js";
import { validateBody, validateQuery } from "#lib/validator.js";
import { searchLocationSchema } from "#schemas/validation/userLocationSchema.js";
import { checkDeliverySchema } from "#schemas/validation/checkDeliverySchema.js";

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

router.post(
    "/check-delivery",
    validateBody(checkDeliverySchema),
    locationController.checkDelivery
);

export default router;