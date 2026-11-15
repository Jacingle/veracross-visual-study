import type { CSSProperties } from "react";
import type { Weight } from "./grading";
import { useSchool } from "./school-store";

export const CATEGORY_PALETTE = ["#9c5b5b", "#c97872", "#e9b8bd", "#6aab45", "#ee9b35", "#14284b", "#3a8fd1", "#7a5ea8"];

/** A category's color: the teacher's chosen weight color, else a stable palette pick. */
export function categoryColor(weights: Weight[] | undefined, cat: string, all: string[] = []): string {
  const w = weights?.find((x) => x.cat === cat);
  if (w?.color) return w.color;
  const i = Math.max(0, (weights?.findIndex((x) => x.cat === cat) ?? -1) >= 0 ? weights!.findIndex((x) => x.cat === cat) : all.indexOf(cat));
  let h = 0; for (const ch of cat) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CATEGORY_PALETTE[(i >= 0 && weights?.length ? i : h) % CATEGORY_PALETTE.length] ?? CATEGORY_PALETTE[0]!;
}
export function useCategoryStyle(courseId: string) {
  const { weights } = useSchool();
  return (cat: string): CSSProperties => ({ background: categoryColor(weights[courseId], cat) });
}
