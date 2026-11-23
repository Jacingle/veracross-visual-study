import { Link } from "@tanstack/react-router";
import { fmtGrade } from "@/lib/fmt-grade";
import { VcSelect } from '@/components/teacher/VcSelect';
import { format } from "date-fns";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, ChevronDown, Eye, EyeOff, FileText, Pencil, Plus, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { useCategoryStyle } from "@/lib/category-colors";
import { dropboxOf, onScoreEntered } from "@/lib/dropbox";
import { isScoreInput, scoreKey, scoreOf } from "@/lib/gradebook";
import { weightedAverage } from "@/lib/grading";
import { isoDay, useSchool } from "@/lib/school-store";
import { today, type Assignment, type Student } from "@/lib/sis-data";
import { termById, termOn } from "@/lib/terms";

const sel = "h-[25px] w-[102px] rounded-[4px] border border-[#ececec] bg-background pl-[9px] pr-[7px] text-[10.5px] text-[#8a8a8a] outline-none shadow-[0_1px_2px_rgba(0,0,0,.05)]";

/** Small black document with a folded corner and text lines. */
function PaperIcon() {
  return (
    <svg aria-hidden width="13" height="16" viewBox="0 0 13 16" className="block">
      <path d="M1.5 0.5h6.2L12.5 5.3V14a1.5 1.5 0 0 1-1.5 1.5H1.5A1.5 1.5 0 0 1 0 14V2A1.5 1.5 0 0 1 1.5 0.5Z" fill="currentColor" />
      <path d="M7.5 0.5V4.2a1 1 0 0 0 1 1h4" fill="none" stroke="#fff" strokeWidth="0.9" />
      <path d="M2.6 8.3h7.3M2.6 10.4h7.3M2.6 12.5h4.6" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** Faculty gradebook: one card per assignment, one row per student. Unpublished columns are yellow. */
export function Gradebook({ courseId, terms, list: all, roster }: { courseId: string; terms: string[]; list: Assignment[]; roster: Student[] }) {
  const { scores, weights, update, custom, comments } = useSchool();
  const w = weights[courseId] ?? [];
  const chip = useCategoryStyle(courseId);
  const [type, setType] = useState("all");
  const [desc, setDesc] = useState(false);
  const [termId, setTermId] = useState(termOn(terms, today())?.id ?? terms[0] ?? "");
  const term = termById(termId);
  const inTerm = useMemo(() => all.filter((a) => !term || (a.due >= term.start && +a.due <= +term.end + 86399999)), [all, term]);
  const types = [...new Set(inTerm.map((a) => a.category))];
  const list = inTerm.filter((a) => w.find((x) => x.cat === a.category)?.show !== false && (type === "all" || a.category === type)).sort((a, b) => (desc ? +b.due - +a.due : +a.due - +b.due));
  const isHidden = (a: Assignment) => custom.find((x) => x.id === a.id)?.published === false;
  const set = (aid: string, sid: string, v: string) => update((s) => ({ ...s, scores: { ...s.scores, [scoreKey(aid, sid)]: v }, aStatus: onScoreEntered(s.aStatus, scoreKey(aid, sid), v) }));
  const avgFor = (sid: string) => weightedAverage(inTerm.filter((a) => custom.find((x) => x.id === a.id)?.inCalc !== false).map((a) => ({ category: a.category, points: a.points, score: scoreOf(scores, a, sid) })), w);
  const togglePublished = (a: Assignment) => {
    const hidden = isHidden(a);
    update((s) => {
      const have = s.custom.find((x) => x.id === a.id);
      const base = have ?? { id: a.id, courseId, title: a.title, category: a.category, assigned: isoDay(a.assigned), due: isoDay(a.due), points: a.points, details: "", notes: a.notes ?? "", published: true, inCalc: true, extraCredit: false, allSections: false, method: "Points" };
      return { ...s, custom: [...s.custom.filter((x) => x.id !== a.id), { ...base, published: hidden }] };
    });
    toast.success(hidden ? `${a.title} is now visible to students` : `${a.title} is now hidden from students`);
  };
  const nums = (a: Assignment) => roster.map((s) => scoreOf(scores, a, s.id)).filter((x): x is number => x !== undefined);
  const avgList = roster.map((s) => avgFor(s.id)).filter((x): x is number => x !== null);
  const median = (v: number[]) => { if (!v.length) return null; const t = [...v].sort((x, y) => x - y); const m = Math.floor(t.length / 2); return t.length % 2 ? t[m] ?? null : ((t[m - 1] ?? 0) + (t[m] ?? 0)) / 2; };
  const sd = (v: number[]) => { if (v.length < 2) return null; const m = v.reduce((x, y) => x + y, 0) / v.length; return Math.sqrt(v.reduce((x, y) => x + (y - m) ** 2, 0) / v.length); };
  const stats: [string, (v: number[]) => number | null][] = [["Class Average", (v) => (v.length ? v.reduce((x, y) => x + y, 0) / v.length : null)], ["Class Median", median], ["Standard Dev", sd]];
  const cell = "h-[32px] w-full rounded-[4px] bg-[#f4f4f4] text-center text-[10.8px] text-[#555] text-foreground/80";
  const warm = "bg-[#fcf4df]";
  const link = (a: Assignment) => ({ to: "/teacher/class/$classId" as const, params: { classId: courseId }, search: { tab: "assignments" as const, aid: a.id } });
  return (
    <div>
      <div className="flex flex-wrap items-center gap-[11px] border-b border-[#eeeeee] pb-[5px] pl-[23px] pr-[5px] pt-[7px]">
        <Link to="/teacher/class/$classId" params={{ classId: courseId }} search={{ tab: "assignments", aid: "new" }} className="flex h-[25px] items-center gap-[8px] rounded-[4px] bg-[#4fa564] px-[11px] text-[10.8px] font-medium text-primary-foreground hover:brightness-95"><span className="grid size-3.5 place-items-center rounded-full border-[1.5px] border-primary-foreground"><Plus className="size-2.5" strokeWidth={3} /></span>Add Assignment</Link>
        <Link to="/teacher/class/$classId" params={{ classId: courseId }} search={{ tab: "weights" }} className="flex h-[25px] items-center gap-[8px] rounded-[4px] bg-[#3f9bf0] px-[11px] text-[10.8px] font-medium text-primary-foreground hover:brightness-95"><Scale className="size-3.5" />Weighting</Link>
        <div className="ml-auto flex flex-wrap items-center gap-[11px]">
          <button type="button" onClick={() => setDesc((v) => !v)} className="flex items-center gap-1.5 text-[10.5px] text-[#8a8a8a]" aria-label="Date order" title="Switch date order">Date Order {desc ? <ArrowDownWideNarrow className="size-3.5" /> : <ArrowUpWideNarrow className="size-3.5" />}</button>
          <div className="relative"><VcSelect aria-label="Term" className={sel} value={termId} onChange={(e) => setTermId(e.target.value)}>{terms.map((t) => <option key={t} value={t}>{termById(t)?.label ?? t}</option>)}</VcSelect></div>
          <div className="relative"><VcSelect aria-label="Assignment type filter" value={type} onChange={(e) => setType(e.target.value)} className={`${sel} !w-[141px]`}><option value="all">All Assignment Types</option>{types.map((t) => <option key={t} value={t}>{t}</option>)}</VcSelect></div>
        </div>
      </div>
      <div className="overflow-x-auto pb-6 pl-[23px] pr-[10px] pt-[17px]">
        <table className="border-separate border-spacing-[3px]">
          <thead><tr>
            <th className="sticky left-0 z-10 min-w-[100px] bg-background" />
            <th className="h-[90px] min-w-[74px] max-w-[74px] rounded-[4px] bg-[#e9f1f9] px-1 pb-[9px] text-center align-bottom text-[10.8px] font-bold leading-[14px]">Calculated Grade</th>
            {list.map((a) => { const hidden = isHidden(a); return (
              <th key={a.id} className={`group relative h-[90px] min-w-[116px] max-w-[116px] rounded-[4px] p-0 text-left align-top font-normal transition-none ${hidden ? warm : "bg-[#f4f4f4]"} hover:!bg-[#8e9aa8]`}>
                <Link {...link(a)} className="block h-full px-[6px] pb-2 pt-[6px]" aria-label={`Open assignment ${a.title}`}>
                  <span style={chip(a.category)} className="inline-block rounded-[2px] px-1 text-[7.5px] font-bold uppercase leading-[11px] text-primary-foreground">{a.category}</span>
                  <span className="mt-[7px] line-clamp-2 break-words text-[9.8px] font-bold leading-[13px] text-[#222]" title={a.title}>{a.title}</span>
                  <span className="absolute bottom-[14px] left-[6px] text-[10px] text-[#b5b5b5] group-hover:hidden">{format(a.due, "MMM dd")}</span>
                  <span className="absolute bottom-[14px] left-[6px] hidden items-center gap-3 text-[11px] font-bold uppercase text-foreground group-hover:flex"><span className="font-normal normal-case text-foreground/80">{format(a.due, "MMM dd")}</span><span className="flex items-center gap-1"><Pencil className="size-3.5" fill="currentColor" />Edit</span></span>
                </Link>
                <button type="button" onClick={() => togglePublished(a)} aria-label={hidden ? `Show ${a.title} to students` : `Hide ${a.title} from students`} title={hidden ? "Hidden from students. Click to publish scores." : "Visible to students. Click to hide scores."} className="absolute right-1.5 top-1.5 hidden size-6 place-items-center rounded-full text-foreground/70 hover:bg-background/60 group-hover:grid">{hidden ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}</button>
              </th>); })}
          </tr></thead>
          <tbody>
            {roster.map((s) => { const av = avgFor(s.id); return (
              <tr key={s.id}>
                <td className="sticky left-0 z-10 bg-background pr-3"><div className="flex items-center gap-2.5"><PersonPhoto personId={s.id} className="size-[29px] rounded-full" /><div className="leading-[14px]"><div className="text-[10.5px] font-bold">{s.first}</div><div className="text-[10.5px] text-[#b3b3b3]">{s.last}</div></div></div></td>
                <td className="group/g h-[32px] rounded-[4px] bg-[#e9f1f9] p-0 text-center text-[10.8px] text-[#555]">
                  <span className="relative inline-flex items-center justify-center px-0">{av !== null ? fmtGrade(av) : "—"}
                    <Link to="/teacher/class/$classId" params={{ classId: courseId }} search={{ tab: "gradedetail", sid: s.id }} aria-label={`Open ${s.first} ${s.last}'s grade detail`} title="Grade detail" className="absolute -right-[22px] top-1/2 hidden -translate-y-1/2 text-black group-hover/g:block"><PaperIcon /></Link></span>
                </td>
                {list.map((a) => { const k = scoreKey(a.id, s.id); const v = k in scores ? scores[k] ?? "" : String(scoreOf(scores, a, s.id) ?? ""); const low = v !== "" && Number(v) / a.points < 0.7; const hidden = isHidden(a); const drop = dropboxOf(comments, k); return (
                  <td key={a.id} className="relative p-0">
                    <input aria-label={`${s.first} ${s.last} – ${a.title}`} value={v === "" ? "" : v} placeholder="-" inputMode="decimal"
                      onChange={(e) => { if (isScoreInput(e.target.value)) set(a.id, s.id, e.target.value); else toast.error("Scores must be numbers"); }}
                      className={`${cell} ${hidden ? warm : ""} outline-none placeholder:text-foreground/60 focus:bg-vc-select ${low ? "text-destructive" : ""}`} />
                    {drop !== "Closed" && <span aria-hidden title={`Dropbox: ${drop}`} className="pointer-events-none absolute bottom-[3px] left-[3px] size-0 border-b-[9px] border-r-[9px] border-r-transparent" style={{ borderBottomColor: drop === "Received" ? "#4caf7a" : "#f2a33a" }} />}
                  </td>); })}
              </tr>); })}
            <tr><td colSpan={list.length + 2}><div className="h-1.5 bg-vc-line/50" /></td></tr>
            {stats.map(([label, fn]) => { const g = fn(avgList); return (
              <tr key={label}>
                <td className="sticky left-0 z-10 bg-background pr-3 text-right text-[12px]">{label}</td>
                <td className="h-[32px] rounded-[4px] bg-[#e9f1f9] text-center text-[10.8px]">{g !== null ? fmtGrade(g) : "—"}</td>
                {list.map((a) => { const r = fn(nums(a)); return <td key={a.id} className={`h-[32px] rounded-[4px] text-center text-[12px] ${isHidden(a) ? "bg-vc-tile-warm" : "bg-[#f4f4f4]"}`}>{r !== null ? fmtGrade(r) : ""}</td>; })}
              </tr>); })}
          </tbody>
        </table>
        {!list.length && <p className="py-10 text-center text-[14px] text-muted-foreground">No assignments in this term. Choose Add Assignment to create one.</p>}
      </div>
    </div>
  );
}
