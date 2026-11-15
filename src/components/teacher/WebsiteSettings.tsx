import { Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageCropper } from "@/components/common/ImageCropper";
import { useSchool, type Section, type Website } from "@/lib/school-store";

const SWATCHES = ["#3a6ea5", "#1f4e79", "#2e7d5b", "#7a2e3a", "#5b4a8a", "#c27c2c", "#4a5560"];

/** Teacher-owned class website settings: background (blank / color / cropped photo), home sections and pages. */
export function WebsiteSettings({ c }: { c: Section }) {
  const { update } = useSchool();
  const [w, setW] = useState<Website>(c.website);
  const [crop, setCrop] = useState(false);
  const save = (next = w) => { update((s) => ({ ...s, sections: s.sections.map((x) => (x.id === c.id ? { ...x, website: next } : x)) })); toast.success("Class website saved"); };
  const Opt = ({ v, label }: { v: Website["bg"]; label: string }) => (
    <label className={`flex cursor-pointer items-center gap-2 border px-3 py-2 ${w.bg === v ? "border-vc-link-strong bg-vc-select" : "border-vc-line"}`}><input type="radio" checked={w.bg === v} onChange={() => setW({ ...w, bg: v })} />{label}</label>);
  return (
    <div className="max-w-[820px] text-[13px]">
      <div className="flex items-center justify-between border-b border-vc-line pb-2">
        <h2 className="text-[22px]">Class Website</h2>
        <div className="flex gap-2"><Link to="/class/$classId" params={{ classId: c.id }} className="flex h-8 items-center border border-vc-line px-3 text-vc-link-strong">View Website</Link>
          <button onClick={() => save()} className="h-8 bg-vc-link-strong px-4 font-semibold text-primary-foreground">Save</button></div>
      </div>
      <h3 className="mt-4 font-semibold">Background</h3>
      <div className="mt-2 flex gap-2"><Opt v="none" label="Blank" /><Opt v="color" label="Color" /><Opt v="photo" label="Photo" /></div>
      {w.bg === "color" && <div className="mt-3 flex items-center gap-2">{SWATCHES.map((col) => (
        <button key={col} aria-label={`Color ${col}`} onClick={() => setW({ ...w, color: col })} className={`size-8 border-2 ${w.color === col ? "border-foreground" : "border-transparent"}`} style={{ background: col }} />))}
        <input type="color" aria-label="Custom color" value={w.color} onChange={(e) => setW({ ...w, color: e.target.value })} className="h-8 w-10" /></div>}
      {w.bg === "photo" && <div className="mt-3 flex items-end gap-3">
        {w.photo ? <img src={w.photo} alt="Website background" className="h-[110px] w-[196px] border border-vc-line object-cover" /> : <div className="grid h-[110px] w-[196px] place-items-center border border-dashed border-vc-line text-muted-foreground">No photo</div>}
        <button onClick={() => setCrop(true)} className="h-8 border border-vc-line px-3 text-vc-link-strong">{w.photo ? "Replace & crop photo" : "Upload & crop photo"}</button></div>}
      <div className="mt-2 h-[70px] w-[260px] border border-vc-line" style={w.bg === "color" ? { background: w.color } : w.bg === "photo" && w.photo ? { backgroundImage: `url(${w.photo})`, backgroundSize: "cover" } : undefined} title="Preview" />

      <h3 className="mt-6 font-semibold">Home Page Sections</h3>
      <p className="text-muted-foreground">Shown below the assignment list (for example Course Description, Honors Placement).</p>
      <div className="mt-2 space-y-3">{w.sections.map((sec, i) => (
        <div key={i} className="border border-vc-line p-2">
          <div className="flex gap-2"><input aria-label="Section title" className="h-8 flex-1 border border-vc-line px-2 font-semibold" maxLength={80} value={sec.title} onChange={(e) => setW({ ...w, sections: w.sections.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
            <button aria-label="Remove section" onClick={() => setW({ ...w, sections: w.sections.filter((_, j) => j !== i) })} className="px-2 text-destructive"><Trash2 className="size-4" /></button></div>
          <textarea aria-label="Section text" className="mt-2 h-24 w-full border border-vc-line p-2" maxLength={4000} value={sec.body} onChange={(e) => setW({ ...w, sections: w.sections.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} />
        </div>))}</div>
      <button onClick={() => setW({ ...w, sections: [...w.sections, { title: "Course Description", body: "" }] })} className="mt-2 flex items-center gap-1 text-vc-link-strong"><Plus className="size-4" />Add section</button>

      <h3 className="mt-6 font-semibold">Pages</h3>
      <div className="mt-1 space-y-1">{w.pages.map((pg, i) => (
        <div key={i} className="flex gap-2"><input aria-label="Page name" className="h-8 w-72 border border-vc-line px-2" maxLength={60} value={pg} onChange={(e) => setW({ ...w, pages: w.pages.map((x, j) => (j === i ? e.target.value : x)) })} />
          <button aria-label="Remove page" onClick={() => setW({ ...w, pages: w.pages.filter((_, j) => j !== i) })} className="px-2 text-destructive"><Trash2 className="size-4" /></button></div>))}</div>
      <button onClick={() => setW({ ...w, pages: [...w.pages, "New Page"] })} className="mt-2 flex items-center gap-1 text-vc-link-strong"><Plus className="size-4" />Add page</button>

      <ImageCropper open={crop} onClose={() => setCrop(false)} aspect={16 / 9} outWidth={1600} title="Website Background"
        onSave={(url) => { const next = { ...w, bg: "photo" as const, photo: url }; setW(next); save(next); }} />
    </div>
  );
}
