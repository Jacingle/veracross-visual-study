import { PersonPhoto } from "@/components/common/PersonPhoto";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Lock, Mail, MessageSquare, Paperclip, Plus, Unlock, X } from "lucide-react";
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
    const arrow = "grid size-[34px] place-items-center rounded-[6px] bg-[#e8ecf0] text-foreground/70 disabled:opacity-40";
    return (
      <div className="-mx-4 -my-4 -ml-[48px]">
        <div className="flex flex-wrap items-center gap-3 border-b border-vc-line pb-0 pl-[48px] pr-5 pt-4">
          <Link to="/teacher/class/$classId" params={{ classId: courseId }} search={{ tab: "gradebook" }} className="mb-3 flex h-[42px] items-center gap-2.5 rounded-[8px] bg-[#4a4a4a] px-4 text-[15px] font-medium text-primary-foreground hover:brightness-110"><span className="grid size-5 place-items-center rounded-full bg-primary-foreground text-[#4a4a4a]"><ChevronLeft className="size-3.5" strokeWidth={3} /></span>Back to Scores</Link>
          {([["details", "Assignment Info"], ["students", "Students"]] as const).map(([k, label]) => (
            <button key={k} type="button" disabled={!a && k === "students"} onClick={() => go({ aid, sub: k })} className={`border-b-[3px] px-4 pb-[13px] pt-[10px] text-[15px] disabled:opacity-40 ${cur === k ? "border-[#4a9be0] text-[#4a9be0]" : "border-transparent text-foreground/70"}`}>{label}</button>))}
        </div>
        {a && <div className="flex flex-wrap items-center gap-3 px-6 pb-1 pt-5">
          <button type="button" aria-label="Previous assignment" disabled={i <= 0} onClick={() => step(-1)} className={arrow}><ChevronLeft className="size-5" /></button>
          <button type="button" aria-label="Next assignment" disabled={i < 0 || i >= list.length - 1} onClick={() => step(1)} className={arrow}><ChevronRight className="size-5" /></button>
          <span style={chip(a.category)} className="rounded-[4px] px-2 py-0.5 text-[12px] font-semibold uppercase text-primary-foreground">{a.category}</span>
          <h3 className="text-[22px] font-medium">{a.title}</h3>
        </div>}
        {cur === "details" || !a ? <Editor key={aid} courseId={courseId} a={a} onSaved={(id) => go({ aid: id })} onDeleted={() => go({})} /> : <StudentList a={a} roster={roster} />}
      </div>
    );
  }
  return (
    <div>
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

const box = "h-[42px] w-full rounded-[6px] border border-[#d5d9de] bg-background px-3 text-[15px] outline-none focus:border-[#4a9be0]";
function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`mb-5 ${className}`}><div className="mb-1.5 text-[14px] font-semibold text-foreground/80">{label}</div>{children}</div>;
}

