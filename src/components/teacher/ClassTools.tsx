import { ATT_STATUSES } from "@/lib/attendance";
import { categoryColor } from "@/lib/category-colors";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { meetingsOn } from "@/lib/scheduling";
import { Link, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Assignment, type Course, type Student } from "@/lib/sis-data";
import { categoryStats, defaultWeights, letterFor, weightedAverage, weightsTotal, weightsValid, type Weight } from "@/lib/grading";
import { scoreOf } from "@/lib/gradebook";
import { useSchool, type Section } from "@/lib/school-store";
import { gradingPeriods, termLabel, termOn, termById } from "@/lib/terms";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const ATT = ATT_STATUSES;

const DOT = (v: string) => (v === "Present" ? "bg-vc-success" : v.startsWith("Tardy") ? "bg-vc-tile-warm-fg" : v.startsWith("Absent") || v === "Medical" ? "bg-destructive/70" : "bg-vc-gray");
const COL = "text-[10px] font-semibold uppercase tracking-wide text-vc-gray";

export function Attendance({ c, roster, date }: { c: Section; roster: Student[]; date: string }) {
  const { attendance, attNotes, attDone, update, schedulingSets } = useSchool();
  const nav = useNavigate();
  const [editing, setEditing] = useState<string | null>(null);
  const key = (sid: string) => `${c.id}|${date}|${sid}`;
  const done = attDone.includes(`${c.id}|${date}`);
  const setDate = (d: string) => nav({ to: "/teacher/class/$classId", params: { classId: c.id }, search: { tab: "attendance", date: d } });
  const go = (n: number) => { const d = parseISO(date); d.setDate(d.getDate() + n); setDate(format(d, "yyyy-MM-dd")); };
  const term = termOn(c.terms, parseISO(date));
  const meetings = meetingsOn(c, schedulingSets, parseISO(date));
  const meets = Boolean(term) && meetings.length > 0;
  const status = (sid: string) => attendance[key(sid)] ?? "Present";
  const notExpected = roster.filter((s) => status(s.id) === "Not Expected").length;
  // Any change after a day was marked complete reopens it: it has to be marked complete again to save.
  const doneKey = `${c.id}|${date}`;
  const reopen = (x: { attDone: string[] }) => x.attDone.filter((k) => k !== doneKey);
  const setNote = (k: string, v: string) => update((x) => ({ ...x, attDone: reopen(x), attNotes: { ...x.attNotes, [k]: v } }));
  const setStatus = (sid: string, v: string) => update((x) => ({ ...x, attDone: reopen(x), attendance: { ...x.attendance, [key(sid)]: v } }));
  const ghost = "h-8 rounded-[3px] border border-vc-line bg-background px-3 text-[12px] shadow-sm";
  return (
    <div className="text-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[20px] font-semibold leading-8 text-foreground/80">Daily Attendance <span className={`rounded-[3px] px-2 py-0.5 text-[13px] font-normal leading-5 ${done ? "bg-vc-success/20 text-vc-done" : "bg-vc-chip text-foreground/70"}`}>{done ? "Taken" : "Not Taken"}</span></h2>
        <div className="flex items-center gap-3">
          {!done && <button onClick={() => { update((x) => ({ ...x, attDone: [...x.attDone, `${c.id}|${date}`] })); toast.success("Attendance marked complete"); }} disabled={!meets} className="flex h-8 items-center gap-1.5 rounded-[3px] bg-vc-site-blue px-3.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"><Check className="size-3.5" strokeWidth={3.5} />Mark Complete</button>}
          <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "website" }} className={`flex items-center gap-1.5 ${ghost}`}><Settings className="size-3.5 fill-current" />Settings</Link>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex h-8 items-center rounded-[3px] border border-vc-line text-vc-gray shadow-sm">
          <button aria-label="Previous day" className="px-2.5" onClick={() => go(-1)}><ChevronLeft className="size-4" /></button>
          <label className="relative flex h-full min-w-[120px] items-center justify-center border-x border-vc-line px-2 text-[12px]"><span aria-hidden>{format(parseISO(date), "MMMM d, yyyy")}</span><input type="date" aria-label="Attendance date" className="absolute inset-0 cursor-pointer opacity-0" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
          <button aria-label="Next day" className="px-2.5" onClick={() => go(1)}><ChevronRight className="size-4" /></button>
        </div>
        <div className="relative">
          <select aria-label="Attendance block" className="h-8 w-[210px] appearance-none rounded-[3px] border border-vc-line bg-background pl-3 pr-8 text-[12px] text-vc-gray shadow-sm">{meetings.length ? meetings.map((b, i) => <option key={i}>{b.name || c.block}</option>) : <option>No Block Specified</option>}</select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-vc-gray-light" />
        </div>
      </div>
      {!meets ? <p className="my-6 border border-vc-line bg-vc-panel p-4">This class does not meet on {format(parseISO(date), "MMMM d, yyyy")} — attendance is only taken during its terms ({c.terms.map(termLabel).join(", ")}).</p> : <>
        <div className="mt-2.5 text-[11px] text-foreground/80">Total: {roster.length} (Expected: {roster.length - notExpected}, Not Expected: {notExpected})</div>
        <div className="mt-6 overflow-x-auto"><table className="w-full">
          <thead><tr className="text-left"><th className="w-[30%]" /><th className="w-[210px]" /><th className={`${COL} pb-1 pl-2`}>Daily Notes</th></tr></thead>
          <tbody>{roster.map((s) => { const v = status(s.id); const note = attNotes[key(s.id)] ?? ""; const lateKey = `${key(s.id)}|late`; return (
            <tr key={s.id} className="align-top hover:bg-vc-sky">
              <td className="py-[7px] pl-2 pr-3"><div className="flex items-center gap-3"><PersonPhoto personId={s.id} fit={{ w: 50, h: 50 }} className="rounded-full" alt={`${s.first} ${s.last}`} /><span className="text-[16px] leading-[19px]">{s.first}<br /><span className="text-vc-gray-dark">{s.last}</span></span></div></td>
              <td className="pr-4 pt-[15px]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" aria-label={`Attendance for ${s.first}: ${v}`} className="relative flex h-8 w-[150px] items-center rounded-[3px] border border-vc-line bg-background pl-6 pr-8 text-left text-[11px] text-foreground/70 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-vc-site-blue">
                      <span aria-hidden className={`absolute left-2.5 top-1/2 size-2 -translate-y-1/2 rounded-full ${DOT(v)}`} />{v}
                      <span aria-hidden className="absolute inset-y-1 right-7 border-l border-vc-line" /><ChevronDown aria-hidden className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-foreground/60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[150px] min-w-0 rounded-[3px] p-0 text-[11px]">
                    {ATT.map((a) => <DropdownMenuItem key={a} onSelect={() => setStatus(s.id, a)} className={`flex items-center gap-2 rounded-none px-2.5 py-2 text-[11px] ${a === v ? "bg-vc-site-blue text-primary-foreground focus:bg-vc-site-blue focus:text-primary-foreground" : ""}`}><span aria-hidden className={`size-2 shrink-0 rounded-full ${DOT(a)}`} />{a}</DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>
                {v.startsWith("Tardy") && <div className="mt-2 w-[150px]"><div className="text-[9.5px] uppercase tracking-wide text-vc-gray">Late arrival time</div><input type="time" aria-label={`Late arrival time for ${s.first}`} className="mt-1 h-9 w-full rounded-[3px] border border-vc-line bg-background px-2 text-[12px] text-foreground/80" value={attNotes[lateKey] ?? ""} onChange={(e) => setNote(lateKey, e.target.value)} /></div>}
              </td>
              <td className="pl-2 pt-[15px] text-[11px] leading-[17px]">
                {editing === s.id ? <input autoFocus aria-label={`Note for ${s.first}`} className="h-7 w-full max-w-[240px] border border-vc-line bg-background px-1.5" maxLength={200} value={note} onBlur={() => setEditing(null)} onChange={(e) => setNote(key(s.id), e.target.value)} />
                  : <>{note && <div className="mb-1">{note}</div>}<button onClick={() => setEditing(s.id)} className="h-6 rounded-[3px] border border-vc-line bg-background px-2.5 text-[10px] font-semibold shadow-sm">{note ? "Edit" : "Add Notes"}</button></>}
              </td>
            </tr>); })}</tbody>
        </table></div>
        <div className="mt-3 flex justify-end">
          <button onClick={() => update((x) => { const a = { ...x.attendance }; roster.forEach((s) => { a[key(s.id)] = "Present"; }); return { ...x, attDone: reopen(x), attendance: a }; })} className={ghost}>Mark All Present</button>
        </div>
      </>}
    </div>
  );
}

