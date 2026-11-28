import { endpoints } from "@/api/endpoints";
import type {
  City,
  MerchantResults,
  MerchantSearch,
} from "@/api/merchants/types";
import { finderClient } from "@/lib/axios";

export async function fetchMerchants(
  { pincodes, ...params }: MerchantSearch,
  signal: AbortSignal,
) {
  const { data } = await finderClient.get<MerchantResults>(
    endpoints.finder.merchants,
    { params: { ...params, pincodes: pincodes.join(",") }, signal },
  );

  return data;
}

export async function fetchPinCodes(city: City, signal: AbortSignal) {
  const { data } = await finderClient.get<string[]>(endpoints.finder.pincodes, {
    params: { city },
    signal,
  });
  return data;
}

export async function fetchDirectoryCities(signal: AbortSignal) {
  const { data } = await finderClient.get<string[]>(endpoints.finder.cities, {
    signal,
  });
  return data;
}
