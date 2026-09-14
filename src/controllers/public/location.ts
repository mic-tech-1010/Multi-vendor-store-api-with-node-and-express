import type { Request, Response } from "express";
import { locationService } from "#services/user-location/index.js";
import { DeliveryAreaService } from "#services/delivery-area/delivery-area.service.js";

const deliveryAreaService = new DeliveryAreaService();

export class LocationController {
  async search(req: Request, res: Response) {
    const places =
      await locationService.autocompleteAddress(
        req.query.q as string
      );

    return res.json({
      success: true,
      data: places,
    });
  }

  async reverse(
    req: Request,
    res: Response
  ) {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    const result =
      await locationService.reverseGeocode(
        { latitude: lat, longitude: lng }
      );

    return res.json({
      success: true,
      data: result
    });
  }

  async checkDelivery(
    req: Request,
    res: Response
  ) {
    const address = req.body;

    const deliveryArea =
      await deliveryAreaService.matchAddress(address);

    if (!deliveryArea) {
      return res.status(200).json({
        success: true,
        deliverable: false,
        message: "We don't currently deliver to this location.",
      });
    }

    return res.json({
      success: true,
      deliverable: true,
      deliveryArea: {
        id: deliveryArea.id,
        name: deliveryArea.name,
        baseFee: deliveryArea.baseFee,
        minDeliveryDays: deliveryArea.minDeliveryDays,
        maxDeliveryDays: deliveryArea.maxDeliveryDays,
        minDeliveryHours: deliveryArea.minDeliveryHours,
        maxDeliveryHours: deliveryArea.maxDeliveryHours,
        freeDeliveryFrom: deliveryArea.freeDeliveryFrom,
      },
    });
  }

}

export const locationController = new LocationController();