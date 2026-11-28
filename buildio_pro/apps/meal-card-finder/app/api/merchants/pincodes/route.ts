import { z } from "zod";

import { getPinCodes } from "@/api/merchants/directory";
import { cityIds } from "@/api/merchants/types";

export async function GET(request: Request) {
  const city = z
    .enum(cityIds)
    .safeParse(new URL(request.url).searchParams.get("city"));
  if (!city.success) {
    return Response.json({ error: "Choose a valid city." }, { status: 400 });
  }

  try {
    return Response.json(await getPinCodes(city.data), {
      headers: {
        "Cache-Control": "no-store",
        "Netlify-CDN-Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "PIN codes are temporarily unavailable." },
      { status: 502 },
    );
  }
}
