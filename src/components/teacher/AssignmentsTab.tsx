import { PersonPhoto } from "@/components/common/PersonPhoto";
import { VcSelect } from '@/components/teacher/VcSelect';
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { AlignLeft, Bold, CalendarDays, ChevronLeft, IndentDecrease, IndentIncrease, Italic, List, ListOrdered, Underline, ChevronRight, Check, Lock, Mail, MessageCircleMore, Paperclip, Plus, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useCategoryStyle } from "@/lib/category-colors";
import { parseISO } from "date-fns";
import { today, type Assignment, type Category, type Student } from "@/lib/sis-data";
import { isScoreInput, scoreKey, scoreOf } from "@/lib/gradebook";
import { isoDay, useSchool, useMySections, type CustomAssignment } from "@/lib/school-store";

const STATUSES = ["", "Turned In", "Late", "Missing", "Excused", "Incomplete"];
const inp = "h-8 w-full border border-vc-line px-2 text-[13px] outline-none focus:border-vc-link";
const schema = z.object({ title: z.string().trim().min(1, "Description is required").max(120), points: z.number().int().min(0).max(1000, "Max score is 1000"), assigned: z.string().min(1), due: z.string().min(1) })
  .refine((v) => v.due >= v.assigned, "Due date can't be before the assignment date");

type Props = { courseId: string; list: Assignment[]; roster: Student[]; aid: string | undefined; sub: "details" | "students" | undefined };

