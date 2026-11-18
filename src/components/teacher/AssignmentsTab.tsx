import { Button } from "@/components/ui/button";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { useCategoryStyle } from "@/lib/category-colors";
import { today, type Assignment, type Category, type Student } from "@/lib/sis-data";
import { isScoreInput, scoreKey, scoreOf } from "@/lib/gradebook";
import { isoDay, useSchool, type CustomAssignment } from "@/lib/school-store";

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
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div><button onClick={() => go({})} className="text-[12px] text-vc-link-strong hover:underline">← All assignments</button><h3 className="text-[18px]">{a ? a.title : "New Assignment"}</h3></div>
          {a && <div className="flex text-[13px]">{(["details", "students"] as const).map((k) => (
            <button key={k} onClick={() => go({ aid, sub: k })} className={`border border-vc-line px-3 py-1 ${(sub ?? "details") === k ? "bg-vc-link text-primary-foreground" : ""}`}>{k === "details" ? "Assignment Detail" : "Students"}</button>))}</div>}
        </div>
        {(sub ?? "details") === "details" || !a ? <Editor key={aid} courseId={courseId} a={a} onSaved={(id) => go({ aid: id })} onDeleted={() => go({})} /> : <StudentList a={a} roster={roster} />}
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

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid grid-cols-[170px_minmax(0,1fr)] items-center gap-3 py-1.5 text-[13px]"><span className="text-right text-muted-foreground">{label}</span>{children}</label>;
}

function Editor({ courseId, a, onSaved, onDeleted }: { courseId: string; a: Assignment | undefined; onSaved: (id: string) => void; onDeleted: () => void }) {
  const { custom, update, assignmentTypes } = useSchool();
  const existing = a ? custom.find((x) => x.id === a.id) : undefined;
  const [f, setF] = useState<CustomAssignment>(existing ?? {
    id: a?.id ?? `c-${crypto.randomUUID().slice(0, 8)}`, courseId, title: a?.title ?? "", category: a?.category ?? "HOMEWORK",
    assigned: isoDay(a?.assigned ?? today()), due: isoDay(a?.due ?? today()), points: a?.points ?? 10, details: "", notes: a?.notes ?? "",
    published: true, inCalc: true, extraCredit: false, allSections: false, method: "Points",
  });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Check the form"); return; }
    update((s) => ({ ...s, custom: [...s.custom.filter((x) => x.id !== f.id), { ...f, title: f.title.trim() }] }));
    toast.success("Assignment saved"); onSaved(f.id);
  };
  const sw = (label: string, k: "published" | "inCalc" | "extraCredit" | "allSections") => (
    <div className="grid grid-cols-[170px_minmax(0,1fr)] items-center gap-3 py-1.5 text-[13px]"><span className="text-right text-muted-foreground">{label}</span><Switch checked={f[k]} onCheckedChange={(v) => setF({ ...f, [k]: v })} aria-label={label} /></div>);
  return (
    <form onSubmit={save} className="grid grid-cols-2 gap-x-8 border border-vc-line p-4">
      <div>
        <L label="Description"><input className={inp} value={f.title} maxLength={120} onChange={(e) => setF({ ...f, title: e.target.value })} /></L>
        <L label="Assignment Type"><select className={inp} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Category })}>{[...new Set([...assignmentTypes.filter((t) => !t.obsolete).sort((a, b) => a.sortKey - b.sortKey).map((t) => t.description), f.category])].map((c) => <option key={c}>{c}</option>)}</select></L>
        <L label="Assignment Date"><input type="date" className={inp} value={f.assigned} onChange={(e) => setF({ ...f, assigned: e.target.value })} /></L>
        <L label="Due Date"><input type="date" className={inp} value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></L>
        <L label="Grading Method"><select className={inp} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>{["Points", "Letter Grade", "Pass/Fail", "Completion"].map((m) => <option key={m}>{m}</option>)}</select></L>
        <L label="Max Score"><input className={inp} inputMode="numeric" value={String(f.points)} onChange={(e) => /^\d{0,4}$/.test(e.target.value) && setF({ ...f, points: Number(e.target.value) })} /></L>
      </div>
      <div>
        {sw("Display on Portals", "published")}
        {sw("Include in Calculations", "inCalc")}
        {sw("Extra Credit", "extraCredit")}
        {sw("Apply to All My Sections", "allSections")}
        <L label="Notes (portal)"><textarea className="h-16 w-full border border-vc-line p-2 text-[13px]" maxLength={1000} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></L>
        <L label="Homework Details"><textarea className="h-16 w-full border border-vc-line p-2 text-[13px]" maxLength={2000} value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} /></L>
      </div>
      <div className="col-span-2 mt-3 flex justify-end gap-2 border-t border-vc-line pt-3">
        {existing && <button type="button" onClick={() => { update((s) => ({ ...s, custom: s.custom.filter((x) => x.id !== f.id) })); toast(a && !a.id.startsWith("c-") ? "Edits reverted" : "Assignment deleted"); onDeleted(); }} className="h-8 border border-vc-line px-3 text-[13px] text-destructive">{f.id.startsWith("c-") ? "Delete" : "Revert edits"}</button>}
        <button className="h-8 bg-vc-success px-5 text-[13px] font-semibold text-primary-foreground">Save</button>
      </div>
    </form>
  );
}

