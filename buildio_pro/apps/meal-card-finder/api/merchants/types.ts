export const cities = {
  chennai: "Chennai",
  hyderabad: "Hyderabad",
  bengaluru: "Bengaluru",
  pune: "Pune",
} as const;

export type City = keyof typeof cities;
export const cityIds = Object.keys(cities) as City[];

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
