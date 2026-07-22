import type {
  AddressDetails,
  AddressSuggestion,
  Coordinates,
} from "../types";

export interface GeocodingProvider {
  autocompleteAddress(
    query: string
  ): Promise<AddressSuggestion[]>;

  geocode(
    address: string
  ): Promise<AddressDetails>;

  reverseGeocode(
    coordinates: Coordinates
  ): Promise<AddressDetails>;
}