export function AssignmentsTab({ courseId, list, roster, aid, sub }: Props) {
  const nav = useNavigate();
  const chip = useCategoryStyle(courseId);
  const go = (search: { aid?: string; sub?: "details" | "students" }) => nav({ to: "/teacher/class/$classId", params: { classId: courseId }, search: { tab: "assignments", ...search } });
  const { scores } = useSchool();
  if (aid) {
    const a = list.find((x) => x.id === aid);
    if (aid !== "new" && !a) return <p className="py-10 text-center text-[13px] text-muted-foreground">Assignment not found. <button className="text-vc-link-strong" onClick={() => go({})}>Back to list</button></p>;
    const i = a ? list.findIndex((x) => x.id === a.id) : -1;
    const step = (d: number) => { const n = list[i + d]; if (n) go({ aid: n.id, sub }); };
    const cur = sub ?? "details";
    const nice = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
    return (
      <div className="relative">
        <div className="flex items-end border-b border-[#ececec] pl-[15px] pt-[6px]">
          <Link to="/teacher/class/$classId" params={{ classId: courseId }} search={{ tab: "gradebook" }} className="mb-[6px] flex h-[25px] w-[112px] items-center gap-2 rounded-[4px] bg-[#4d4d4d] px-3 text-[11px] font-medium text-primary-foreground hover:brightness-110"><span className="grid size-[14px] place-items-center rounded-full bg-primary-foreground text-[#4d4d4d]"><ChevronLeft className="size-2.5" strokeWidth={3.5} /></span>Back to Scores</Link>
          {([["details", "Assignment Info"], ["students", "Students"]] as const).map(([k, label], n) => (
            <button key={k} type="button" disabled={!a && k === "students"} onClick={() => go({ aid, sub: k })} className={`${n === 0 ? "ml-[8px]" : ""} border-b-2 px-[17px] pb-[9px] pt-[8px] text-[11.5px] ${cur === k ? "border-[#4fb3e6] text-[#4fb3e6]" : "border-transparent text-[#a8a8a8]"}`}>{label}</button>))}
        </div>
        {a && cur === "students" && <div className="flex items-start gap-3 px-[13px] pb-0 pt-[17px]">
          <div className="flex h-[30px] w-[73px] overflow-hidden rounded-[3px] border border-[#ececec] text-[#8a8a8a]">
            <button type="button" aria-label="Previous assignment" disabled={i <= 0} onClick={() => step(-1)} className="grid flex-1 place-items-center border-r border-[#ececec] disabled:opacity-40"><ChevronLeft className="size-3.5" /></button>
            <button type="button" aria-label="Next assignment" disabled={i < 0 || i >= list.length - 1} onClick={() => step(1)} className="grid flex-1 place-items-center disabled:opacity-40"><ChevronRight className="size-3.5" /></button></div>
          <div><span style={chip(a.category)} className="inline-block rounded-[2px] px-[5px] py-px text-[8.5px] font-semibold leading-[11px] text-primary-foreground opacity-90">{nice(a.category)}</span>
            <h3 className="text-[13.5px] font-normal leading-[17px]">{a.title}</h3></div>
        </div>}
        {a && cur === "details" && <div className="flex items-center gap-2 px-[13px] pt-[14px]">
          <div className="flex h-[26px] w-[64px] overflow-hidden rounded-[3px] border border-[#ececec] text-[#8a8a8a]">
            <button type="button" aria-label="Previous assignment" disabled={i <= 0} onClick={() => step(-1)} className="grid flex-1 place-items-center border-r border-[#ececec] disabled:opacity-40"><ChevronLeft className="size-3.5" /></button>
            <button type="button" aria-label="Next assignment" disabled={i < 0 || i >= list.length - 1} onClick={() => step(1)} className="grid flex-1 place-items-center disabled:opacity-40"><ChevronRight className="size-3.5" /></button></div>
          <span style={chip(a.category)} className="rounded-[2px] px-[5px] py-px text-[8.5px] font-semibold leading-[11px] text-primary-foreground opacity-90">{nice(a.category)}</span>
          <h3 className="text-[13.5px] font-normal">{a.title}</h3></div>}
        {cur === "details" || !a ? <Editor key={aid} courseId={courseId} a={a} onSaved={(id) => go({ aid: id })} onDeleted={() => go({})} /> : <StudentList a={a} roster={roster} />}
      </div>
    );
  }
  return (
    <div className="px-4 py-4 pl-[15px]">
      <div className="mb-2 flex justify-between"><span className="text-[12px] text-muted-foreground">{list.length} assignments</span>
        <button onClick={() => go({ aid: "new" })} className="flex h-8 items-center gap-1 bg-vc-success px-3 text-[13px] font-semibold text-primary-foreground"><Plus className="size-4" />Add Assignment</button></div>
      <table className="w-full text-[13px]">
        <thead><tr className="border-b-2 border-foreground/70 text-left text-[11px] uppercase text-muted-foreground"><th className="py-1.5">Due</th><th>Description</th><th>Type</th><th className="text-right">Max</th><th className="text-right">Graded</th><th className="text-right">Portal</th></tr></thead>
        <tbody>{[...list].reverse().map((a) => { const g = roster.filter((s) => scoreOf(scores, a, s.id) !== undefined).length; return (
          <tr key={a.id} className="border-b border-vc-line hover:bg-vc-panel">
            <td className="py-1.5">{format(a.due, "EEE M/d")}</td>
            <td><Link to="/teacher/class/$classId" params={{ classId: courseId }} search={{ tab: "assignments", aid: a.id }} className="text-vc-link-strong hover:underline">{a.title}</Link>{a.custom && <span className="ml-1.5 text-[10px] text-muted-foreground">EDITED</span>}</td>
            <td><span style={chip(a.category)} className="px-1.5 py-px text-[10px] font-semibold text-primary-foreground">{a.category}</span></td>
            <td className="text-right">{a.points}</td><td className="text-right">{g}/{roster.length}</td><td className="text-right"><PortalFlag id={a.id} /></td>
          </tr>); })}</tbody>
      </table>
    </div>
  );
}

function PortalFlag({ id }: { id: string }) {
  const { custom } = useSchool();
  const c = custom.find((x) => x.id === id);
  return c && !c.published ? <span className="text-muted-foreground">Hidden</span> : <span className="text-vc-success">Shown</span>;
}

const box = "h-[28px] w-full rounded-[3px] border border-[#e1e4e8] bg-background px-2.5 text-[11.5px] text-foreground/85 outline-none focus:border-[#4fb3e6]";
function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`mb-[13px] ${className}`}><div className="mb-[3px] text-[9.5px] uppercase leading-[12px] text-[#9aa0a6]">{label}</div>{children}</div>;
}

