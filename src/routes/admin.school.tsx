import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AxField, axInput } from "@/components/admin/AxiomDetail";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { readLogo } from "@/lib/logo-image";
import { changedFields, cleanSchool, validateSchool } from "@/lib/school-info";
import { useSchool } from "@/lib/school-store";
import { SCHOOL_DEFAULT, type SchoolInfo } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/school")({
  head: () => pageHead("Axiom · School Information", "Edit the school's name, logo, email domain and contact details."),
  component: SchoolInformation,
});

/** School Information: the name, logo and contact details every portal, the sign-in page and new accounts use. */
function SchoolInformation() {
  const { school, update } = useSchool();
  const saved: SchoolInfo = { ...SCHOOL_DEFAULT, ...school };
  const [draft, setDraft] = useState<SchoolInfo | null>(null);
  const d = draft ?? saved;
  const set = (p: Partial<SchoolInfo>) => setDraft({ ...d, ...p });
  const changed = changedFields(d, saved);
  const file = useRef<HTMLInputElement>(null);
  const dirty = (...k: (keyof SchoolInfo)[]) => k.some((x) => changed.includes(x));
  const T = (k: keyof SchoolInfo, label: string, o: { required?: boolean; max?: number; hint?: string } = {}) => (
    <AxField label={label} required={o.required ?? false} dirty={dirty(k)}><input aria-label={label} className={axInput} maxLength={o.max ?? 80} value={d[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<SchoolInfo>)} />{o.hint && <div className="mt-0.5 text-[12px] text-vc-gray">{o.hint}</div>}</AxField>);
  const save = () => {
    const err = validateSchool(d);
    if (err) { toast.error(err); return; }
    update((s) => ({ ...s, school: cleanSchool(d) }));
    setDraft(null);
    toast.success("School information saved");
  };
  const pick = async (f: File | undefined) => {
    if (!f) return;
    try { set({ logo: await readLogo(f) }); } catch (e) { toast.error(e instanceof Error ? e.message : "That picture could not be read."); }
  };
  return (
    <AxiomShell title="School Information" onUpdate={save} crumbs={[]}>
      <div className="mx-auto grid max-w-[1100px] gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="General">
          {T("name", "School Name", { required: true })}
          {T("short", "Short Name", { required: true, max: 8, hint: "Up to 8 letters, shown in portal tab titles (for example, CRA)." })}
          {T("domain", "Email Domain", { required: true, max: 80, hint: "Used for new accounts, for example school.edu. People sign in with their username, not their email." })}
          {T("head", "Head of School", { max: 60 })}
          {T("address", "Address 1")}{T("address2", "Address 2")}
          <AxField label="City, State, Postal" dirty={dirty("city", "state", "postal")}>
            <div className="grid grid-cols-[1fr_64px_96px] gap-1"><input aria-label="City" className={axInput} maxLength={60} value={d.city} onChange={(e) => set({ city: e.target.value })} /><input aria-label="State" className={axInput} maxLength={20} value={d.state} onChange={(e) => set({ state: e.target.value })} /><input aria-label="Postal" className={axInput} maxLength={12} value={d.postal} onChange={(e) => set({ postal: e.target.value })} /></div>
          </AxField>
          {T("phone", "Phone", { max: 30 })}
          {T("website", "Website", { max: 120, hint: "Starts with https://" })}
        </Panel>
        <div className="space-y-3">
          <Panel title="Logo">
            <div className="grid h-[150px] place-items-center border border-vc-line bg-vc-panel">{d.logo ? <img src={d.logo} alt={`${d.name} logo`} className="max-h-[130px] max-w-[90%] object-contain" /> : <span className="text-vc-gray">No logo. The name shows on its own.</span>}</div>
            <input ref={file} type="file" hidden aria-label="Choose logo file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => file.current?.click()} className="flex h-[30px] items-center gap-1.5 border border-vc-gray-light/80 px-3 hover:bg-vc-panel"><ImagePlus className="size-4" />{d.logo ? "Replace Logo..." : "Upload Logo..."}</button>
              {d.logo && <button type="button" onClick={() => set({ logo: "" })} className="flex items-center gap-1 text-destructive hover:underline"><Trash2 className="size-4" />Remove</button>}
            </div>
            <p className="mt-2 text-[12px] text-vc-gray">PNG, JPG, GIF, WebP or SVG, up to 2 MB. It shows in the top bar of every portal and on the sign-in page.</p>
          </Panel>
          <Panel title="Preview">
            <div aria-label="Top bar preview" className="flex h-[34px] items-center gap-2 bg-ax-top px-3 text-primary-foreground">{d.logo && <img src={d.logo} alt="" className="h-[22px] w-auto max-w-[90px] object-contain" />}<span className="truncate text-[14px] font-semibold uppercase">{d.name || "School name"}</span></div>
          </Panel>
        </div>
      </div>
    </AxiomShell>
  );
}
