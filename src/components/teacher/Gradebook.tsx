import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Plus, Scale } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_CHIP, type Assignment, type Student } from "@/lib/sis-data";
import { defaultWeights, letterFor, weightedAverage } from "@/lib/grading";
import { isScoreInput, scoreKey, scoreOf } from "@/lib/gradebook";
import { useSchool } from "@/lib/school-store";

export function Gradebook({ courseId, list, roster }: { courseId: string; list: Assignment[]; roster: Student[] }) {
  const { scores, weights, update } = useSchool();
  const w = weights[courseId] ?? defaultWeights(list.map((a) => a.category));
  const set = (aid: string, sid: string, v: string) => update((s) => ({ ...s, scores: { ...s.scores, [scoreKey(aid, sid)]: v } }));
  const avgFor = (sid: string) => weightedAverage(list.map((a) => ({ category: a.category, points: a.points, score: scoreOf(scores, a, sid) })), w);
  const colAvg = (a: Assignment) => { const v = roster.map((s) => scoreOf(scores, a, s.id)).filter((x): x is number => x !== undefined); return v.length ? (v.reduce((x, y) => x + y, 0) / v.length / a.points) * 100 : null; };
  const avgs = roster.map((s) => avgFor(s.id)).filter((x): x is number => x !== null);
  const classAvg = avgs.length ? avgs.reduce((x, y) => x + y, 0) / avgs.length : null;
  const nums = (a: Assignment) => roster.map((s) => scoreOf(scores, a, s.id)).filter((x): x is number => x !== undefined);
  const median = (v: number[]) => { if (!v.length) return null; const t = [...v].sort((x, y) => x - y); const m = Math.floor(t.length / 2); return t.length % 2 ? t[m]! : (t[m - 1]! + t[m]!) / 2; };
  const sd = (v: number[]) => { if (v.length < 2) return null; const m = v.reduce((x, y) => x + y, 0) / v.length; return Math.sqrt(v.reduce((x, y) => x + (y - m) ** 2, 0) / v.length); };
  const avgList = roster.map((s) => avgFor(s.id)).filter((x): x is number => x !== null);
  const cell = "h-10 rounded-sm bg-vc-panel text-center text-[13px]";
  const blue = "h-10 rounded-sm bg-vc-sky text-center text-[13px]";
  const stats: [string, (v: number[]) => number | null][] = [["Class Average", (v) => (v.length ? v.reduce((x, y) => x + y, 0) / v.length : null)], ["Class Median", median], ["Standard Dev", sd]];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Link to="/teacher/class/$classId" params={{ classId: courseId }} search={{ tab: "assignments", aid: "new" }} className="flex h-8 items-center gap-1.5 rounded-sm bg-vc-success px-3 text-[13px] text-primary-foreground"><Plus className="size-4" />Add Assignment</Link>
        <Link to="/teacher/class/$classId" params={{ classId: courseId }} search={{ tab: "weights" }} className="flex h-8 items-center gap-1.5 rounded-sm bg-vc-link px-3 text-[13px] text-primary-foreground"><Scale className="size-4" />Weighting</Link>
        <span className="ml-auto text-[12px] text-muted-foreground">Date Order · Semester 1 · {list.length} assignments</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <table className="border-separate border-spacing-1">
          <thead><tr>
            <th className="sticky left-0 z-10 min-w-[140px] bg-background" />
            <th className="min-w-[84px] rounded-sm bg-vc-sky px-1 align-bottom text-[12px] font-semibold">Calculated Grade</th>
            {list.map((a) => (
              <th key={a.id} className="min-w-[110px] max-w-[110px] rounded-sm bg-vc-panel p-1.5 text-left align-top font-normal">
                <span className={`px-1 text-[9px] font-semibold text-primary-foreground ${CATEGORY_CHIP[a.category]}`}>{a.category}</span>
                <div className="mt-1 h-[32px] overflow-hidden text-[11px] font-semibold uppercase leading-tight" title={a.title}>{a.title}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{format(a.due, "MMM dd")} · /{a.points}</div>
              </th>))}
          </tr></thead>
          <tbody>
            {roster.map((s) => { const av = avgFor(s.id); return (
              <tr key={s.id}>
                <td className="sticky left-0 z-10 bg-background pr-2 text-[13px] leading-tight"><b className="font-semibold">{s.first}</b><br />{s.last}</td>
                <td className={blue}>{av !== null ? av.toFixed(2) : "—"}</td>
                {list.map((a) => { const k = scoreKey(a.id, s.id); const v = k in scores ? scores[k]! : String(scoreOf(scores, a, s.id) ?? ""); const low = v !== "" && Number(v) / a.points < 0.7; return (
                  <td key={a.id} className="p-0">
                    <input aria-label={`${s.first} ${s.last} – ${a.title}`} value={v} inputMode="decimal"
                      onChange={(e) => { if (isScoreInput(e.target.value)) set(a.id, s.id, e.target.value); else toast.error("Scores must be numbers"); }}
                      className={`${cell} w-full outline-none focus:bg-vc-select ${low ? "text-destructive" : ""} ${v === "" && a.due < new Date() ? "bg-vc-attn" : ""}`} />
                  </td>); })}
              </tr>); })}
            <tr><td colSpan={list.length + 2}><div className="h-1.5 bg-vc-line" /></td></tr>
            {stats.map(([label, fn]) => { const g = fn(avgList); return (
              <tr key={label}>
                <td className="sticky left-0 z-10 bg-background pr-2 text-right text-[13px]">{label}</td>
                <td className={blue}>{g !== null ? g.toFixed(2) : "—"}</td>
                {list.map((a) => { const r = fn(nums(a)); return <td key={a.id} className={cell}>{r !== null ? r.toFixed(2) : ""}</td>; })}
              </tr>); })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
