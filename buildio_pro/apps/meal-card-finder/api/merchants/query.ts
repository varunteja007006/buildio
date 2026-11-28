import { queryOptions } from "@tanstack/react-query";

import {
  fetchDirectoryCities,
  fetchMerchants,
  fetchPinCodes,
} from "@/api/merchants/api";
import type { City, MerchantSearch } from "@/api/merchants/types";

export function merchantQuery(search: MerchantSearch) {
  return queryOptions({
    queryKey: ["merchants", search],
    queryFn: ({ signal }) => fetchMerchants(search, signal),
    staleTime: 60_000,
    retry: false,
  });
}

export function pinCodesQuery(city: City) {
  return queryOptions({
    queryKey: ["pin-codes", city],
    queryFn: ({ signal }) => fetchPinCodes(city, signal),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function directoryCitiesQuery() {
  return queryOptions({
    queryKey: ["directory-cities"],
    queryFn: ({ signal }) => fetchDirectoryCities(signal),
    staleTime: 60 * 60_000,
    gcTime: 60 * 60_000,
    retry: false,
  });
}
