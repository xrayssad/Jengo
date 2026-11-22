import type { SortKey } from "./browse";

export type HomeMode = "browse" | "results";

/** Location is a scope inside browse. Only a query, category, or filter-sheet choice starts results. */
export function homeMode(input: {
  query: string;
  category: string;
  verified: boolean;
  fits: number;
  beds: number;
  ranged: boolean;
  sort: SortKey | string;
}): HomeMode {
  const sheetSort = input.sort !== "new" && input.sort !== "featured" && input.sort !== "views";
  if (input.query || input.category || input.verified || input.fits > 0 || input.beds > 0 || input.ranged || sheetSort) {
    return "results";
  }
  return "browse";
}
