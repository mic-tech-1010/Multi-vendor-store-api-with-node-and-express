import type { AddressDetails } from "#services/user-location/types.js";
import { DeliveryAreaRepository } from "./delivery-area.repository";
import { haversineDistanceKm } from "./delivery-area.utils";

export class DeliveryAreaService {
  constructor(
    private repository = new DeliveryAreaRepository()
  ) {}

  async matchAddress(address: AddressDetails) {
    const areas = await this.repository.findAllActive();

    // STEP 1
    const exactMatch = areas.find((area) =>
      area.state?.toLowerCase() === address.state?.toLowerCase() &&
      area.city?.toLowerCase() === address.city?.toLowerCase() &&
      area.suburb?.toLowerCase() === address.suburb?.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch;
    }

    // STEP 2
    return this.findByRadius(address, areas);
  }

  private findByRadius(
    address: AddressDetails,
    areas: Awaited<ReturnType<DeliveryAreaRepository["findAllActive"]>>
  ) {
    for (const area of areas) {
      if (
        !area.latitude ||
        !area.longitude ||
        !area.radiusKm
      ) {
        continue;
      }

      const distance = haversineDistanceKm(
        address.coordinates.latitude,
        address.coordinates.longitude,
        Number(area.latitude),
        Number(area.longitude)
      );

      if (distance <= Number(area.radiusKm)) {
        return area;
      }
    }

    return null;
  }
}