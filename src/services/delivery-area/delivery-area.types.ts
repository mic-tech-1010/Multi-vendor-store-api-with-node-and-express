import type { DeliveryAreaModel } from "../../generated/prisma/models";

export interface DeliveryAreaMatch {
  deliverable: boolean;

  area: DeliveryAreaModel | null;

  deliveryFee: number | null;

  estimatedDelivery: {
    minDays?: number;
    maxDays?: number;
    minHours?: number;
    maxHours?: number;
  } | null;

  reason?: string;
}