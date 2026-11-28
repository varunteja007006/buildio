import type { z } from "zod";

import type { directoryMerchant } from "@/api/merchants/directory";
import type { Merchant } from "@/api/merchants/types";

export function toMerchant(
  record: z.infer<typeof directoryMerchant>,
  city: string,
): Merchant {
  const name = record.Name?.trim() || record.name?.trim() || "Unnamed outlet";
  const parts = [
    record.fullAddress,
    record.locality,
    city,
    record.postalCode,
  ].flatMap((part) => (part?.trim() ? [part.trim()] : []));
  const address = [...new Set(parts)].join(", ");
  const { latitude, longitude } = record;
  const hasCoordinates =
    latitude != null &&
    longitude != null &&
    latitude !== 0 &&
    longitude !== 0 &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;
  const destination = hasCoordinates
    ? `${latitude},${longitude}`
    : record.fullAddress?.trim()
      ? `${name}, ${address}`
      : null;

  return {
    id: record.secondaryID,
    name,
    address,
    directionsUrl: destination
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
      : null,
  };
}
