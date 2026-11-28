export const cities = {
  chennai: "Chennai",
  hyderabad: "Hyderabad",
  bengaluru: "Bengaluru",
  pune: "Pune",
} as const;

type QuickCity = keyof typeof cities;
export type City = string;
export const cityIds = Object.keys(cities) as QuickCity[];

export function isQuickCity(city: string): city is QuickCity {
  return Object.hasOwn(cities, city);
}

export function cityLabel(city: City) {
  return isQuickCity(city) ? cities[city] : city;
}

export const maxCityLength = 80;
export const maxSearchLength = 100;
export const pinCodePattern = /^[1-9]\d{5}$/;

export type MerchantSearch = {
  city: City;
  name: string;
  page: number;
  pincodes: string[];
};

export type Merchant = {
  id: string;
  name: string;
  address: string;
  directionsUrl: string | null;
};

export type MerchantResults = {
  merchants: Merchant[];
  total: number;
  page: number;
  pageCount: number;
};
