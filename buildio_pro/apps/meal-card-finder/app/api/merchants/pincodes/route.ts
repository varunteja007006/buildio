import {
  directoryCityParam,
  getPinCodes,
  isDirectoryCity,
} from "@/api/merchants/directory";

export async function GET(request: Request) {
  const city = directoryCityParam.safeParse(
    new URL(request.url).searchParams.get("city"),
  );
  if (!city.success) {
    return Response.json({ error: "Choose a valid city." }, { status: 400 });
  }

  try {
    if (!(await isDirectoryCity(city.data))) {
      return Response.json({ error: "Choose a valid city." }, { status: 400 });
    }
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
