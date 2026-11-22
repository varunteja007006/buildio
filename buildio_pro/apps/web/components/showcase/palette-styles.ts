import { readFileSync } from "node:fs";
import { join } from "node:path";

export const showcasePalettes = [
  ["default", "Default"],
  ["amethyst-haze", "Amethyst Haze"],
  ["caffeine", "Caffeine"],
  ["citrus", "Citrus"],
  ["dark-matter", "Dark Matter"],
  ["matrix", "Matrix"],
  ["nature", "Nature"],
  ["neo-brutalism", "Neo Brutalism"],
  ["northern-lights", "Northern Lights"],
  ["ocean-breeze", "Ocean Breeze"],
  ["portfolio-theme", "Portfolio"],
  ["shopify-red", "Shopify Red"],
  ["soft-green", "Soft Green"],
  ["soft-pop", "Soft Pop"],
  ["space_8bit", "Space 8-bit"],
  ["violet-eye", "Violet Eye"],
] as const;

export function getPaletteStyles() {
  return showcasePalettes
    .slice(1)
    .map(([name]) => {
      const source = readFileSync(
        join(process.cwd(), "../../packages/theme", `${name}.css`),
        "utf8",
      ).replace(/\/\*[\s\S]*?\*\//g, "");
      // Use the preset token blocks with the showcase's shared Tailwind utilities.
      const lightSelector = name === "space_8bit" ? "\\.space_8bit" : ":root";
      const darkSelector =
        name === "space_8bit" ? "\\.space_8bit\\.dark" : "\\.dark";
      const tokens = (selector: string) => {
        const block = source.match(
          new RegExp(`^${selector}\\s*\\{([^}]*)\\}`, "m"),
        )?.[1];
        if (!block)
          throw new Error(`Missing ${selector} palette tokens in ${name}.css`);
        return block;
      };
      const root = `html[data-showcase-palette="${name}"]`;
      return `${root} {${tokens(lightSelector)}}\n${root}.dark {${tokens(darkSelector)}}`;
    })
    .join("\n");
}
