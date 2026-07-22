import { LocationService } from "./location.service";
import { GeoapifyProvider } from "./providers/geoapify.provider";

const provider = new GeoapifyProvider();

export const locationService =
  new LocationService(provider);