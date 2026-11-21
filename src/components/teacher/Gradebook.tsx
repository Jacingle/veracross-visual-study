import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, ChevronDown, Eye, EyeOff, FileText, Pencil, Plus, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { useCategoryStyle } from "@/lib/category-colors";
import { isScoreInput, scoreKey, scoreOf } from "@/lib/gradebook";
import { weightedAverage } from "@/lib/grading";
import { isoDay, useSchool } from "@/lib/school-store";
import { today, type Assignment, type Student } from "@/lib/sis-data";
import { termById, termOn } from "@/lib/terms";

const sel = "h-[38px] min-w-[150px] appearance-none rounded-[6px] border border-vc-line bg-background pl-3 pr-8 text-[14px] text-foreground/80 outline-none focus:border-vc-link";

/** Faculty gradebook: one card per assignment, one row per student. Unpublished columns are yellow. */
export function Gradebook({ courseId, terms, list: all, roster }: { courseId: string; terms: string[]; list: Assignment[]; roster: Student[] }) {
  const { scores, weights, update, custom } = useSchool();
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
  const set = (aid: string, sid: string, v: string) => update((s) => ({ ...s, scores: { ...s.scores, [scoreKey(aid, sid)]: v } }));
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
  const cell = "h-[36px] w-full rounded-[4px] bg-[#f4f4f4] text-center text-[14px] text-foreground/80";
  const warm = "bg-vc-tile-warm shadow-[inset_3px_0_0_var(--vc-sky)]";
  const link = (a: Assignment) => ({ to: "/teacher/class/$classId" as const, params: { classId: courseId }, search: { tab: "assignments" as const, aid: a.id } });
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-vc-line px-5 pb-3 pl-[42px] pt-4">
        <Link to="/teacher/class/$classId" params={{ classId: courseId }} search={{ tab: "assignments", aid: "new" }} className="flex h-[42px] items-center gap-2.5 rounded-[8px] bg-vc-success px-4 text-[15px] font-medium text-primary-foreground hover:brightness-95"><span className="grid size-5 place-items-center rounded-full border-2 border-primary-foreground"><Plus className="size-3.5" strokeWidth={3} /></span>Add Assignment</Link>
        <Link to="/teacher/class/$classId" params={{ classId: courseId }} search={{ tab: "weights" }} className="flex h-[42px] items-center gap-2.5 rounded-[8px] bg-[#4a9be0] px-4 text-[15px] font-medium text-primary-foreground hover:brightness-95"><Scale className="size-5" />Weighting</Link>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setDesc((v) => !v)} className="flex items-center gap-1.5 text-[15px] text-foreground/60" aria-label="Date order" title="Switch date order">Date Order {desc ? <ArrowDownWideNarrow className="size-5" /> : <ArrowUpWideNarrow className="size-5" />}</button>
          <div className="relative"><select aria-label="Term" className={sel} value={termId} onChange={(e) => setTermId(e.target.value)}>{terms.map((t) => <option key={t} value={t}>{termById(t)?.label ?? t}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-3 size-4 text-foreground/60" /></div>
          <div className="relative"><select aria-label="Assignment type filter" value={type} onChange={(e) => setType(e.target.value)} className={sel}><option value="all">All Assignment Types</option>{types.map((t) => <option key={t} value={t}>{t}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-3 size-4 text-foreground/60" /></div>
        </div>
      </div>
      <div className="overflow-x-auto px-5 pb-6 pt-3">
        <table className="border-separate border-spacing-[3px]">
          <thead><tr>
            <th className="sticky left-0 z-10 min-w-[150px] bg-background" />
            <th className="h-[86px] min-w-[74px] rounded-[6px] bg-vc-sky px-1 text-center align-middle text-[14px] font-semibold leading-[20px]">Calculated Grade</th>
            {list.map((a) => { const hidden = isHidden(a); return (
              <th key={a.id} className={`group relative h-[86px] min-w-[116px] max-w-[116px] rounded-[6px] p-0 text-left align-top font-normal transition-none ${hidden ? warm : "bg-[#f4f4f4]"} hover:!bg-[#8e9aa8]`}>
                <Link {...link(a)} className="block h-full px-2.5 pb-2 pt-2" aria-label={`Open assignment ${a.title}`}>
                  <span style={chip(a.category)} className="inline-block rounded-[2px] px-1 text-[9px] font-bold uppercase leading-[13px] text-primary-foreground">{a.category}</span>
                  <span className="mt-1 block max-h-[34px] overflow-hidden text-[13px] font-semibold leading-[17px] text-foreground" title={a.title}>{a.title}</span>
                  <span className="absolute bottom-2 left-2.5 text-[12px] text-vc-gray group-hover:hidden">{format(a.due, "MMM dd")}</span>
                  <span className="absolute bottom-2 left-2.5 hidden items-center gap-3 text-[12px] font-bold uppercase text-foreground group-hover:flex"><span className="font-normal normal-case text-foreground/80">{format(a.due, "MMM dd")}</span><span className="flex items-center gap-1"><Pencil className="size-3.5" fill="currentColor" />Edit</span></span>
                </Link>
                <button type="button" onClick={() => togglePublished(a)} aria-label={hidden ? `Show ${a.title} to students` : `Hide ${a.title} from students`} title={hidden ? "Hidden from students. Click to publish scores." : "Visible to students. Click to hide scores."} className="absolute right-1.5 top-1.5 hidden size-6 place-items-center rounded-full text-foreground/70 hover:bg-background/60 group-hover:grid">{hidden ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}</button>
              </th>); })}
          </tr></thead>
          <tbody>
            {roster.map((s) => { const av = avgFor(s.id); return (
              <tr key={s.id}>
                <td className="sticky left-0 z-10 bg-background pr-3"><div className="flex items-center gap-2.5"><PersonPhoto personId={s.id} className="size-[34px] rounded-full" /><div className="leading-[17px]"><div className="text-[14px] font-semibold">{s.first}</div><div className="text-[14px] text-vc-gray">{s.last}</div></div></div></td>
                <td className="group/g h-[40px] rounded-[6px] bg-vc-sky p-0 text-center text-[14px] text-foreground/80">
                  <span className="relative inline-flex items-center justify-center px-5">{av !== null ? Number(av.toFixed(2)) : "—"}
                    <a href={`/teacher/class/${encodeURIComponent(courseId)}?tab=gradedetail&sid=${encodeURIComponent(s.id)}`} target="_blank" rel="noopener" aria-label={`Open ${s.first} ${s.last}'s grade detail in a new tab`} title="Open grade detail in a new tab" className="absolute -right-0.5 hidden text-foreground group-hover/g:block"><FileText className="size-[18px]" fill="currentColor" strokeWidth={1} /></a></span>
                </td>
                {list.map((a) => { const k = scoreKey(a.id, s.id); const v = k in scores ? scores[k] ?? "" : String(scoreOf(scores, a, s.id) ?? ""); const low = v !== "" && Number(v) / a.points < 0.7; const hidden = isHidden(a); return (
                  <td key={a.id} className="p-0">
                    <input aria-label={`${s.first} ${s.last} – ${a.title}`} value={v === "" ? "" : v} placeholder="-" inputMode="decimal"
                      onChange={(e) => { if (isScoreInput(e.target.value)) set(a.id, s.id, e.target.value); else toast.error("Scores must be numbers"); }}
                      className={`${cell} ${hidden ? warm : ""} outline-none placeholder:text-foreground/60 focus:bg-vc-select ${low ? "text-destructive" : ""}`} />
                  </td>); })}
              </tr>); })}
            <tr><td colSpan={list.length + 2}><div className="h-1.5 bg-vc-line/50" /></td></tr>
            {stats.map(([label, fn]) => { const g = fn(avgList); return (
              <tr key={label}>
                <td className="sticky left-0 z-10 bg-background pr-3 text-right text-[14px]">{label}</td>
                <td className="h-9 rounded-[4px] bg-vc-sky text-center text-[14px]">{g !== null ? g.toFixed(2) : "—"}</td>
                {list.map((a) => { const r = fn(nums(a)); return <td key={a.id} className={`h-9 rounded-[4px] text-center text-[14px] ${isHidden(a) ? "bg-vc-tile-warm" : "bg-[#f4f4f4]"}`}>{r !== null ? r.toFixed(2) : ""}</td>; })}
              </tr>); })}
          </tbody>
        </table>
        {!list.length && <p className="py-10 text-center text-[14px] text-muted-foreground">No assignments in this term. Choose Add Assignment to create one.</p>}
      </div>
    </div>
  );
}
