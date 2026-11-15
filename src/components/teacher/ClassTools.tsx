import { useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Assignment, type Course, type Student } from "@/lib/sis-data";
import { categoryStats, defaultWeights, letterFor, weightedAverage, weightsTotal, weightsValid, type Weight } from "@/lib/grading";
import { scoreOf } from "@/lib/gradebook";
import { useSchool } from "@/lib/school-store";

const ATT = ["Present", "Tardy", "Absent - Excused", "Absent - Unexcused", "Dismissed", "Field Trip"];

export function Attendance({ c, roster, date }: { c: Course; roster: Student[]; date: string }) {
  const { attendance, attNotes, attDone, update } = useSchool();
  const nav = useNavigate();
  const key = (sid: string) => `${c.id}|${date}|${sid}`;
  const done = attDone.includes(`${c.id}|${date}`);
  const setDate = (d: string) => nav({ to: "/teacher/class/$classId", params: { classId: c.id }, search: { tab: "attendance", date: d } });
  const go = (n: number) => { const d = parseISO(date); d.setDate(d.getDate() + n); setDate(format(d, "yyyy-MM-dd")); };
  const counts = ATT.map((st) => [st, roster.filter((s) => (attendance[key(s.id)] ?? "Present") === st).length] as const).filter(([, n]) => n > 0);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-[22px]">Class Attendance <span className={`ml-1 px-1.5 py-0.5 align-middle text-[13px] ${done ? "bg-vc-tile text-vc-success" : "bg-vc-line"}`}>{done ? "Complete" : "Not Taken"}</span></h2>
        <button onClick={() => { update((x) => ({ ...x, attDone: done ? x.attDone : [...x.attDone, `${c.id}|${date}`] })); toast.success("Attendance marked complete"); }} className="h-8 rounded-sm bg-vc-link-strong px-4 text-[13px] text-primary-foreground">✓ Mark Complete</button>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[13px]">
        <div className="flex h-8 items-center border border-vc-line">
          <button aria-label="Previous day" className="px-2.5" onClick={() => go(-1)}>‹</button>
          <input type="date" className="h-full border-x border-vc-line px-2" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <button aria-label="Next day" className="px-2.5" onClick={() => go(1)}>›</button>
        </div>
        <span className="flex h-8 w-[200px] items-center border border-vc-line px-2 text-muted-foreground">{c.block}</span>
      </div>
      <div className="mb-3 mt-2 text-[13px]">Total: {roster.length} ({counts.map(([st, n]) => `${st}: ${n}`).join(", ")})</div>
      <table className="w-full text-[13px]">
        <thead><tr className="border-b-2 border-foreground/70 text-left text-[11px] uppercase text-muted-foreground"><th className="py-1.5">Student</th><th>Status</th><th>Class Attendance Notes</th></tr></thead>
        <tbody>{roster.map((s) => { const v = attendance[key(s.id)] ?? "Present"; return (
          <tr key={s.id} className="border-b border-vc-line">
            <td className="py-2.5"><div className="flex items-center gap-2.5"><span className="grid size-10 place-items-center rounded-full bg-vc-tile text-[13px] text-vc-link-strong">{s.first[0]}{s.last[0]}</span><span className="text-[15px] leading-tight">{s.first}<br />{s.last}</span></div></td>
            <td><select aria-label={`Attendance for ${s.first}`} className={`h-8 w-[190px] rounded-sm border border-vc-line bg-background px-2 ${v === "Present" ? "text-vc-success" : "text-destructive"}`} value={v} onChange={(e) => update((x) => ({ ...x, attendance: { ...x.attendance, [key(s.id)]: e.target.value } }))}>{ATT.map((a) => <option key={a}>{a}</option>)}</select></td>
            <td><input aria-label={`Note for ${s.first}`} className="h-7 w-full border border-vc-line bg-background px-1.5" maxLength={200} value={attNotes[key(s.id)] ?? ""} onChange={(e) => update((x) => ({ ...x, attNotes: { ...x.attNotes, [key(s.id)]: e.target.value } }))} /></td>
          </tr>); })}</tbody>
      </table>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => update((x) => { const a = { ...x.attendance }; roster.forEach((s) => { a[key(s.id)] = "Present"; }); return { ...x, attendance: a }; })} className="h-8 border border-vc-line px-3 text-[13px]">Mark All Present</button>
      </div>
    </div>
  );
}

