export interface GeoapifyResult {
    place_id: string;

    formatted: string;

    address_line1?: string;
    address_line2?: string;

    result_type: string;
    housenumber?: string;
    suburb?: string;
    municipality?: string;
    state_code?: string;

    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;

    lat: number;
    lon: number;
}

export interface GeoapifyAutocompleteResponse {
    results: GeoapifyResult[];
}

export interface GeoapifyReverseResponse {
    results: GeoapifyResult[];
}