import axios from "axios";
import { z } from "zod";

import { endpoints, mealPartnerCode } from "@/api/endpoints";
import { toMerchant } from "@/api/merchants/helpers";
import {
  cities,
  pinCodePattern,
  type City,
  type MerchantSearch,
} from "@/api/merchants/types";

const directoryClient = axios.create({
  baseURL: endpoints.directory.apiBase,
  timeout: 8000,
  maxContentLength: 4 * 1024 * 1024,
  paramsSerializer: { encode: encodeURIComponent },
});

export const directoryMerchant = z.object({
  secondaryID: z.string(),
  Name: z.string().nullish(),
  name: z.string().nullish(),
  fullAddress: z.string().nullish(),
  locality: z.string().nullish(),
  postalCode: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
});

const directoryPage = z.object({
  totalCount: z.number().int().nonnegative(),
  pageCount: z.number().int().nonnegative(),
  listOfMerchants: z.array(directoryMerchant),
});

type DirectoryMerchant = z.infer<typeof directoryMerchant>;

const pageSize = 10;
const cityBatchSize = 5000;
const cityCache = new Map<
  City,
  {
    expires: number;
    merchants: Promise<DirectoryMerchant[]>;
  }
>();

async function readDirectory(
  city: City,
  name: string,
  page: number,
  size: number,
) {
  const { data } = await directoryClient.get<unknown>(
    endpoints.directory.merchants,
    {
      params: {
        page_no: page - 1,
        page_size: size,
        amc_codes: mealPartnerCode,
        city,
        name,
        merchantAccountType: "SODEXO",
        areas: "",
      },
    },
  );
  return directoryPage.parse(data);
}

async function loadCity(city: City) {
  const first = await readDirectory(city, "", 1, cityBatchSize);
  if (first.pageCount > 6)
    throw new Error("City directory exceeds the supported size.");

  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.pageCount - 1) }, (_, index) =>
      readDirectory(city, "", index + 2, cityBatchSize),
    ),
  );
  const merchants = [first, ...rest].flatMap(
    (result) => result.listOfMerchants,
  );
  if (merchants.length !== first.totalCount)
    throw new Error("Incomplete city directory.");
  return merchants;
}

function cityMerchants(city: City) {
  const cached = cityCache.get(city);
  if (cached && cached.expires > Date.now()) return cached.merchants;

  const merchants = loadCity(city).catch((error) => {
    if (cityCache.get(city)?.merchants === merchants) cityCache.delete(city);
    throw error;
  });
  cityCache.set(city, { expires: Date.now() + 5 * 60_000, merchants });
  return merchants;
}

export async function getPinCodes(city: City) {
  const codes = (await cityMerchants(city))
    .map((merchant) => merchant.postalCode?.trim() ?? "")
    .filter((code) => pinCodePattern.test(code));

  return Array.from(new Set(codes)).sort();
}

export async function lookupMerchants({
  city,
  name,
  page,
  pincodes,
}: MerchantSearch) {
  if (pincodes.length > 0) {
    const selected = new Set(pincodes);
    const outlet = name.toLowerCase();
    const matches = (await cityMerchants(city)).filter(
      (merchant) =>
        selected.has(merchant.postalCode?.trim() ?? "") &&
        (merchant.Name ?? merchant.name ?? "").toLowerCase().includes(outlet),
    );
    const start = (page - 1) * pageSize;

    return {
      merchants: matches
        .slice(start, start + pageSize)
        .map((merchant) => toMerchant(merchant, cities[city])),
      page,
      pageCount: Math.ceil(matches.length / pageSize),
      total: matches.length,
    };
  }

  const result = await readDirectory(city, name, page, pageSize);

  return {
    merchants: result.listOfMerchants.map((merchant) =>
      toMerchant(merchant, cities[city]),
    ),
    page,
    pageCount: result.pageCount,
    total: result.totalCount,
  };
}