const TERMS = [{ id: "MS1", label: "Mid-Semester 1" }, { id: "S1", label: "Semester 1" }];
const LETTERS = ["", "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "P", "I"];

export function GradesComments({ c, roster, list, sid }: { c: Course; roster: Student[]; list: Assignment[]; sid: string | undefined }) {
  const { scores, weights, comments, termGrades, update } = useSchool();
  const nav = useNavigate();
  const [term, setTerm] = useState("MS1");
  const s = roster.find((x) => x.id === sid) ?? roster[0];
  const w = weights[c.id] ?? defaultWeights(list.map((a) => a.category));
  if (!s) return <p className="text-[13px] text-muted-foreground">No students enrolled.</p>;
  const k = `${c.id}|${s.id}|${term}`;
  const avg = weightedAverage(list.map((a) => ({ category: a.category, points: a.points, score: scoreOf(scores, a, s.id) })), w);
  const idx = roster.indexOf(s);
  const pick = (id: string) => nav({ to: "/teacher/class/$classId", params: { classId: c.id }, search: { tab: "grades", sid: id } });
  const text = comments[k] ?? "";
  return (
    <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-4">
      <ul className="max-h-[560px] overflow-y-auto border border-vc-line text-[13px]">{roster.map((x) => (
        <li key={x.id}><button onClick={() => pick(x.id)} className={`flex w-full justify-between px-2.5 py-1.5 text-left ${x.id === s.id ? "bg-vc-select" : "hover:bg-vc-panel"}`}>
          <span>{x.last}, {x.first}</span>{comments[`${c.id}|${x.id}|${term}`] && <CheckCircle2 className="size-3.5 text-vc-success" />}</button></li>))}</ul>
      <div>
        <div className="flex items-start justify-between border-b border-vc-line pb-2">
          <div><div className="text-[18px]">{s.first} {s.last}</div><div className="text-[12px] text-muted-foreground">Grade {s.grade} · {c.name}</div></div>
          <select aria-label="Grading period" className="h-8 border border-vc-line px-2 text-[13px]" value={term} onChange={(e) => setTerm(e.target.value)}>{TERMS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-[13px]">
          <div className="bg-vc-panel p-2.5"><div className="text-[11px] text-muted-foreground">CALCULATED GRADE</div><div className="text-[20px]">{avg !== null ? `${letterFor(avg)} · ${avg.toFixed(2)}%` : "—"}</div></div>
          <label className="bg-vc-panel p-2.5"><div className="text-[11px] text-muted-foreground">POSTED GRADE</div>
            <select className="mt-1 h-8 w-full border border-vc-line bg-background px-2" value={termGrades[k] ?? ""} onChange={(e) => update((x) => ({ ...x, termGrades: { ...x.termGrades, [k]: e.target.value } }))}>{LETTERS.map((l) => <option key={l} value={l}>{l || "— use calculated —"}</option>)}</select></label>
          <div className="bg-vc-panel p-2.5"><div className="text-[11px] text-muted-foreground">REPORTS</div><div className="mt-1 text-vc-link-strong">Progress Report · Report Card</div></div>
        </div>
        <label className="mt-3 block text-[11px] text-muted-foreground">COMMENT</label>
        <textarea className="mt-1 h-44 w-full border border-vc-line p-2 text-[14px] leading-relaxed" maxLength={2000} value={text} onChange={(e) => update((x) => ({ ...x, comments: { ...x.comments, [k]: e.target.value } }))} placeholder={`Write a ${TERMS.find((t) => t.id === term)?.label} comment for ${s.first}…`} />
        <div className="flex items-center justify-between text-[12px] text-muted-foreground"><span>{text.trim() ? text.trim().split(/\s+/).length : 0} words · {text.length}/2000 characters · saved automatically</span>
          <div className="flex gap-2">
            <button disabled={idx <= 0} onClick={() => pick(roster[idx - 1]!.id)} className="h-8 border border-vc-line px-3 text-foreground disabled:opacity-40">Previous</button>
            <button disabled={idx >= roster.length - 1} onClick={() => pick(roster[idx + 1]!.id)} className="h-8 bg-vc-link-strong px-3 text-primary-foreground disabled:opacity-40">Next Student</button>
          </div></div>
      </div>
    </div>
  );
}

export function Weights({ c, list }: { c: Course; list: Assignment[] }) {
  const { weights, update } = useSchool();
  const cats = [...new Set(list.map((a) => a.category))];
  const initial: Weight[] = weights[c.id] ?? defaultWeights(cats);
  const [w, setW] = useState<Weight[]>([...initial, ...cats.filter((x) => !initial.some((y) => y.cat === x)).map((cat) => ({ cat, weight: 0, drop: false }))]);
  const total = weightsTotal(w);
  return (
    <div className="max-w-[720px]">
      <table className="w-full text-[13px]">
        <thead><tr className="border-b-2 border-foreground/70 text-left text-[11px] uppercase text-muted-foreground"><th className="py-1.5">Assignment Type</th><th>Weight</th><th className="text-center">Drop Lowest</th><th className="text-right">Assignments</th><th className="text-right">Total Points</th></tr></thead>
        <tbody>{w.map((x, i) => { const items = list.filter((a) => a.category === x.cat); const st = categoryStats(items); return (
          <tr key={x.cat} className="border-b border-vc-line">
            <td className="py-1.5">{x.cat}</td>
            <td><input aria-label={`${x.cat} weight`} inputMode="numeric" className="h-7 w-16 border border-vc-line text-center" value={String(x.weight)} onChange={(e) => /^\d{0,3}$/.test(e.target.value) && setW(w.map((y, j) => (j === i ? { ...y, weight: Number(e.target.value) } : y)))} /> %</td>
            <td className="text-center"><input type="checkbox" aria-label={`Drop lowest ${x.cat}`} checked={x.drop} onChange={(e) => setW(w.map((y, j) => (j === i ? { ...y, drop: e.target.checked } : y)))} /></td>
            <td className="text-right">{st.count}</td><td className="text-right">{items.reduce((s, a) => s + a.points, 0)}</td>
          </tr>); })}
          <tr className="font-semibold"><td className="py-2">Total</td><td className={total === 100 ? "text-vc-success" : "text-destructive"}>{total}%</td><td colSpan={3} /></tr></tbody>
      </table>
      {total !== 100 && <p className="mt-1 text-[12px] text-destructive">Weights must add up to 100% before you can save.</p>}
      <div className="mt-3 flex gap-2">
        <button disabled={!weightsValid(w)} onClick={() => { update((s) => ({ ...s, weights: { ...s.weights, [c.id]: w } })); toast.success("Assignment weights saved"); }} className="h-8 bg-vc-success px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-40">Save Weights</button>
        <button onClick={() => setW(defaultWeights(cats))} className="h-8 border border-vc-line px-3 text-[13px]">Reset to Equal</button>
      </div>
    </div>
  );
}

export function Reports({ list, roster }: { list: Assignment[]; roster: Student[] }) {
  const { scores, aStatus } = useSchool();
  const rows = list.filter((a) => a.assigned <= new Date()).map((a) => {
    const v = roster.map((s) => scoreOf(scores, a, s.id)).filter((x): x is number => x !== undefined);
    const submitted = roster.filter((s) => scoreOf(scores, a, s.id) !== undefined || ["Turned In", "Late"].includes(aStatus[`${a.id}|${s.id}`] ?? "")).length;
    const pct = (n: number) => (n / a.points) * 100;
    return { a, submitted, graded: v.length, avg: v.length ? pct(v.reduce((x, y) => x + y, 0) / v.length) : null, hi: v.length ? pct(Math.max(...v)) : null, lo: v.length ? pct(Math.min(...v)) : null };
  });
  const assigned = rows.length * roster.length, sub = rows.reduce((s, r) => s + r.submitted, 0), gr = rows.reduce((s, r) => s + r.graded, 0);
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">{[["Assigned", assigned], ["Submitted", sub], ["Graded", gr]].map(([l, n]) => (
        <div key={l} className="bg-vc-panel p-3"><div className="text-[11px] text-muted-foreground">{String(l).toUpperCase()}</div><div className="text-[26px] font-light">{n}</div></div>))}</div>
      <table className="mt-4 w-full text-[13px]">
        <thead><tr className="border-b-2 border-foreground/70 text-left text-[11px] uppercase text-muted-foreground"><th className="py-1.5">Assignment</th><th className="text-right">Submitted</th><th className="text-right">Graded</th><th className="text-right">Low</th><th className="text-right">High</th><th className="w-[230px] pl-4">Average</th></tr></thead>
        <tbody>{[...rows].reverse().map(({ a, submitted, graded, avg, hi, lo }) => (
          <tr key={a.id} className="border-b border-vc-line"><td className="py-1.5">{format(a.due, "M/d")} · {a.title}</td><td className="text-right">{submitted}/{roster.length}</td><td className="text-right">{graded}</td>
            <td className="text-right">{lo !== null ? `${lo.toFixed(0)}%` : "—"}</td><td className="text-right">{hi !== null ? `${hi.toFixed(0)}%` : "—"}</td>
            <td className="pl-4">{avg !== null ? <div className="flex items-center gap-2"><div className="h-2.5 flex-1 bg-vc-line"><div className="h-full bg-vc-link-strong" style={{ width: `${Math.min(100, avg)}%` }} /></div><span className="w-11 text-right">{avg.toFixed(0)}%</span></div> : <span className="text-muted-foreground">Not graded</span>}</td></tr>))}</tbody>
      </table>
    </div>
  );
}
