import path from "node:path";

export function exposeUserExtractionModelChoice(): boolean {
  return (
    process.env.EXPOSE_USER_EXTRACTION_MODEL_CHOICE?.trim().toLowerCase() ===
    "true"
  );
}

export function getDefaultExtractionModel(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  const envName =
    extension === ".pdf"
      ? "PDF_EXTRACTION_MODEL"
      : [".gif", ".jpeg", ".jpg", ".png", ".webp"].includes(extension)
        ? "IMAGE_EXTRACTION_MODEL"
        : "DOCUMENT_EXTRACTION_MODEL";
  const model = process.env[envName]?.trim();
  if (!model) throw new Error(`${envName} is required`);
  return model;
}
