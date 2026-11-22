/** Grade/percent text: two decimals, but a zero in the 2nd place is dropped (90.40 → 90.4, 100.00 → 100.0, 99.45 stays). */
export function fmtGrade(n: number): string {
  const s = n.toFixed(2);
  return s.endsWith("0") ? s.slice(0, -1) : s;
}
