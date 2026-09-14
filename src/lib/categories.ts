import type { Category, CategoryId } from "@/lib/types";

/**
 * Categories derived from the NRTPRO price list. Kept as a static table for now;
 * move to the `categories` table when the Golang API is wired up.
 */
export const CATEGORIES: Category[] = [
  {
    id: "mesin-potong",
    name: "Mesin Potong",
    description: "Circular saw, cut off, miter saw, table saw, band saw, jig saw, concrete cutter",
  },
  {
    id: "cordless",
    name: "Cordless (Baterai)",
    description: "Bor, gerinda, impact, chain saw, dan alat baterai lainnya",
  },
  {
    id: "bor",
    name: "Bor",
    description: "Bor listrik, bor beton, bor duduk, bor magnet, bor mixer",
  },
  {
    id: "gerinda-poles",
    name: "Gerinda & Poles",
    description: "Disc grinda, grinda duduk, grinda mini, disc poliser",
  },
  {
    id: "hammer-demolition",
    name: "Hammer & Demolition",
    description: "Hammer drill dan hammer demolition 2.8J sampai 75J",
  },
  {
    id: "staples-nail-gun",
    name: "Staples & Nail Gun",
    description: "Staples angin dan staples listrik dengan safety lock",
  },
  {
    id: "spray-gun",
    name: "Spray Gun",
    description: "Spray gun angin dan elektrik, HVLP, hopper",
  },
  {
    id: "kerja-kayu",
    name: "Kerja Kayu",
    description: "Planer, router, trimmer, multi tools, mesin bobok kayu",
  },
  {
    id: "sander-amplas",
    name: "Sander / Amplas",
    description: "Sander orbital, sander belt, disc sander",
  },
  {
    id: "blower-heat-gun",
    name: "Blower & Heat Gun",
    description: "Blower keong, hand blower, heat gun",
  },
  {
    id: "peralatan-lain",
    name: "Peralatan Lain",
    description: "Impulse sealer, jet cleaner, dan perkakas lainnya",
  },
];

const BY_ID = new Map<string, Category>(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: CategoryId): Category | undefined {
  return BY_ID.get(id);
}

export function categoryName(id: CategoryId): string {
  return BY_ID.get(id)?.name ?? id;
}
