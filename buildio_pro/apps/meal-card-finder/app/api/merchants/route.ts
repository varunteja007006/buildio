import { z } from "zod";

import { lookupMerchants } from "@/api/merchants/directory";
import {
  cityIds,
  maxSearchLength,
  pinCodePattern,
} from "@/api/merchants/types";

const searchParams = z.object({
  city: z.enum(cityIds),
  name: z.string().trim().max(maxSearchLength),
  pincodes: z
    .string()
    .max(4000)
    .transform((value) => (value ? value.split(",") : []))
    .pipe(z.array(z.string().regex(pinCodePattern))),
  page: z
    .string()
    .regex(/^[1-9]\d{0,3}$/)
    .transform(Number),
});

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const search = searchParams.safeParse({
    city: params.get("city"),
    name: params.get("name") ?? "",
    pincodes: params.get("pincodes") ?? "",
    page: params.get("page") ?? "1",
  });

  if (!search.success) {
    return Response.json(
      { error: "Invalid merchant search." },
      { status: 400 },
    );
  }

  try {
    return Response.json(await lookupMerchants(search.data), {
      headers: {
        "Cache-Control": "no-store",
        "Netlify-CDN-Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "The Pluxee directory is temporarily unavailable." },
      { status: 502 },
    );
  }
}
