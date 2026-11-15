// Pure grade math shared by the student grade detail and the teacher gradebook.
export type Weight = { cat: string; weight: number; drop: boolean };
export type Scored = { category: string; points: number; score?: number | undefined };

/** Equal weights across the categories a class uses; remainder goes to the first so the total is 100. */
export function defaultWeights(cats: string[]): Weight[] {
  const u = [...new Set(cats)];
  if (!u.length) return [];
  const base = Math.floor(100 / u.length);
  return u.map((cat, i) => ({ cat, weight: base + (i === 0 ? 100 - base * u.length : 0), drop: false }));
}

export function categoryStats(items: Scored[], drop = false) {
  const graded = items.filter((a) => a.score !== undefined && a.points > 0);
  let use = graded;
  if (drop && graded.length > 1) {
    const low = graded.reduce((m, a) => (((a.score ?? 0) / a.points) < ((m.score ?? 0) / m.points) ? a : m));
    use = graded.filter((a) => a !== low);
  }
  const earned = use.reduce((s, a) => s + (a.score ?? 0), 0);
  const possible = use.reduce((s, a) => s + a.points, 0);
  return { count: items.length, earned, possible, pct: possible ? (earned / possible) * 100 : null };
}

/** Weighted average: categories with no graded work are left out and the remaining weights re-scale. */
export function weightedAverage(items: Scored[], weights: Weight[]): number | null {
  if (!weights.length) return categoryStats(items).pct;
  let sum = 0, w = 0;
  for (const wt of weights) {
    const st = categoryStats(items.filter((a) => a.category === wt.cat), wt.drop);
    if (st.pct === null || wt.weight <= 0) continue;
    sum += st.pct * wt.weight; w += wt.weight;
  }
  for (const cat of new Set(items.map((a) => a.category))) {
    if (weights.some((wt) => wt.cat === cat)) continue;
    const st = categoryStats(items.filter((a) => a.category === cat));
    if (st.pct !== null) { sum += st.pct; w += 1; }
  }
  return w ? sum / w : null;
}

const SCALE: [number, string][] = [[97, "A+"], [93, "A"], [90, "A-"], [87, "B+"], [83, "B"], [80, "B-"], [77, "C+"], [73, "C"], [70, "C-"], [60, "D"]];
export const letterFor = (pct: number) => SCALE.find(([min]) => pct >= min)?.[1] ?? "F";

/** Category weights can only be saved when they add up to exactly 100%. */
export const weightsTotal = (w: Weight[]) => w.reduce((s, x) => s + (Number.isFinite(x.weight) ? x.weight : 0), 0);
export const weightsValid = (w: Weight[]) => w.length > 0 && w.every((x) => x.weight >= 0) && weightsTotal(w) === 100;
