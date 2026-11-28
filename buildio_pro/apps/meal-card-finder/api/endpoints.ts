import type { City } from "@/api/merchants/types";

const directoryOrigin =
  "https://sdx-merchantdirectory-india0zetaapps.mum1.zetaapps.in";

export const mealPartnerCode = "99501";

export const endpoints = {
  finder: {
    merchants: "/api/merchants",
    pincodes: "/api/merchants/pincodes",
    cities: "/api/merchants/cities",
  },
  directory: {
    apiBase: "https://merchantdirectory.gw.zetapay.in",
    merchants: "/all_merchants",
    cities: "/all_cities",
    link: (city: City, name: string) =>
      `${directoryOrigin}/#/${encodeURIComponent(city)}/${mealPartnerCode}/1${name ? `/${encodeURIComponent(name)}` : ""}`,
  },
} as const;
