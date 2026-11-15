import { ALL_ASSIGNMENTS, rosterScore, type Assignment } from "./sis-data";

export const scoreKey = (aid: string, sid: string) => `${aid}|${sid}`;

/** Score shown in the teacher's gradebook: a teacher entry wins, otherwise the built-in demo score. */
export function scoreOf(scores: Record<string, string>, a: Assignment, sid: string): number | undefined {
  const k = scoreKey(a.id, sid);
  if (k in scores) { const v = scores[k]; return v === "" || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v); }
  if (sid === "me") return a.score;
  const base = ALL_ASSIGNMENTS.find((x) => x.id === a.id);
  return base ? rosterScore(sid, base) : undefined;
}

/** Accept blank or a number with up to 2 decimals while typing. */
export const isScoreInput = (v: string) => /^\d{0,4}(\.\d{0,2})?$/.test(v);
