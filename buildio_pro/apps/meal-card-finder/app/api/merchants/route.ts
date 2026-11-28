import { z } from "zod";

import {
  directoryCityParam,
  isDirectoryCity,
  lookupMerchants,
} from "@/api/merchants/directory";
import { maxSearchLength, pinCodePattern } from "@/api/merchants/types";

const searchParams = z.object({
  city: directoryCityParam,
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
    if (!(await isDirectoryCity(search.data.city))) {
      return Response.json({ error: "Choose a valid city." }, { status: 400 });
    }
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
