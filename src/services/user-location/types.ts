export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BaseAddress {
  formattedAddress: string;

  coordinates: Coordinates;

  street: string | undefined;

  city: string | undefined;

  state: string | undefined;

  postalCode: string | undefined;

  country: string | undefined;

  result_type: string | undefined;

  housenumber: string | undefined;

  suburb: string | undefined;

  municipality: string | undefined;

  state_code: string | undefined;

}

export interface AddressSuggestion extends BaseAddress {
  id: string;
  name: string;
}

export interface AddressDetails extends BaseAddress {
  id: string;
}