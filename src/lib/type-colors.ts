/** Registry of the administrator's assignment-type colors, filled by the school store and read by categoryColor(). */
let colors: Record<string, string> = {};
export function setTypeColors(types: { description: string; color: string }[]) {
  colors = Object.fromEntries(types.map((t) => [t.description.trim().toUpperCase(), t.color]));
}
export const typeColor = (cat: string): string | undefined => colors[cat.trim().toUpperCase()];