/** Small rich-text box: bold / italic / underline, lists, indent and alignment. */
function RichText({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const cmd = (c: string) => (e: React.MouseEvent) => { e.preventDefault(); document.execCommand(c); onChange(ref.current?.innerHTML ?? ""); };
  const tools = [["bold", Bold], ["italic", Italic], ["underline", Underline], ["insertUnorderedList", List], ["insertOrderedList", ListOrdered], ["outdent", IndentDecrease], ["indent", IndentIncrease], ["justifyLeft", AlignLeft]] as const;
  return (
    <div className="rounded-[3px] border border-[#ececec] focus-within:border-[#4fb3e6]">
      <div className="flex h-[29px] items-center gap-[3px] border-b border-[#e6e6e6] px-[6px] shadow-[0_1px_0_#f1f1f1]">{tools.map(([c, I]) => <button key={c} type="button" title={c} aria-label={c} onMouseDown={cmd(c)} className="grid h-[24px] w-[27px] place-items-center rounded-[2px] text-[#555] hover:bg-[#ececec]"><I className="size-[11px]" strokeWidth={2.5} /></button>)}</div>
      <div ref={ref} role="textbox" aria-multiline aria-label={label} contentEditable suppressContentEditableWarning onInput={(e) => onChange(e.currentTarget.innerHTML)} className="h-[160px] overflow-y-auto px-[7px] py-[6px] text-[11px] leading-[15px] outline-none [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc" />
    </div>
  );
}

function DatePick({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const d = value ? parseISO(value) : undefined;
  return (
    <Popover><PopoverTrigger asChild><button type="button" aria-label={label} className={`${box} flex items-center justify-between text-left text-[#9aa0a6]`}>{d ? format(d, "MMMM d, yyyy") : "Select date"}<CalendarDays className="size-3 text-[#555]" fill="currentColor" /></button></PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[246px] rounded-[3px] border-[#f0f0f0] p-2 shadow-[0_2px_14px_rgba(0,0,0,.12)] [--cell-size:28px] [&_[data-selected-single=true]]:!rounded-[2px] [&_[data-selected-single=true]]:!bg-[#2f6fc4] [&_button]:text-[11px]"><Calendar mode="single" selected={d} defaultMonth={d} onSelect={(x) => x && onChange(isoDay(x))} /></PopoverContent></Popover>
  );
}

/** Square switch: [blue | white] when on, [white | gray] when off. */
function Toggle({ label, on, set, bare }: { label: string; on: boolean; set: (v: boolean) => void; bare?: boolean }) {
  return (
    <div className={bare ? "" : "mb-[10px]"}>
      {!bare && <div className="mb-[3px] text-[9.5px] uppercase leading-[12px] text-[#9aa0a6]">{label}</div>}
      <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => set(!on)} className="flex h-[26px] w-[46px] overflow-hidden rounded-[3px] border border-[#d4d8dd]">
        <span className={`flex-1 ${on ? "bg-[#5aaaf2]" : "bg-background"}`} /><span className={`flex-1 ${on ? "bg-background" : "bg-[#b4b4b4]"}`} />
      </button>
    </div>
  );
}

function Editor({ courseId, a, onSaved, onDeleted }: { courseId: string; a: Assignment | undefined; onSaved: (id: string) => void; onDeleted: () => void }) {
  const { custom, update, assignmentTypes } = useSchool();
  const mine = useMySections();
  const existing = a ? custom.find((x) => x.id === a.id) : undefined;
  const [f, setF] = useState<CustomAssignment>(existing ?? {
    id: a?.id ?? `c-${crypto.randomUUID().slice(0, 8)}`, courseId, title: a?.title ?? "", category: a?.category ?? "HOMEWORK",
    assigned: isoDay(a?.assigned ?? today()), due: isoDay(a?.due ?? today()), points: a?.points ?? 100, details: "", notes: a?.notes ?? "",
    // Scores stay hidden until the teacher turns "Display on Portals" on (or uses the eye in the gradebook).
    published: a ? true : false, inCalc: true, extraCredit: false, allSections: false, method: "Points", weight: 100,
  });
  const typeRows = assignmentTypes.filter((t) => !t.obsolete).sort((x, y) => x.sortKey - y.sortKey).map((t) => ({ key: t.description.toUpperCase(), label: t.description }));
  const types = typeRows.some((t) => t.key === f.category) ? typeRows : [...typeRows, { key: f.category as string, label: f.category.charAt(0) + f.category.slice(1).toLowerCase() }];
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Check the form"); return; }
    // "Applies to All Sections": same course, same term and year, and also taught by this teacher.
    const here = mine.find((s) => s.id === courseId);
    const sibs = f.allSections && here ? mine.filter((s) => s.id !== here.id && s.courseNo === here.courseNo && s.terms.some((t) => here.terms.includes(t)) && s.teacherIds.some((t) => here.teacherIds.includes(t))) : [];
    update((s) => ({ ...s, custom: [...s.custom.filter((x) => x.id !== f.id && x.linkId !== f.id), { ...f, title: f.title.trim() },
      ...sibs.map((sec) => ({ ...f, id: `${f.id}~${sec.id}`, courseId: sec.id, linkId: f.id, title: f.title.trim() }))] }));
    toast.success(sibs.length ? `Assignment saved to this and ${sibs.length} other section${sibs.length === 1 ? "" : "s"}` : "Assignment saved"); onSaved(f.id);
  };
  const del = () => {
    update((s) => ({ ...s, custom: s.custom.filter((x) => x.id !== f.id && x.linkId !== f.id) }));
    toast(a && !a.id.startsWith("c-") ? "Edits reverted" : "Assignment deleted"); onDeleted();
  };
  return (
    <form onSubmit={save} className="px-[13px] pb-8 pt-[14px]">
      {existing && <div className="mb-4 flex flex-wrap items-center gap-6 text-[11px]">
        <button type="button" onClick={() => toast("Attachments aren't available in this version yet.")} className="flex h-[26px] items-center gap-1.5 rounded-[3px] bg-[#e8ecf0] px-3 font-medium"><Paperclip className="size-3" />Attach Files</button>
        <button type="button" onClick={del} className="h-[26px] rounded-[3px] border border-[#e0645c] px-3 font-medium text-[#d9453d] hover:bg-[#fbe9e9]">Delete Assignment</button></div>}
      <div className="grid gap-x-[13px] lg:grid-cols-[minmax(0,479px)_minmax(0,479px)]">
        <div>
          <F label="Description"><input aria-label="Description" className={`${box} h-[27px]`} value={f.title} maxLength={120} onChange={(e) => setF({ ...f, title: e.target.value })} /></F>
          <F label="Assignment Details"><RichText label="Assignment Details" value={f.details} onChange={(v) => setF({ ...f, details: v })} /></F>
          <F label="Teacher Notes (Internal)"><RichText label="Teacher Notes" value={f.notes} onChange={(v) => setF({ ...f, notes: v })} /></F>
        </div>
        <div>
          <F label="Assignment Type"><VcSelect aria-label="Assignment Type" className={`${box} h-[27px] text-[#8a8f94]`} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Category })}>{types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</VcSelect></F>
          <div className="grid grid-cols-2 gap-[12px]">
            <F label="Date Assigned"><DatePick label="Date Assigned" value={f.assigned} onChange={(v) => setF({ ...f, assigned: v, due: v > f.due ? v : f.due })} /></F>
            <F label="Due Date"><DatePick label="Due Date" value={f.due} onChange={(v) => setF({ ...f, due: v })} /></F></div>
          <div className="grid grid-cols-2 gap-[12px]">
            <F label="Grading Method"><VcSelect aria-label="Grading Method" className={`${box} text-[#8a8f94]`} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>{["Points", "Letter"].map((m) => <option key={m}>{m}</option>)}</VcSelect></F>
            <F label="Max Score"><input aria-label="Max Score" className={box} inputMode="numeric" value={String(f.points)} onChange={(e) => /^\d{0,4}$/.test(e.target.value) && setF({ ...f, points: Number(e.target.value) })} /></F></div>
          <div className="grid grid-cols-2 gap-[12px]">
            <F label="Weight"><input aria-label="Weight" className={box} inputMode="decimal" value={String(f.weight ?? 100)} onChange={(e) => /^\d{0,3}(\.\d?)?$/.test(e.target.value) && setF({ ...f, weight: Number(e.target.value) })} /></F></div>
          <div className="grid grid-cols-2 gap-x-[12px]">
            <Toggle label="Include in Calc. Grade?" on={f.inCalc} set={(v) => setF({ ...f, inCalc: v })} />
            <Toggle label="Extra Credit" on={f.extraCredit} set={(v) => setF({ ...f, extraCredit: v })} />
            <Toggle label="Applies to All Sections?" on={f.allSections} set={(v) => setF({ ...f, allSections: v })} />
            <Toggle label="Display on Portals?" on={f.published} set={(v) => setF({ ...f, published: v })} /></div>
          <button className="mt-[4px] h-[34px] w-[126px] rounded-[4px] bg-[#5cb360] text-[11.5px] font-medium text-primary-foreground shadow-[0_1px_3px_rgba(0,0,0,.2)] hover:brightness-105">Save Assignment</button>
        </div>
      </div>
    </form>
  );
}

