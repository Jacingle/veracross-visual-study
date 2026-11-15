import { format } from "date-fns";
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
  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-[12px] text-muted-foreground">
        <span>{roster.length} students · {list.length} assignments</span>
        <span>Class average: <b className="text-foreground">{classAvg !== null ? `${classAvg.toFixed(2)}%` : "—"}</b></span>
        <span className="ml-auto">Click a cell to enter a score. Changes save automatically.</span>
      </div>
      <div className="overflow-x-auto border border-vc-line">
        <table className="border-collapse text-[12px]">
          <thead>
            <tr className="bg-vc-panel">
              <th className="sticky left-0 z-10 min-w-[190px] border-b border-r border-vc-line bg-vc-panel px-2 text-left font-semibold">Student</th>
              <th className="sticky left-[190px] z-10 min-w-[78px] border-b border-r border-vc-line bg-vc-panel px-1 font-semibold">Average</th>
              {list.map((a) => (
                <th key={a.id} className="min-w-[66px] max-w-[66px] border-b border-r border-vc-line p-0 align-top font-normal">
                  <div className={`h-1.5 ${CATEGORY_CHIP[a.category]}`} />
                  <div className="px-1 pt-1 text-[10px] text-muted-foreground">{format(a.due, "M/d")}</div>
                  <div className="h-[30px] overflow-hidden px-1 text-[11px] leading-tight" title={a.title}>{a.title}</div>
                  <div className="px-1 pb-1 text-[10px] text-muted-foreground">/{a.points}</div>
                </th>))}
            </tr>
          </thead>
          <tbody>
            {roster.map((s, i) => { const av = avgFor(s.id); return (
              <tr key={s.id} className={i % 2 ? "bg-vc-panel/50" : ""}>
                <td className="sticky left-0 z-10 border-b border-r border-vc-line bg-background px-2 py-1">{s.last}, {s.first}</td>
                <td className="sticky left-[190px] z-10 border-b border-r border-vc-line bg-background px-1 text-center font-semibold">{av !== null ? <>{letterFor(av)} <span className="font-normal text-muted-foreground">{av.toFixed(1)}</span></> : "—"}</td>
                {list.map((a) => { const k = scoreKey(a.id, s.id); const v = k in scores ? scores[k]! : String(scoreOf(scores, a, s.id) ?? ""); const low = v !== "" && Number(v) / a.points < 0.7; return (
                  <td key={a.id} className="border-b border-r border-vc-line p-0">
                    <input aria-label={`${s.first} ${s.last} – ${a.title}`} value={v} inputMode="decimal"
                      onChange={(e) => { if (isScoreInput(e.target.value)) set(a.id, s.id, e.target.value); else toast.error("Scores must be numbers"); }}
                      className={`h-7 w-full bg-transparent text-center outline-none focus:bg-vc-select ${low ? "text-destructive" : ""}`} />
                  </td>); })}
              </tr>); })}
            <tr className="bg-vc-panel font-semibold">
              <td className="sticky left-0 z-10 border-r border-vc-line bg-vc-panel px-2 py-1">Class Average</td>
              <td className="sticky left-[190px] z-10 border-r border-vc-line bg-vc-panel text-center">{classAvg !== null ? classAvg.toFixed(1) : "—"}</td>
              {list.map((a) => { const c = colAvg(a); return <td key={a.id} className="border-r border-vc-line text-center">{c !== null ? `${c.toFixed(0)}%` : ""}</td>; })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