const LETTERS = ["", "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "P", "I"];

export function GradesComments({ c, roster, list, sid }: { c: Section; roster: Student[]; list: Assignment[]; sid: string | undefined }) {
  const { scores, weights, comments, termGrades, update } = useSchool();
  const nav = useNavigate();
  const TERMS = gradingPeriods(c.terms);
  const [term, setTerm] = useState(TERMS[0]?.id ?? "");
  const s = roster.find((x) => x.id === sid) ?? roster[0];
  const w = weights[c.id] ?? [];
  if (!s) return <p className="text-[13px] text-muted-foreground">No students enrolled.</p>;
  const k = `${c.id}|${s.id}|${term}`;
  const period = c.terms.find((id) => term.startsWith(id));
  const bounds = period ? termById(period) : undefined;
  const periodList = list.filter((a) => !bounds || (+a.due >= +bounds.start && +a.due <= +(term.endsWith("-M") ? bounds.mid : bounds.end) + 86399999));
  const avg = weightedAverage(periodList.map((a) => ({ category: a.category, points: a.points, score: scoreOf(scores, a, s.id) })), w);
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
            <button disabled={idx <= 0} onClick={() => pick(roster[idx - 1]?.id ?? s.id)} className="h-8 border border-vc-line px-3 text-foreground disabled:opacity-40">Previous</button>
            <button disabled={idx >= roster.length - 1} onClick={() => pick(roster[idx + 1]?.id ?? s.id)} className="h-8 bg-vc-link-strong px-3 text-primary-foreground disabled:opacity-40">Next Student</button>
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
    <div className="max-w-[720px]"><h2 className="mb-3 text-[22px] font-light">Assignment Weights</h2><div className="mb-3 flex gap-2 text-[13px]"><Button size="sm" variant={!weights[c.id]?.length ? "default" : "outline"} onClick={() => { update((s) => ({ ...s, weights: { ...s.weights, [c.id]: [] } })); toast.success("Weighting by assignment points"); }}>Assignment Points</Button><Button size="sm" variant={weights[c.id]?.length ? "default" : "outline"} onClick={() => setW(defaultWeights(cats))}>Assignment Type</Button></div>
      <table className="w-full border-separate border-spacing-1 text-[13px]">
        <thead><tr className="[&>th]:rounded-sm [&>th]:bg-vc-sky [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold"><th className="text-left">Assignment Types</th><th>Weight</th><th>Drop Lowest</th><th>Show in Gradebook</th><th>Count</th><th>Total Points</th></tr></thead>
        <tbody>
          <tr className="[&>td]:rounded-sm [&>td]:bg-vc-tile-warm [&>td]:px-3 [&>td]:py-2 [&>td]:text-center [&>td]:font-semibold"><td className="!text-right">Totals</td><td className={total === 100 ? "text-vc-success" : "text-destructive"}>{total}%</td><td /><td /><td>{list.length}</td><td>{list.reduce((s2, a) => s2 + a.points, 0)}</td></tr>
          {w.map((x, i) => { const items = list.filter((a) => a.category === x.cat); const st = categoryStats(items); const col = categoryColor(w, x.cat); const patch = (p2: Partial<Weight>) => setW(w.map((y, j) => (j === i ? { ...y, ...p2 } : y))); return (
          <tr key={x.cat} className="[&>td]:rounded-sm [&>td]:bg-vc-panel [&>td]:px-3 [&>td]:py-1.5 [&>td]:text-center">
            <td style={{ background: col }} className="min-w-[220px] !text-left font-semibold uppercase text-primary-foreground">{x.cat}</td>
            <td><input aria-label={`${x.cat} weight`} inputMode="numeric" className="h-7 w-14 rounded-sm border border-vc-line bg-background pr-1 text-right" value={String(x.weight)} onChange={(e) => /^\d{0,3}$/.test(e.target.value) && patch({ weight: Number(e.target.value) })} /> %</td>
            <td><input type="checkbox" aria-label={`Drop lowest ${x.cat}`} checked={x.drop} onChange={(e) => patch({ drop: e.target.checked })} /></td>
            <td><input type="checkbox" aria-label={`Show ${x.cat} in gradebook`} checked={x.show !== false} onChange={(e) => patch({ show: e.target.checked })} /></td>
            <td>{st.count || ""}</td><td>{items.reduce((s2, a) => s2 + a.points, 0) || ""}</td>
          </tr>); })}</tbody>
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
    const pct = (n: number) => a.points > 0 ? (n / a.points) * 100 : 0;
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
