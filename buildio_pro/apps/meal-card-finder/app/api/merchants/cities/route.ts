import { getAdditionalCities } from "@/api/merchants/directory";

export async function GET() {
  try {
    return Response.json(await getAdditionalCities());
  } catch {
    return Response.json(
      { error: "Other cities are temporarily unavailable." },
      { status: 502 },
    );
  }
}
