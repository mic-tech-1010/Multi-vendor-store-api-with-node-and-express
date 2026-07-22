import type { GeoapifyResult } from "./providers/geoapify.types";
import type { AddressDetails, AddressSuggestion } from "./types";

export function mapSuggestion(result: GeoapifyResult): AddressSuggestion {
  return {
    id: result.place_id,
    name: result.address_line1 ?? result.formatted,
    formattedAddress: result.formatted,
    coordinates: {
      latitude: result.lat,
      longitude: result.lon,
    },
    street: result.street,
    city: result.city,
    state: result.state,
    postalCode: result.postcode,
    country: result.country,
    result_type: result.result_type,
    housenumber: result.housenumber,
    suburb: result.suburb,
    municipality: result.municipality,
    state_code: result.state_code,
  };
}

export function mapDetails(
  result: GeoapifyResult
): AddressDetails {

  return {
    id: result.place_id,

    formattedAddress: result.formatted,

    coordinates: {
      latitude: result.lat,
      longitude: result.lon
    },

    street: result.street,
    city: result.city,
    state: result.state,
    postalCode: result.postcode,
    country: result.country,
    result_type: result.result_type,
    housenumber: result.housenumber,
    suburb: result.suburb,
    municipality: result.municipality,
    state_code: result.state_code,
  };
}