/** Small rich-text box: bold / italic / underline, lists, indent and alignment. */
function RichText({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const cmd = (c: string) => (e: React.MouseEvent) => { e.preventDefault(); document.execCommand(c); onChange(ref.current?.innerHTML ?? ""); };
  const tools: [string, string, string][] = [["bold", "B", "font-bold"], ["italic", "I", "italic"], ["underline", "U", "underline"], ["insertUnorderedList", "•≡", ""], ["insertOrderedList", "1≡", ""], ["outdent", "⇤", ""], ["indent", "⇥", ""], ["justifyLeft", "⯇", ""], ["justifyCenter", "≡", ""], ["justifyRight", "⯈", ""]];
  return (
    <div className="rounded-[6px] border border-[#d5d9de] focus-within:border-[#4a9be0]">
      <div className="flex flex-wrap gap-0.5 border-b border-[#d5d9de] bg-[#f6f7f9] p-1">{tools.map(([c, l, s]) => <button key={c} type="button" title={c} onMouseDown={cmd(c)} className={`h-7 min-w-7 rounded px-1.5 text-[13px] hover:bg-[#e4e8ec] ${s}`}>{l}</button>)}</div>
      <div ref={ref} role="textbox" aria-multiline aria-label={label} contentEditable suppressContentEditableWarning onInput={(e) => onChange(e.currentTarget.innerHTML)} className="min-h-[120px] px-3 py-2 text-[15px] outline-none [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc" />
    </div>
  );
}

function DatePick({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const d = value ? parseISO(value) : undefined;
  return (
    <Popover><PopoverTrigger asChild><button type="button" aria-label={label} className={`${box} flex items-center justify-between text-left`}>{d ? format(d, "MMMM d, yyyy") : "Select date"}<CalendarDays className="size-4 text-foreground/50" /></button></PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2 [&_[data-selected-single=true]]:!bg-[#4a9be0]"><Calendar mode="single" selected={d} defaultMonth={d} onSelect={(x) => x && onChange(isoDay(x))} /></PopoverContent></Popover>
  );
}

function Toggle({ label, on, set, bare }: { label: string; on: boolean; set: (v: boolean) => void; bare?: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-[15px] ${bare ? "" : "mb-3"}`}>
      <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => set(!on)} className={`relative h-[26px] w-[48px] rounded-full transition-colors ${on ? "bg-[#4a9be0]" : "bg-[#c9ced4]"}`}><span className={`absolute top-[3px] size-5 rounded-full bg-background shadow transition-all ${on ? "left-[25px]" : "left-[3px]"}`} /></button>
      {!bare && <span className="text-foreground/80">{label}</span>}
    </div>
  );
}

function Editor({ courseId, a, onSaved, onDeleted }: { courseId: string; a: Assignment | undefined; onSaved: (id: string) => void; onDeleted: () => void }) {
  const { custom, update, assignmentTypes } = useSchool();
  const mine = useMySections();
  const existing = a ? custom.find((x) => x.id === a.id) : undefined;
  const [f, setF] = useState<CustomAssignment>(existing ?? {
    id: a?.id ?? `c-${crypto.randomUUID().slice(0, 8)}`, courseId, title: a?.title ?? "", category: a?.category ?? "HOMEWORK",
    assigned: isoDay(a?.assigned ?? today()), due: isoDay(a?.due ?? today()), points: a?.points ?? 10, details: "", notes: a?.notes ?? "",
    // Scores stay hidden until the teacher turns "Display on Portals" on (or uses the eye in the gradebook).
    published: a ? true : false, inCalc: true, extraCredit: false, allSections: false, method: "Points", weight: 10,
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
  const sum = (k: string, v: string) => <div><div className="text-[12px] text-vc-gray">{k}</div><div className="text-[18px] font-medium">{v}</div></div>;
  return (
    <form onSubmit={save} className="px-6 pb-8 pt-5">
      {existing && <div className="mb-6 flex flex-wrap items-center gap-10">
        {sum("Max Score", String(f.points))}{sum("Weight", String(f.weight ?? 10))}{sum("Display", f.published ? "ON" : "OFF")}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => toast("Attachments aren't available in this version yet.")} className="flex h-[40px] items-center gap-2 rounded-[6px] bg-[#e8ecf0] px-4 text-[14px] font-medium"><Paperclip className="size-4" />Attach Files</button>
          <button type="button" onClick={del} className="h-[40px] rounded-[6px] border border-[#e0645c] px-4 text-[14px] font-medium text-[#d9453d] hover:bg-[#fbe9e9]">Delete Assignment</button></div></div>}
      <div className="grid gap-x-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <F label="Description"><input aria-label="Description" className={box} value={f.title} maxLength={120} onChange={(e) => setF({ ...f, title: e.target.value })} /></F>
          <F label="Assignment Details"><RichText label="Assignment Details" value={f.details} onChange={(v) => setF({ ...f, details: v })} /></F>
          <F label="Teacher Notes (Internal)"><RichText label="Teacher Notes" value={f.notes} onChange={(v) => setF({ ...f, notes: v })} /></F>
        </div>
        <div>
          <F label="Assignment Type"><select aria-label="Assignment Type" className={box} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Category })}>{types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Date Assigned"><DatePick label="Date Assigned" value={f.assigned} onChange={(v) => setF({ ...f, assigned: v, due: v > f.due ? v : f.due })} /></F>
            <F label="Due Date"><DatePick label="Due Date" value={f.due} onChange={(v) => setF({ ...f, due: v })} /></F></div>
          <F label="Grading Method"><select aria-label="Grading Method" className={box} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>{["Points", "Letter Grade", "Pass/Fail", "Completion"].map((m) => <option key={m}>{m}</option>)}</select></F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Max Score"><input aria-label="Max Score" className={box} inputMode="numeric" value={String(f.points)} onChange={(e) => /^\d{0,4}$/.test(e.target.value) && setF({ ...f, points: Number(e.target.value) })} /></F>
            <F label="Weight"><input aria-label="Weight" className={box} inputMode="decimal" value={String(f.weight ?? 10)} onChange={(e) => /^\d{0,3}(\.\d?)?$/.test(e.target.value) && setF({ ...f, weight: Number(e.target.value) })} /></F></div>
          <Toggle label="Include in Calc. Grade?" on={f.inCalc} set={(v) => setF({ ...f, inCalc: v })} />
          <Toggle label="Extra Credit" on={f.extraCredit} set={(v) => setF({ ...f, extraCredit: v })} />
          <Toggle label="Applies to All Sections?" on={f.allSections} set={(v) => setF({ ...f, allSections: v })} />
          <Toggle label="Display on Portals?" on={f.published} set={(v) => setF({ ...f, published: v })} />
        </div>
      </div>
      <div className="mt-2"><button className="h-[44px] rounded-[6px] bg-[#4caf50] px-6 text-[15px] font-semibold text-primary-foreground hover:brightness-105">Save Assignment</button></div>
    </form>
  );
}

const sel = "h-[40px] w-full rounded-[6px] border border-[#d5d9de] bg-background px-2.5 text-[14px] outline-none focus:border-[#4a9be0]";
const iconBtn = "grid size-[34px] place-items-center rounded-full text-foreground/55 hover:bg-[#eef1f4]";

function StudentList({ a, roster }: { a: Assignment; roster: Student[] }) {
  const { scores, aStatus, pub, comments, users, update } = useSchool();
  const set = (field: "scores" | "aStatus" | "comments", k: string, v: string) => update((s) => ({ ...s, [field]: { ...s[field], [k]: v } }));
  const [picked, setPicked] = useState<string[]>([]);
  const [fb, setFb] = useState<{ sid: string; text: string } | null>(null);
  const [bulk, setBulk] = useState<{ open: boolean; grade?: string | undefined; status?: string | undefined; dropbox?: boolean | undefined }>({ open: false });
  const rows = [...roster].sort((x, y) => `${x.last}${x.first}`.localeCompare(`${y.last}${y.first}`));
  const applyBulk = () => {
    if (!picked.length) { toast.error("Select one or more students first."); return; }
    if (bulk.grade !== undefined && !isScoreInput(bulk.grade)) { toast.error("Grade must be a number"); return; }
    update((x) => {
      const n = { ...x, scores: { ...x.scores }, aStatus: { ...x.aStatus } };
      for (const sid of picked) { const k = scoreKey(a.id, sid); if (bulk.grade !== undefined) n.scores[k] = bulk.grade; if (bulk.status !== undefined) n.aStatus[k] = bulk.status; }
      return n;
    });
    toast.success(`Updated ${picked.length} student${picked.length === 1 ? "" : "s"}`); setBulk({ open: false });
  };
  const fbStudent = fb ? roster.find((s) => s.id === fb.sid) : undefined;
  const fbKey = fb ? scoreKey(a.id, fb.sid) : "";
  const cb = (on: boolean, f: (v: boolean) => void, label: string) => <label className="mb-3 block text-[13px] font-semibold uppercase tracking-wide text-foreground/70"><input type="checkbox" className="mr-2 size-4 align-[-3px]" checked={on} onChange={(e) => f(e.target.checked)} />{label}</label>;
  return (
    <div className="relative px-6 pb-8 pt-4">
      <div className="mb-3 flex items-center justify-end gap-2">
        <button type="button" onClick={() => setBulk({ ...bulk, open: !bulk.open })} className="h-[40px] rounded-[6px] border border-[#d5d9de] px-4 text-[14px] font-medium hover:bg-[#f4f6f8]">Bulk Edit</button></div>
      {bulk.open && <div className="absolute right-6 top-[58px] z-20 w-[280px] rounded-[8px] border border-vc-line bg-background p-4 shadow-xl">
        {cb(bulk.grade !== undefined, (v) => setBulk({ ...bulk, grade: v ? "" : undefined }), "Grade")}
        {bulk.grade !== undefined && <input aria-label="Bulk grade" className={`${sel} -mt-1 mb-3`} value={bulk.grade} onChange={(e) => setBulk({ ...bulk, grade: e.target.value })} />}
        {cb(bulk.status !== undefined, (v) => setBulk({ ...bulk, status: v ? "" : undefined }), "Completion Status")}
        {bulk.status !== undefined && <select aria-label="Bulk completion status" className={`${sel} -mt-1 mb-3`} value={bulk.status} onChange={(e) => setBulk({ ...bulk, status: e.target.value })}>{STATUSES.map((x) => <option key={x} value={x}>{x || "Pending"}</option>)}</select>}
        {/* Dropbox status is not wired up yet; the option is kept so the layout matches. */}
        {cb(!!bulk.dropbox, (v) => setBulk({ ...bulk, dropbox: v }), "Dropbox Status")}
        <button type="button" onClick={applyBulk} className="mt-1 h-[40px] w-full rounded-[6px] bg-[#4caf50] text-[14px] font-semibold text-primary-foreground">Update {picked.length || ""} Student{picked.length === 1 ? "" : "s"}</button>
      </div>}
      <div className="grid grid-cols-[28px_minmax(150px,1.3fr)_minmax(120px,0.8fr)_minmax(150px,1fr)_minmax(150px,1fr)_auto_90px] items-center gap-x-3 border-b border-vc-line pb-2 text-[12px] font-semibold uppercase text-vc-gray">
        <input type="checkbox" aria-label="Select all students" checked={picked.length === roster.length && roster.length > 0} onChange={(e) => setPicked(e.target.checked ? roster.map((x) => x.id) : [])} />
        <span>Student</span><span>Grade</span><span>Assignment Status</span><span>Dropbox Status</span><span className="w-[110px]" /><span className="text-right">Published?</span></div>
      {rows.map((s) => {
        const k = scoreKey(a.id, s.id); const v = k in scores ? scores[k]! : String(scoreOf(scores, a, s.id) ?? "");
        const locked = comments[`l|${k}`] === "1"; const email = users.find((u) => u.personId === s.id)?.email; const has = !!comments[`a|${k}`];
        return (
          <div key={s.id} className="grid grid-cols-[28px_minmax(150px,1.3fr)_minmax(120px,0.8fr)_minmax(150px,1fr)_minmax(150px,1fr)_auto_90px] items-center gap-x-3 border-b border-vc-line py-3">
            <input type="checkbox" aria-label={`Select ${s.first}`} checked={picked.includes(s.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, s.id] : picked.filter((x) => x !== s.id))} />
            <div className="flex items-center gap-3"><PersonPhoto personId={s.id} className="size-11 rounded-full" /><div className="leading-tight"><div className="text-[15px] font-semibold">{s.first}</div><div className="text-[14px] text-vc-gray">{s.last}</div></div></div>
            <div className="flex items-center gap-2"><input aria-label={`Score for ${s.first}`} disabled={locked} className={`${sel} w-[76px] text-center disabled:bg-[#f1f3f5]`} value={v} placeholder="-" onChange={(e) => isScoreInput(e.target.value) && set("scores", k, e.target.value)} /><span className="text-[14px] text-vc-gray">/{a.points}</span></div>
            <select aria-label={`Assignment status for ${s.first}`} className={sel} value={aStatus[k] ?? ""} onChange={(e) => set("aStatus", k, e.target.value)}>{STATUSES.map((x) => <option key={x} value={x}>{x || "Pending"}</option>)}</select>
            <select aria-label={`Dropbox status for ${s.first}`} disabled className={`${sel} bg-[#f1f3f5] text-vc-gray`}><option>Pending</option></select>
            <div className="flex">
              <button type="button" title="Feedback" aria-label={`Feedback for ${s.first}`} onClick={() => setFb({ sid: s.id, text: "" })} className={`${iconBtn} ${has ? "text-[#4a9be0]" : ""}`}><MessageSquare className="size-[19px]" fill={has ? "currentColor" : "none"} /></button>
              <button type="button" title={locked ? "Unlock grade" : "Lock grade"} aria-pressed={locked} onClick={() => set("comments", `l|${k}`, locked ? "" : "1")} className={`${iconBtn} ${locked ? "text-foreground" : ""}`}>{locked ? <Lock className="size-[19px]" /> : <Unlock className="size-[19px]" />}</button>
              {email ? <a href={`mailto:${email}`} title={`Email ${s.first}`} aria-label={`Email ${s.first}`} className={iconBtn}><Mail className="size-[19px]" /></a> : <span className={`${iconBtn} opacity-40`}><Mail className="size-[19px]" /></span>}</div>
            <div className="flex justify-end"><Toggle bare label={`Published for ${s.first}`} on={pub[k] !== false} set={(on) => update((x) => ({ ...x, pub: { ...x.pub, [k]: on } }))} /></div>
          </div>); })}
      {fb && fbStudent && <aside className="fixed inset-y-0 right-0 z-50 flex w-[380px] max-w-full flex-col border-l border-vc-line bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-vc-line px-5 py-4"><div className="flex items-center gap-3"><PersonPhoto personId={fbStudent.id} className="size-10 rounded-full" /><div className="leading-tight"><div className="text-[16px] font-semibold">{fbStudent.first} {fbStudent.last}</div><div className="text-[13px] text-vc-gray">{a.title}</div></div></div>
          <button type="button" aria-label="Close feedback" onClick={() => setFb(null)} className={iconBtn}><X className="size-5" /></button></div>
        <div className="border-b border-vc-line px-5 py-2 text-[14px] font-semibold text-[#4a9be0]">Feedback</div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div className="rounded-[8px] bg-[#f4f6f8] p-3 text-[13px] text-vc-gray">{comments[`s|${fbKey}`] ? <><div className="mb-1 font-semibold text-foreground">{fbStudent.first}'s comment</div>{comments[`s|${fbKey}`]}</> : "No comment or attachment has been submitted by this student."}</div>
          {comments[`a|${fbKey}`] && <div className="ml-auto max-w-[88%] rounded-[12px] rounded-br-[2px] bg-[#cfe5fb] p-3 text-[14px]">{comments[`a|${fbKey}`]}</div>}
        </div>
        <form className="border-t border-vc-line p-4" onSubmit={(e) => { e.preventDefault(); if (!fb.text.trim()) return; set("comments", `a|${fbKey}`, fb.text.trim()); setFb({ ...fb, text: "" }); toast.success("Feedback posted"); }}>
          <textarea aria-label="Give Feedback" placeholder="Give Feedback…" maxLength={300} className="h-[90px] w-full resize-none rounded-[6px] border border-[#d5d9de] p-3 text-[14px] outline-none focus:border-[#4a9be0]" value={fb.text} onChange={(e) => setFb({ ...fb, text: e.target.value })} />
          <div className="mt-2 flex justify-end"><button className="h-[38px] rounded-[6px] bg-[#4a9be0] px-5 text-[14px] font-semibold text-primary-foreground">Post</button></div></form>
      </aside>}
    </div>
  );
}
