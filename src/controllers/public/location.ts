import type { Request, Response } from "express";
import { locationService } from "#services/user-location/index.js";

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
        {latitude: lat, longitude: lng}
      );

    return res.json({
      success: true,
      data: result
    });
  }

}


export const locationController = new LocationController();