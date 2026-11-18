import { categoryStats, type Scored, type Weight } from './grading';

type NamedTeacher = { id: string; prefix?: string; first: string; last: string };
/** Compact faculty labels never use first names; sort by surname before joining. */
export function teacherNames(ids: string[], people: NamedTeacher[]) {
  return [...new Set(ids)].map((id) => people.find((p) => p.id === id))
    .filter((p): p is NamedTeacher => p !== undefined)
    .sort((a, b) => a.last.localeCompare(b.last) || a.first.localeCompare(b.first))
    .map((p) => [p.prefix?.trim(), p.last].filter(Boolean).join(' ')).join(', ');
}

/** The displayed fraction uses the same exclusions, drops and reweighting as grade math. */
export function gradeFraction(items: Scored[], weights: Weight[]) {
  const cats = [...new Set(items.map((a) => a.category))].sort();
  if (!weights.length) {
    const stats = cats.map((cat) => categoryStats(items.filter((a) => a.category === cat))).filter((s) => s.pct !== null);
    return stats.length ? { numerator: stats.map((s) => s.earned.toFixed(2)).join(' + '), denominator: stats.map((s) => s.possible.toFixed(2)).join(' + ') } : null;
  }
  const effective = [...weights, ...cats.filter((cat) => !weights.some((w) => w.cat === cat)).map((cat) => ({ cat, weight: 1, drop: false }))];
  const stats = effective.map((w) => ({ w, s: categoryStats(items.filter((a) => a.category === w.cat), w.drop) })).filter(({ w, s }) => w.weight > 0 && s.pct !== null);
  return stats.length ? { numerator: stats.map(({ w, s }) => `(${s.pct?.toFixed(2)} × ${w.weight})`).join(' + '), denominator: stats.map(({ w }) => String(w.weight)).join(' + ') } : null;
}

export function scheduleTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? 'pm' : 'am'}`;
}