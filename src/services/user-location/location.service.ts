import type { GeocodingProvider } from "./providers/geocoding-provider";
import type { Coordinates } from "./types";

export class LocationService {
  constructor(
    private readonly provider: GeocodingProvider
  ) {}

  async autocompleteAddress(query: string) {
    return this.provider.autocompleteAddress(query);
}

  async reverseGeocode(
    coordinates: Coordinates
  ) {
    return this.provider.reverseGeocode(coordinates);
  }

  async geocode(address: string) {
    return this.provider.geocode(address);
  }

}