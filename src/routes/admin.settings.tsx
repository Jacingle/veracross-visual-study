import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AxiomShell, Panel } from "@/components/admin/AxiomShell";
import { Switch } from "@/components/ui/switch";
import { BACKGROUNDS, DEFAULT_SETTINGS, bgSrc, useSchool, type PortalTheme, type Settings } from "@/lib/school-store";
import { pageHead } from "@/lib/head";
import { ImageCropper } from "@/components/common/ImageCropper";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/settings")({
  head: () => pageHead("Axiom · Portal Settings", "Customize portal backgrounds, bar colors and the login page."),
  component: SettingsPage,
});

function BgPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [url, setUrl] = useState(/^https?:/.test(value) ? value : "");
  const [crop, setCrop] = useState(false);
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {BACKGROUNDS.map((b) => (
          <button key={b.key} type="button" onClick={() => onChange(b.key)} className={`overflow-hidden border-2 text-left ${value === b.key ? "border-vc-link-strong" : "border-transparent"}`}>
            <img src={b.src} alt="" width={160} height={90} loading="lazy" className="h-14 w-full object-cover" /><div className="px-1 py-0.5 text-[11px]">{b.label}</div></button>))}
        <button type="button" onClick={() => onChange("none")} className={`grid h-[76px] place-items-center border-2 bg-vc-panel text-[11px] ${value === "none" ? "border-vc-link-strong" : "border-vc-line"}`}>No background</button>
      </div>
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setCrop(true)}>Upload photo</Button>
        <input aria-label="Custom image web address" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Or paste an image web address (https://…)" maxLength={500} className="h-7 flex-1 border border-vc-line px-2" />
        <button type="button" onClick={() => { if (!/^https:\/\/\S+\.\S+/.test(url)) { toast.error("Enter a full https:// image address"); return; } onChange(url); }} className="h-7 border border-vc-line px-3">Use image</button>
      </div>
      <ImageCropper open={crop} onClose={() => setCrop(false)} aspect={16 / 9} outWidth={1600} title="Portal Background" onSave={onChange} />
      {value.startsWith("data:image/") && <img src={value} alt="Uploaded background" className="mt-2 h-20 w-36 object-cover" />}
    </div>
  );
}

function ColorRow({ label, value, fallback, onChange }: { label: string; value: string; fallback: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between border-b border-vc-line py-1.5">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <input type="color" aria-label={label} value={value || fallback} onChange={(e) => onChange(e.target.value)} className="h-7 w-12 cursor-pointer border border-vc-line" />
        <button type="button" onClick={() => onChange("")} className="text-[11px] text-vc-link-strong">Default</button>
      </span>
    </label>
  );
}

function ThemeEditor({ name, t, fallback, set }: { name: string; t: PortalTheme; fallback: [string, string]; set: (t: PortalTheme) => void }) {
  const src = bgSrc(t.bg);
  return (
    <Panel title={name}>
      <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-4">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Background</div>
          <BgPicker value={t.bg} onChange={(bg) => set({ ...t, bg })} />
        </div>
        <div>
          <ColorRow label="Top bar color" value={t.topbar} fallback={fallback[0]} onChange={(topbar) => set({ ...t, topbar })} />
          <ColorRow label="Navigation bar color" value={t.navbar} fallback={fallback[1]} onChange={(navbar) => set({ ...t, navbar })} />
          <div className="flex items-center justify-between py-1.5"><span>Soften (blur) background</span><Switch aria-label="Blur background" checked={t.blur} onCheckedChange={(blur) => set({ ...t, blur })} /></div>
          <div className="mt-1 overflow-hidden border border-vc-line">
            <div className="h-3" style={{ background: t.topbar || fallback[0] }} /><div className="h-3" style={{ background: t.navbar || fallback[1] }} />
            <div className="relative h-16 bg-vc-panel">{src && <img src={src} alt="" className={`h-full w-full object-cover ${t.blur ? "blur-[1px]" : ""}`} />}<div className="absolute inset-x-6 bottom-0 top-3 bg-background/95" /></div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function SettingsPage() {
  const { settings, update } = useSchool();
  const [d, setD] = useState<Settings>(settings);
  const save = () => { update((s) => ({ ...s, settings: d })); toast.success("Portal settings saved — open a portal to see them"); };
  return (
    <AxiomShell title="Portal Settings" actions={<>
      <button onClick={() => setD(DEFAULT_SETTINGS)} className="h-7 border border-vc-line px-3">Restore Defaults</button>
      <button onClick={save} className="h-7 bg-ax-go px-4 font-semibold text-primary-foreground">Save</button></>}>
      <div className="space-y-3">
        <ThemeEditor name="Student Portal" t={d.student} fallback={["#0f2b4f", "#1b4373"]} set={(student) => setD({ ...d, student })} />
        <ThemeEditor name="Faculty Portal" t={d.teacher} fallback={["#215a2c", "#2f7a3c"]} set={(teacher) => setD({ ...d, teacher })} />
        <div className="grid grid-cols-2 gap-3">
          <Panel title="Class Websites"><p className="text-muted-foreground">Each teacher sets their own class website background (blank, a color, or a photo) from the class's Website page.</p></Panel>
          <Panel title="Login Page">
            <BgPicker value={d.login.bg} onChange={(bg) => setD({ ...d, login: { ...d.login, bg } })} />
            <label className="mt-2 block text-[11px] font-semibold uppercase text-muted-foreground">Login instructions
              <textarea value={d.login.message} maxLength={300} onChange={(e) => setD({ ...d, login: { ...d.login, message: e.target.value } })} className="mt-1 h-14 w-full border border-vc-line p-2 text-[13px] font-normal normal-case text-foreground" /></label>
          </Panel>
        </div>
      </div>
    </AxiomShell>
  );
}
