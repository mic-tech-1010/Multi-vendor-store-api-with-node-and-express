const API_KEY = process.env.GEOAPIFY_API_KEY!;
const BASE_URL =
  process.env.GEOAPIFY_BASE_URL!;

export class GeoapifyClient {
  async get<T>(
    endpoint: string,
    params: URLSearchParams
  ): Promise<T> {
    params.append("apiKey", API_KEY);

    const response = await fetch(
      `${BASE_URL}${endpoint}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(
        `Geoapify Error: ${response.status}`
      );
    }

    return response.json();
  }
}