const DROPBOX = ["Closed", "Expecting", "Received"] as const;
const dot: Record<string, string> = { Expecting: "#f2a33a", Received: "#4caf7a" };
const sel = "h-[28px] w-[136px] cursor-pointer rounded-[3px] border border-[#dcdcdc] bg-background px-2 text-[11px] font-semibold text-foreground/80 shadow-[0_1px_2px_rgba(0,0,0,.08)] outline-none";
const grey = "text-[#b9b9b9]";

function StudentList({ a, roster }: { a: Assignment; roster: Student[] }) {
  const { scores, aStatus, pub, comments, user, update } = useSchool();
  const set = (field: "scores" | "aStatus" | "comments", k: string, v: string) => update((s) => ({ ...s, [field]: { ...s[field], [k]: v } }));
  const [picked, setPicked] = useState<string[]>([]);
  const [fb, setFb] = useState<{ sid: string; text: string } | null>(null);
  const [bulk, setBulk] = useState<{ open: boolean; grade?: string | undefined; status?: string | undefined; dropbox?: string | undefined }>({ open: false });
  const rows = [...roster].sort((x, y) => `${x.last}${x.first}`.localeCompare(`${y.last}${y.first}`));
  const applyBulk = () => {
    if (bulk.grade !== undefined && bulk.grade !== "" && !isScoreInput(bulk.grade)) { toast.error("Grade must be a number"); return; }
    const who = picked.length ? picked : rows.map((s) => s.id);
    update((x) => {
      const n = { ...x, scores: { ...x.scores }, aStatus: { ...x.aStatus }, comments: { ...x.comments } };
      for (const sid of who) { const k = scoreKey(a.id, sid); if (bulk.grade !== undefined && bulk.grade !== "") n.scores[k] = bulk.grade; if (bulk.status !== undefined) n.aStatus[k] = bulk.status; if (bulk.dropbox !== undefined) n.comments[`d|${k}`] = bulk.dropbox; }
      return n;
    });
    toast.success(`Updated ${who.length} student${who.length === 1 ? "" : "s"}`); setBulk({ open: false });
  };
  const fbStudent = fb ? roster.find((s) => s.id === fb.sid) : undefined;
  const fbKey = fb ? scoreKey(a.id, fb.sid) : "";
  const cb = (on: boolean, f: (v: boolean) => void) => <button type="button" role="checkbox" aria-checked={on} onClick={() => f(!on)} className={`mt-[14px] grid size-[22px] shrink-0 place-items-center rounded-[4px] border ${on ? "border-[#4a9be0] bg-[#4a9be0] text-primary-foreground" : "border-[#d9d9d9] bg-background"}`}>{on && <Check className="size-3.5" strokeWidth={3.5} />}</button>;
  const lbl = "mb-[3px] text-[9.5px] uppercase text-[#b0b0b0]";
  const cols = "flex items-center";
  return (
    <div className="relative">
      <div className="absolute right-[22px] top-[-34px] z-30"><button type="button" onClick={() => setBulk({ ...bulk, open: !bulk.open })} className="h-[23px] w-[62px] rounded-[4px] border border-[#555] bg-background text-[11px] font-bold">Bulk Edit</button></div>
      {bulk.open && <div className="absolute right-[22px] top-[-6px] z-30 w-[198px] rounded-[4px] bg-background px-[14px] pb-[14px] pt-[6px] shadow-[0_2px_14px_rgba(0,0,0,.18)]">
        <div className="flex gap-3"><div>{cb(bulk.grade !== undefined, (v) => setBulk({ ...bulk, grade: v ? "" : undefined }))}</div><div className="flex-1"><div className={lbl + " mt-[2px]"}>Grade</div><input aria-label="Bulk grade" disabled={bulk.grade === undefined} className="h-[28px] w-[40px] rounded-[3px] border border-[#e1e4e8] bg-[#f6f6f6] text-center text-[11px] outline-none disabled:opacity-60" value={bulk.grade ?? ""} onChange={(e) => setBulk({ ...bulk, grade: e.target.value })} /></div></div>
        <div className="flex gap-3"><div>{cb(bulk.status !== undefined, (v) => setBulk({ ...bulk, status: v ? "" : undefined }))}</div><div className="flex-1"><div className={lbl + " mt-[8px]"}>Completion Status</div><VcSelect aria-label="Bulk completion status" disabled={bulk.status === undefined} className={`${sel} !w-full disabled:bg-[#f2f2f2] disabled:text-[#bbb]`} value={bulk.status ?? ""} onChange={(e) => setBulk({ ...bulk, status: e.target.value })}>{STATUSES.map((x) => <option key={x} value={x}>{x || "Pending"}</option>)}</VcSelect></div></div>
        <div className="flex gap-3"><div>{cb(bulk.dropbox !== undefined, (v) => setBulk({ ...bulk, dropbox: v ? "Closed" : undefined }))}</div><div className="flex-1"><div className={lbl + " mt-[8px]"}>Dropbox Status</div><VcSelect aria-label="Bulk dropbox status" disabled={bulk.dropbox === undefined} className={`${sel} !w-full disabled:bg-[#f2f2f2] disabled:text-[#bbb]`} value={bulk.dropbox ?? "Closed"} onChange={(e) => setBulk({ ...bulk, dropbox: e.target.value })}>{DROPBOX.map((x) => <option key={x}>{x}</option>)}</VcSelect></div></div>
        <button type="button" onClick={applyBulk} className="mt-[16px] h-[30px] w-full rounded-[4px] bg-[#5cb360] text-[11px] font-medium text-primary-foreground">Update Students</button>
      </div>}
      <div className={`${cols} border-b border-[#f0f0f0] pb-[10px] pl-[44px] pt-[34px] text-[11px] text-[#a5a5a5]`}>
        <span className="w-[130px] shrink-0" /><span className="w-[87px] shrink-0">Grade</span><span className="w-[160px] shrink-0">Assignment Status</span><span className="w-[160px] shrink-0">Dropbox Status</span><span className="w-[149px] shrink-0" /><span>Published?</span></div>
      <div className="max-h-[calc(100vh-290px)] min-h-[280px] overflow-y-auto">
      {rows.map((s) => {
        const k = scoreKey(a.id, s.id); const v = k in scores ? scores[k]! : String(scoreOf(scores, a, s.id) ?? "");
        const locked = comments[`l|${k}`] === "1"; const email = ""; const has = !!comments[`a|${k}`]; const drop = comments[`d|${k}`] ?? "Closed"; void email;
        return (
          <div key={s.id} className={`${cols} h-[62px] border-b border-[#f0f0f0] pl-[37px]`}>
            <div className="flex w-[130px] shrink-0 items-center gap-[9px]"><PersonPhoto personId={s.id} className="size-[38px] shrink-0 rounded-full" /><div className="min-w-0 leading-[15px]"><div className="truncate text-[13px] font-bold">{s.first}</div><div className="truncate text-[13px] text-[#8c8c8c]">{s.last}</div></div></div>
            <div className="flex w-[87px] shrink-0 items-center gap-[5px]"><input aria-label={`Score for ${s.first}`} disabled={locked} className="h-[27px] w-[38px] rounded-[3px] border border-[#e1e4e8] bg-background text-center text-[11px] outline-none focus:border-[#4fb3e6] disabled:bg-[#f2f2f2]" value={v} onChange={(e) => isScoreInput(e.target.value) && set("scores", k, e.target.value)} /><span className="text-[10.5px] text-[#a5a5a5]">/{a.points}</span></div>
            <div className="w-[160px] shrink-0"><VcSelect aria-label={`Assignment status for ${s.first}`} className={sel} value={aStatus[k] ?? ""} onChange={(e) => set("aStatus", k, e.target.value)}>{STATUSES.map((x) => <option key={x} value={x}>{x || "Pending"}</option>)}</VcSelect></div>
            <div className="relative w-[160px] shrink-0">{dot[drop] && <span className="pointer-events-none absolute left-[9px] top-[11px] size-[6px] rounded-full" style={{ background: dot[drop] }} />}<VcSelect aria-label={`Dropbox status for ${s.first}`} className={`${sel} ${dot[drop] ? "pl-[19px]" : ""}`} value={drop} onChange={(e) => set("comments", `d|${k}`, e.target.value)}>{DROPBOX.map((x) => <option key={x}>{x}</option>)}</VcSelect></div>
            <button type="button" title="Feedback" aria-label={`Feedback for ${s.first}`} onClick={() => setFb({ sid: s.id, text: "" })} className={`grid w-[51px] shrink-0 place-items-start ${fb?.sid === s.id ? "text-[#444]" : grey}`}><MessageCircleMore className="size-[23px]" fill="currentColor" strokeWidth={0} /></button>
            <button type="button" title={locked ? "Unlock grade" : "Lock grade"} aria-pressed={locked} onClick={() => set("comments", `l|${k}`, locked ? "" : "1")} className={`grid w-[47px] shrink-0 place-items-start ${locked ? "text-[#555]" : grey}`}><span className={`grid size-[19px] place-items-center rounded-[3px] bg-current`}><Lock className="size-[11px] text-background" strokeWidth={3} /></span></button>
            <span className={`grid w-[51px] shrink-0 place-items-start ${grey}`}><Mail className="size-[24px]" fill="currentColor" stroke="white" strokeWidth={1.5} /></span>
            <Toggle bare label={`Published for ${s.first}`} on={pub[k] !== false} set={(on) => update((x) => ({ ...x, pub: { ...x.pub, [k]: on } }))} />
          </div>); })}
      </div>
      {fb && fbStudent && <aside className="absolute inset-y-0 right-0 z-40 flex w-[494px] max-w-full flex-col bg-background shadow-[-3px_0_10px_rgba(0,0,0,.12)]" style={{ top: -47 }}>
        <div className="flex h-[36px] items-center justify-between bg-[#5d5d5d] px-[8px] text-primary-foreground"><span className="text-[13px] font-medium">{fbStudent.first} {fbStudent.last}</span><button type="button" aria-label="Close feedback" onClick={() => setFb(null)}><X className="size-4" strokeWidth={3} /></button></div>
        <div className="grid h-[36px] grid-cols-3 text-center text-[11px]"><span className="relative grid place-items-center text-[#4fb3e6]">Feedback<i className="absolute bottom-0 h-[2px] w-[52px] bg-[#4fb3e6]" /></span></div>
        <div className="flex-1 overflow-y-auto px-[24px] pt-[14px]">
          {comments[`s|${fbKey}`] && <div className="flex gap-2.5"><PersonPhoto personId={fbStudent.id} className="size-[26px] rounded-full" /><div><div className="text-[12px] font-bold">{fbStudent.first} {fbStudent.last}</div><div className="mb-3 text-[10px] text-[#b0b0b0]">Commented</div><div className="border-l border-[#e6e6e6] pl-3 text-[11.5px]">{comments[`s|${fbKey}`]}</div></div></div>}
          {comments[`a|${fbKey}`] && <div className="mt-3 flex gap-2.5"><PersonPhoto personId={user?.personId} className="size-[26px] rounded-full" /><div><div className="text-[12px] font-bold">{user?.first} {user?.last}</div><div className="border-l border-[#e6e6e6] pl-3 text-[11.5px]">{comments[`a|${fbKey}`]}</div></div></div>}
          {!comments[`s|${fbKey}`] && !comments[`a|${fbKey}`] && <p className="pt-10 text-center text-[11px] text-[#b0b0b0]">No feedback yet.</p>}
        </div>
        <form className="flex gap-2.5 px-[18px] pb-[14px]" onSubmit={(e) => { e.preventDefault(); if (!fb.text.trim()) return; set("comments", `a|${fbKey}`, fb.text.trim()); setFb({ ...fb, text: "" }); toast.success("Feedback posted"); }}>
          <PersonPhoto personId={user?.personId} className="mt-1 size-[26px] shrink-0 rounded-full" />
          <div className="flex-1 rounded-[3px] border border-[#ececec]"><input aria-label="Give Feedback" placeholder="Give Feedback…" maxLength={300} className="h-[34px] w-full px-3 text-[11.5px] outline-none placeholder:text-[#b0b0b0]" value={fb.text} onChange={(e) => setFb({ ...fb, text: e.target.value })} />
            <div className="flex items-center justify-between border-t border-[#f3f3f3] px-2 py-1.5"><Paperclip className="size-3.5 text-[#b0b0b0]" /><button className={`h-[22px] rounded-[3px] px-3 text-[10.5px] font-medium text-primary-foreground ${fb.text.trim() ? "bg-[#4a9be0]" : "bg-[#bcdaf6]"}`}>Post</button></div></div>
        </form>
      </aside>}
    </div>
  );
}
