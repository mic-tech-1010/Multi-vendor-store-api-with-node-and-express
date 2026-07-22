import { GeoapifyClient } from "../http/geoapify.client";
import { mapDetails, mapSuggestion } from "../location.mapper";
import type { GeocodingProvider } from "./geocoding-provider";
import type { GeoapifyAutocompleteResponse, GeoapifyReverseResponse } from "./geoapify.types";
import type { AddressDetails, Coordinates } from "../types";

export class GeoapifyProvider
    implements GeocodingProvider {

    private client = new GeoapifyClient();

    async autocompleteAddress(query: string) {

        const params = new URLSearchParams({
            text: query,
            filter: "countrycode:ng",
            bias: "countrycode:ng",
            format: "json",
            limit: "5",
        });

        const response =
            await this.client.get<GeoapifyAutocompleteResponse>(
                "/v1/geocode/autocomplete",
                params
            );

        return response.results.map(mapSuggestion);
    }

    async geocode() {
        throw new Error("Not implemented");
    }

    async reverseGeocode(
        coordinates: Coordinates
    ): Promise<AddressDetails> {

        const params = new URLSearchParams({
            lat: coordinates.latitude.toString(),
            lon: coordinates.longitude.toString()
        });

        const response =
            await this.client.get<GeoapifyReverseResponse>(
                "/v1/geocode/reverse",
                params
            );

        if (!response.results.length) {
            throw new Error("Address not found");
        }

        return mapDetails(response.results[0]);
    }

}