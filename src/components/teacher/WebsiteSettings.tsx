import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImageCropper } from "@/components/common/ImageCropper";
import { SITE_BLUE, SITE_COLORS, type ResourceTopic, type SiteLink, type SitePost } from "@/lib/class-site";
import { useSchool, type Section, type Website } from "@/lib/school-store";

const FIELD = "h-8 border border-vc-line bg-background px-2";
const newId = () => Math.random().toString(36).slice(2, 10);
const isoToday = () => format(new Date(), "yyyy-MM-dd");

function Links({ links, onChange, add }: { links: SiteLink[]; onChange: (l: SiteLink[]) => void; add: string }) {
  return <div className="mt-2 space-y-1.5">{links.map((l, i) => (
    <div key={i} className="flex gap-2"><input aria-label="Link name" placeholder="Name" className={`${FIELD} w-48`} maxLength={120} value={l.label} onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
      <input aria-label="Link address" placeholder="https://" className={`${FIELD} min-w-0 flex-1`} maxLength={500} value={l.url} onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
      <Button variant="ghost" size="icon" aria-label="Remove link" onClick={() => onChange(links.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button></div>))}
    <button onClick={() => onChange([...links, { label: "", url: "" }])} className="flex items-center gap-1 text-vc-site-blue"><Plus className="size-4" />{add}</button></div>;
}

/** Teacher-owned class website settings: look (background, colors), home sections, pages, posts and resources. */
export function WebsiteSettings({ c }: { c: Section }) {
  const { update } = useSchool();
  const [w, setW] = useState<Website>(c.website);
  const [crop, setCrop] = useState(false);
  useEffect(() => { setW(c.website); }, [c.website]);
  const change = (next: Website) => { setW(next); update((s) => ({ ...s, sections: s.sections.map((x) => x.id === c.id ? { ...x, website: next } : x) })); };
  const save = (next = w) => { update((s) => ({ ...s, sections: s.sections.map((x) => (x.id === c.id ? { ...x, website: next } : x)) })); toast.success("Class website saved"); };
  const Opt = ({ v, label }: { v: Website["bg"]; label: string }) => (
    <label className={`flex cursor-pointer items-center gap-2 border px-3 py-2 ${w.bg === v ? "border-vc-link-strong bg-vc-select" : "border-vc-line"}`}><input type="radio" checked={w.bg === v} onChange={() => change({ ...w, bg: v })} />{label}</label>);
  const posts = w.posts ?? [], topics = w.resources ?? [];
  const setPost = (i: number, p: Partial<SitePost>) => change({ ...w, posts: posts.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const setTopic = (i: number, p: Partial<ResourceTopic>) => change({ ...w, resources: topics.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const page = (name: string) => w.pageContent?.[name] ?? { body: "", published: false };
  const setPage = (name: string, p: Partial<NonNullable<Website["pageContent"]>[string]>) => change({ ...w, pageContent: { ...w.pageContent, [name]: { ...page(name), ...p } } });
  const renamePage = (i: number, to: string) => {
    const from = w.pages[i] ?? "";
    if (!to.trim() || (to !== from && w.pages.includes(to))) return;
    const { [from]: moved, ...rest } = w.pageContent ?? {};
    change({ ...w, pages: w.pages.map((x, j) => (j === i ? to : x)), pageContent: { ...rest, [to]: moved ?? { body: "", published: false } } });
  };
  const dropPage = (i: number) => { const name = w.pages[i] ?? ""; const { [name]: _gone, ...rest } = w.pageContent ?? {}; change({ ...w, pages: w.pages.filter((_, j) => j !== i), pageContent: rest }); };
  const publishPage = (name: string, on: boolean) => setPage(name, { published: on, date: on ? (page(name).date ?? isoToday()) : page(name).date });
  const H = ({ children, hint }: { children: string; hint?: string }) => <><h3 className="mt-7 border-b border-vc-line pb-1 text-[16px] font-semibold">{children}</h3>{hint && <p className="mt-1 text-muted-foreground">{hint}</p>}</>;
  return (
    <div className="max-w-[820px] text-[13px]">
      <div className="flex items-center justify-between border-b border-vc-line pb-2">
        <h2 className="text-[22px]">Class Website</h2>
        <div className="flex gap-2"><Link to="/class/$classId" params={{ classId: c.id }} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center border border-vc-line px-3 text-vc-link-strong">View Website</Link>
          <button onClick={() => save()} className="h-8 bg-vc-link-strong px-4 font-semibold text-primary-foreground">Save</button></div>
      </div>

      <H hint="Choose a blank gray page, a color or a photo. Color and photo backgrounds get a soft shadow across the top and a white class title.">Background</H>
      <div className="mt-2 flex gap-2"><Opt v="none" label="Blank" /><Opt v="color" label="Color" /><Opt v="photo" label="Photo" /></div>
      {w.bg === "color" && <div className="mt-3">
        <div className="flex flex-wrap gap-1.5">{SITE_COLORS.map((col) => (
          <button key={col} type="button" aria-label={`Color ${col}`} aria-pressed={w.color.toLowerCase() === col.toLowerCase()} onClick={() => change({ ...w, color: col })}
            className={`size-8 border-2 ${w.color.toLowerCase() === col.toLowerCase() ? "border-foreground" : "border-vc-line"}`} style={{ background: col }} />))}</div>
        <div className="mt-2 flex items-center gap-2"><input type="color" aria-label="Custom color" value={w.color} onChange={(e) => change({ ...w, color: e.target.value })} className="h-8 w-10" />
          <input aria-label="Background color code" value={w.color} className={`${FIELD} w-28`} onChange={(e) => change({ ...w, color: e.target.value })} /></div></div>}
      {w.bg === "photo" && <div className="mt-3 flex items-end gap-3">
        {w.photo ? <img src={w.photo} alt="Website background" className="h-[110px] w-[196px] border border-vc-line object-cover" /> : <div className="grid h-[110px] w-[196px] place-items-center border border-dashed border-vc-line text-muted-foreground">No photo</div>}
        <Button variant="outline" size="sm" onClick={() => setCrop(true)}>{w.photo ? "Replace photo" : "Upload photo"}</Button></div>}
      <div className="relative mt-2 h-[84px] w-[260px] overflow-hidden border border-vc-line" style={w.bg === "color" ? { background: w.color } : w.bg === "photo" && w.photo ? { backgroundImage: `url(${w.photo})`, backgroundSize: "cover" } : { background: "#eee" }} title="Preview">
        {w.bg !== "none" && <><div className="absolute inset-0" style={{ background: "linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,0))" }} /><span className="relative m-2 block text-[15px] text-primary-foreground [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">{c.code}: {c.name}</span></>}</div>
      <div className="mt-3 flex flex-wrap gap-4">{([['barColor', 'Top bar & heading color', "#37465f"], ['linkColor', 'Link color', SITE_BLUE]] as const).map(([key, label, fallback]) => <label key={key} className="flex items-center gap-2">{label}<input type="color" aria-label={label} value={w[key] || fallback} onChange={(e) => change({ ...w, [key]: e.target.value })} />
        {w[key] && <button type="button" onClick={() => change({ ...w, [key]: undefined })} className="text-vc-site-blue">Reset</button>}</label>)}</div>

      <H hint="Shown under the assignment list on Home (for example Course Description, Honors Placement).">Home Page Sections</H>
      <div className="mt-2 space-y-3">{w.sections.map((sec, i) => (
        <div key={i} className="border border-vc-line p-2">
          <div className="flex gap-2"><input aria-label="Section title" className={`${FIELD} flex-1 font-semibold`} maxLength={80} value={sec.title} onChange={(e) => change({ ...w, sections: w.sections.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
            <button aria-label="Remove section" onClick={() => change({ ...w, sections: w.sections.filter((_, j) => j !== i) })} className="px-2 text-destructive"><Trash2 className="size-4" /></button></div>
          <textarea aria-label="Section text" className="mt-2 h-24 w-full border border-vc-line p-2" maxLength={4000} value={sec.body} onChange={(e) => change({ ...w, sections: w.sections.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} />
        </div>))}</div>
      <button onClick={() => change({ ...w, sections: [...w.sections, { title: "Course Description", body: "" }] })} className="mt-2 flex items-center gap-1 text-vc-site-blue"><Plus className="size-4" />Add section</button>

      <H hint="Pages appear under All Pages. Students only see published pages, with the publish date, title, text and an optional button.">Pages</H>
      <div className="mt-1 space-y-1">{w.pages.map((pg, i) => { const p = page(pg); return (
        <div key={pg} className="border-b border-vc-line py-2"><div className="flex gap-2"><input aria-label="Page name" className={`${FIELD} w-72`} maxLength={60} defaultValue={pg} onBlur={(e) => { renamePage(i, e.target.value); e.target.value = w.pages[i] ?? pg; }} />
          <Button variant="ghost" size="icon" aria-label="Remove page" onClick={() => dropPage(i)}><Trash2 className="size-4" /></Button></div>
          <textarea aria-label={`Content for ${pg}`} className="mt-2 h-24 w-full border border-vc-line p-2" value={p.body} onChange={(e) => setPage(pg, { body: e.target.value })} />
          <div className="mt-2 flex flex-wrap items-center gap-2">Button
            <input aria-label={`Button name for ${pg}`} placeholder="Button name" className={`${FIELD} w-44`} maxLength={80} value={p.button?.label ?? ""} onChange={(e) => setPage(pg, { button: { url: p.button?.url ?? "", label: e.target.value } })} />
            <input aria-label={`Button address for ${pg}`} placeholder="https://" className={`${FIELD} min-w-0 flex-1`} maxLength={500} value={p.button?.url ?? ""} onChange={(e) => setPage(pg, { button: { label: p.button?.label ?? "", url: e.target.value } })} /></div>
          <div className="mt-2 flex flex-wrap items-center gap-4"><label className="flex items-center gap-2"><input type="checkbox" checked={p.published} onChange={(e) => publishPage(pg, e.target.checked)} />Published</label>
            <label className="flex items-center gap-2">Publish date<input type="date" aria-label={`Publish date for ${pg}`} className={FIELD} value={p.date ?? ""} onChange={(e) => setPage(pg, { date: e.target.value || undefined })} /></label></div></div>); })}</div>
      <Button variant="ghost" size="sm" onClick={() => { let n = w.pages.length + 1; while (w.pages.includes(`New Page ${n}`)) n += 1; const name = `New Page ${n}`; change({ ...w, pages: [...w.pages, name], pageContent: { ...w.pageContent, [name]: { body: "", published: false } } }); }} className="mt-2 text-vc-site-blue"><Plus className="size-4" />Add page</Button>

      <H hint="Dated announcements with attachments, listed on the Posts tab (newest first).">Posts</H>
      <div className="mt-2 space-y-3">{posts.map((p, i) => (
        <div key={p.id} className="border border-vc-line p-2">
          <div className="flex gap-2"><input aria-label="Post title" placeholder="Title" className={`${FIELD} flex-1 font-semibold`} maxLength={120} value={p.title} onChange={(e) => setPost(i, { title: e.target.value })} />
            <input type="date" aria-label="Post date" className={FIELD} value={p.date} onChange={(e) => setPost(i, { date: e.target.value || isoToday() })} />
            <button aria-label="Remove post" onClick={() => change({ ...w, posts: posts.filter((_, j) => j !== i) })} className="px-2 text-destructive"><Trash2 className="size-4" /></button></div>
          <textarea aria-label="Post text" className="mt-2 h-16 w-full border border-vc-line p-2" maxLength={4000} value={p.body} onChange={(e) => setPost(i, { body: e.target.value })} />
          <Links links={p.links} onChange={(links) => setPost(i, { links })} add="Add attachment link" />
          <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={p.published} onChange={(e) => setPost(i, { published: e.target.checked })} />Published</label>
        </div>))}</div>
      <button onClick={() => change({ ...w, posts: [{ id: newId(), title: "", date: isoToday(), body: "", links: [], published: true }, ...posts] })} className="mt-2 flex items-center gap-1 text-vc-site-blue"><Plus className="size-4" />Add post</button>

      <H hint="Group links under topics (for example Module 10). Topics appear in two columns on the Resources tab.">Resources</H>
      <div className="mt-2 space-y-3">{topics.map((t, i) => (
        <div key={t.id} className="border border-vc-line p-2">
          <div className="flex gap-2"><input aria-label="Topic name" placeholder="Topic" className={`${FIELD} flex-1 font-semibold`} maxLength={80} value={t.title} onChange={(e) => setTopic(i, { title: e.target.value })} />
            <button aria-label="Remove topic" onClick={() => change({ ...w, resources: topics.filter((_, j) => j !== i) })} className="px-2 text-destructive"><Trash2 className="size-4" /></button></div>
          <Links links={t.links} onChange={(links) => setTopic(i, { links })} add="Add resource link" />
        </div>))}</div>
      <button onClick={() => change({ ...w, resources: [...topics, { id: newId(), title: "General Information", links: [] }] })} className="mt-2 flex items-center gap-1 text-vc-site-blue"><Plus className="size-4" />Add topic</button>

      <ImageCropper open={crop} onClose={() => setCrop(false)} aspect={16 / 9} outWidth={1600} uncropped title="Website Background"
        onSave={(url) => { const next = { ...w, bg: "photo" as const, photo: url }; setW(next); save(next); }} />
    </div>
  );
}