function StudentList({ a, roster }: { a: Assignment; roster: Student[] }) {
  const { scores, aStatus, pub, comments, update } = useSchool();
  const set = (field: "scores" | "aStatus" | "comments", k: string, v: string) => update((s) => ({ ...s, [field]: { ...s[field], [k]: v } }));
  const [picked, setPicked] = useState<string[]>([]);
  const [desc, setDesc] = useState(false);
  const [bulk, setBulk] = useState<{ open: boolean; grade?: string | undefined; status?: string | undefined; published?: boolean | undefined }>({ open: false });
  const rows = [...roster].sort((x, y) => (desc ? -1 : 1) * `${x.last}${x.first}`.localeCompare(`${y.last}${y.first}`));
  const applyBulk = () => {
    if (!picked.length) { toast.error("Select one or more students first."); return; }
    if (bulk.grade !== undefined && !isScoreInput(bulk.grade)) { toast.error("Grade must be a number"); return; }
    update((x) => {
      const n = { ...x, scores: { ...x.scores }, aStatus: { ...x.aStatus }, pub: { ...x.pub } };
      for (const sid of picked) { const k = scoreKey(a.id, sid); if (bulk.grade !== undefined) n.scores[k] = bulk.grade; if (bulk.status !== undefined) n.aStatus[k] = bulk.status; if (bulk.published !== undefined) n.pub[k] = bulk.published; }
      return n;
    });
    toast.success(`Updated ${picked.length} student${picked.length === 1 ? "" : "s"}`); setBulk({ open: false });
  };
  return (
    <div className="relative">
      <div className="mb-2 flex justify-end"><Button variant="outline" size="sm" onClick={() => setBulk({ open: !bulk.open })}>Bulk Edit</Button></div>
      {bulk.open && <div className="absolute right-0 top-10 z-20 w-[240px] space-y-3 rounded-sm border border-vc-line bg-background p-3 text-[12px] shadow-lg">
        <label className="block"><input type="checkbox" checked={bulk.grade !== undefined} onChange={(e) => setBulk({ ...bulk, grade: e.target.checked ? "" : undefined })} /> GRADE<input aria-label="Bulk grade" disabled={bulk.grade === undefined} className="mt-1 h-7 w-full border border-vc-line px-1" value={bulk.grade ?? ""} onChange={(e) => setBulk({ ...bulk, grade: e.target.value })} /></label>
        <label className="block"><input type="checkbox" checked={bulk.status !== undefined} onChange={(e) => setBulk({ ...bulk, status: e.target.checked ? (STATUSES[0] ?? "") : undefined })} /> COMPLETION STATUS<select aria-label="Bulk completion status" disabled={bulk.status === undefined} className="mt-1 h-7 w-full border border-vc-line" value={bulk.status ?? ""} onChange={(e) => setBulk({ ...bulk, status: e.target.value })}>{STATUSES.map((x) => <option key={x} value={x}>{x || "—"}</option>)}</select></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={bulk.published !== undefined} onChange={(e) => setBulk({ ...bulk, published: e.target.checked ? true : undefined })} /> PUBLISHED?<Switch aria-label="Bulk published" disabled={bulk.published === undefined} checked={bulk.published ?? false} onCheckedChange={(v) => setBulk({ ...bulk, published: v })} /></label>
        <Button size="sm" className="w-full bg-vc-success" onClick={applyBulk}>Update</Button>
      </div>}
    <table className="w-full text-[13px]">
      <thead><tr className="border-b-2 border-foreground/70 text-left text-[11px] uppercase text-muted-foreground"><th><input type="checkbox" aria-label="Select all students" checked={picked.length === roster.length && roster.length > 0} onChange={(e) => setPicked(e.target.checked ? roster.map((x) => x.id) : [])} /></th><th className="py-1.5"><button type="button" onClick={() => setDesc(!desc)} className="uppercase">Student {desc ? "Z→A" : "A→Z"}</button></th><th>Grade</th><th>Assignment Status</th><th>Comment</th><th className="text-right">Published?</th></tr></thead>
      <tbody>{rows.map((s) => { const k = scoreKey(a.id, s.id); const v = k in scores ? scores[k]! : String(scoreOf(scores, a, s.id) ?? ""); return (
        <tr key={s.id} className="border-b border-vc-line">
          <td className="w-6"><input type="checkbox" aria-label={`Select ${s.first}`} checked={picked.includes(s.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, s.id] : picked.filter((x) => x !== s.id))} /></td>
          <td className="py-2"><div className="flex items-center gap-2.5"><PersonPhoto personId={s.id} className="size-10 rounded-full" /><div className="leading-tight"><div className="text-[15px] font-semibold">{s.first}</div><div className="text-[14px]">{s.last}</div></div></div></td>
          <td><input aria-label={`Score for ${s.first}`} className="h-8 w-14 rounded-sm border border-vc-line text-center" value={v} onChange={(e) => isScoreInput(e.target.value) && set("scores", k, e.target.value)} /> <span className="text-muted-foreground">/{a.points}</span></td>
          <td><select aria-label={`Completion for ${s.first}`} className="h-8 w-[170px] rounded-sm border border-vc-line px-1 font-semibold" value={aStatus[k] ?? ""} onChange={(e) => set("aStatus", k, e.target.value)}>{STATUSES.map((x) => <option key={x} value={x}>{x || "—"}</option>)}</select></td>
          <td><input aria-label={`Comment for ${s.first}`} className="h-8 w-full rounded-sm border border-vc-line px-1.5" maxLength={300} value={comments[`a|${k}`] ?? ""} onChange={(e) => set("comments", `a|${k}`, e.target.value)} /></td>
          <td className="text-right"><Switch aria-label={`Publish for ${s.first}`} checked={pub[k] !== false} onCheckedChange={(on) => update((x) => ({ ...x, pub: { ...x.pub, [k]: on } }))} /></td>
        </tr>); })}</tbody>
    </table>
    </div>
  );
}
