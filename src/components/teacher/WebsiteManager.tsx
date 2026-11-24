import { Link } from "@tanstack/react-router";
import { format, parseISO, startOfWeek } from "date-fns";
import { ArrowRight, Bookmark, BookOpen, ChevronDown, FileText, Cloud, ImageIcon, LayoutGrid, Link2, Plus, Save, Settings, Star, Trash2, Clock, ChevronLeft, Pencil } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ImageCropper } from "@/components/common/ImageCropper";
import { MailEditor } from "@/components/common/MailEditor";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { PageEditor } from "@/components/teacher/PageEditor";
import { weekLabel, type ResourceTopic, type SitePost } from "@/lib/class-site";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useSchool, useSectionAssignments, type Section, type Website } from "@/lib/school-store";
import { today } from "@/lib/sis-data";

type View = "homepage" | "timeline" | "pages" | "resources";
const VIEWS: View[] = ["homepage", "timeline", "pages", "resources"];
const newId = () => Math.random().toString(36).slice(2, 10);
const iso = (d: Date) => format(d, "yyyy-MM-dd");
const BAR = "bg-[#4a64a0]";
const btn = "inline-flex h-[30px] items-center gap-1.5 border border-[#d4d4d4] bg-white px-3 text-[13px] font-bold text-[#222] shadow-[0_1px_1px_rgba(0,0,0,.15)] hover:bg-[#fafafa]";
const greenBtn = "inline-flex h-[30px] items-center gap-1.5 rounded-[2px] border-b-[3px] border-b-vc-success-edge bg-vc-success px-3 text-[14px] font-semibold text-primary-foreground";
const DOT = "border-b border-dotted border-[#cfcfcf]";

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="mx-auto grid min-h-[120px] place-items-center border border-[#e3e3e3] bg-white px-6 py-8 text-center shadow-[0_1px_1px_rgba(0,0,0,.05)]"><div><div className="text-[28px] font-light leading-9 text-[#555]">{title}</div><div className="mt-2 text-[16px] text-[#777]">{text}</div></div></div>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" role="dialog" aria-label={title}><div className="w-[460px] max-w-[94vw] bg-white shadow-xl"><div className={`flex h-[38px] items-center justify-between ${BAR} px-3 text-[16px] font-bold text-white`}>{title}<button type="button" aria-label="Close" onClick={onClose} className="text-[20px] leading-none">×</button></div>{children}</div></div>;
}

/** Teacher view of a class website, laid out like Veracross: homepage, timeline, pages and resources. */
export function WebsiteManager({ c }: { c: Section }) {
  const { update, user } = useSchool();
  const [view, setView] = useState<View>("timeline");
  const [editing, setEditing] = useState<string | null>(null);
  const w = c.website;
  const setSite = (fn: (w: Website) => Website) => update((s) => ({ ...s, sections: s.sections.map((x) => (x.id === c.id ? { ...x, website: fn(x.website) } : x)) }));
  const me = user ? `${user.prefix ? `${user.prefix} ` : ""}${user.preferred || user.first} ${user.last}`.trim() : "Teacher";
  const [newPage, setNewPage] = useState(false);
  const [newName, setNewName] = useState("");

  if (editing && w.pages.includes(editing)) return <PageEditor key={editing} c={c} name={editing} onBack={() => setEditing(null)} />;

  const createPage = () => {
    const name = newName.trim();
    if (!name) { toast.error("Enter a page title first."); return; }
    if (w.pages.includes(name)) { toast.error("A page with that title already exists."); return; }
    setSite((x) => ({ ...x, pages: [...x.pages, name], pageContent: { ...x.pageContent, [name]: { body: "", published: false, blocks: [] } } }));
    setNewPage(false); setNewName(""); setEditing(name);
  };

  return (
    <div className="-mx-[15px] -my-4 min-h-[600px] text-[14px] text-[#333]">
      <div className="flex min-h-[46px] items-center gap-3 border-b border-[#e3e3e3] border-t-2 border-t-[#4a64a0] bg-[#fdfdfd] px-3 py-[7px]">
        {view === "pages" && <button type="button" onClick={() => setNewPage(true)} className={greenBtn}><Plus className="size-4" strokeWidth={3} />New Page</button>}
        <span className="text-[14px] text-[#555]">view:</span>
        <div className="flex gap-px bg-[#ececec]">{VIEWS.map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`h-[30px] px-[17px] text-[14px] ${view === v ? `${BAR} font-bold text-white` : "text-[#333] hover:bg-[#e2e2e2]"}`}>{v}</button>)}</div>
        <Link to="/class/$classId" params={{ classId: c.id }} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[16px] text-vc-site-blue">view class website<ArrowRight className="size-4" /></Link>
      </div>
      {view === "homepage" && <Homepage c={c} setSite={setSite} />}
      {view === "timeline" && <Timeline c={c} setSite={setSite} me={me} />}
      {view === "pages" && <Pages c={c} setSite={setSite} onEdit={setEditing} />}
      {view === "resources" && <Resources w={w} setSite={setSite} />}
      {newPage && (
        <Modal title="New Page" onClose={() => setNewPage(false)}>
          <div className="px-4 pb-4 pt-3"><div className={`${DOT} pb-1 text-[22px] font-light uppercase text-[#444]`}>Enter a page title</div>
            <p className="mt-3 text-[14px] text-[#555]">This will be the name of the link for the page on the class website</p>
            <input autoFocus aria-label="Page title" maxLength={60} value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createPage(); }} className="mt-3 h-[50px] w-[78%] border border-[#4a90d9] px-4 text-[18px] outline-none" /></div>
          <div className="flex items-center gap-3 border-t border-[#e6e6e6] bg-[#fafafa] px-4 py-3"><button type="button" onClick={createPage} className={btn}>Continue to Editor ›</button><span>or</span><button type="button" onClick={() => setNewPage(false)} className="text-[#888] underline">Cancel</button></div>
        </Modal>)}
    </div>
  );
}

type SetSite = (fn: (w: Website) => Website) => void;

function Homepage({ c, setSite }: { c: Section; setSite: SetSite }) {
  const w = c.website;
  const published = w.pages.filter((p) => w.pageContent?.[p]?.published);
  const [pick, setPick] = useState(w.homepage ?? "");
  const [crop, setCrop] = useState(false);
  useEffect(() => { setPick(w.homepage ?? ""); }, [w.homepage]);
  const Radio = ({ v, label }: { v: Website["bg"]; label: string }) => <label className="flex cursor-pointer items-center gap-2 text-[17px] text-white"><input type="radio" name="bg" checked={w.bg === v} onChange={() => setSite((x) => ({ ...x, bg: v }))} className="size-4" />{label}</label>;
  return (
    <div className="px-[34px] pb-14 pt-3">
      <h2 className="text-[40px] font-bold leading-[48px] text-black">Website Homepage</h2>
      <p className="mt-1 text-[20px] text-[#333]">The page you select here appears on your website&apos;s <span className="text-vc-site-blue">homepage</span>. If there are no pages listed you should <span className="text-vc-site-blue underline">create and publish one</span> for your class website!</p>
      <select aria-label="Homepage" value={pick} onChange={(e) => setPick(e.target.value)} className="mt-4 h-[34px] min-w-[150px] border border-[#bbb] bg-white px-1.5 text-[18px]"><option value="">-- None --</option>{published.map((p) => <option key={p} value={p}>{p}</option>)}</select>
      <div><button type="button" onClick={() => { setSite((x) => ({ ...x, homepage: pick || undefined })); toast.success(pick ? `${pick} is now the homepage` : "Homepage cleared"); }} className={`${btn} mt-5 h-[52px] px-5 text-[18px]`}><Save className="size-4" />Set as Homepage</button></div>
      <div className="mt-8 bg-[#f1f1f3] px-2.5 py-2 text-[24px] font-light text-[#333]">Personalize</div>
      <p className="mt-4 max-w-[1500px] text-[20px] leading-[33px] text-[#333]">Select a background color and a background image for your website. The background image displays full screen, so large images work best. Setting a background color is recommended even if you upload a background image, because it will be used both on mobile devices and as a backup to the background image.</p>
      <div className="mt-4 w-[696px] max-w-full">
        <div className={`flex gap-9 ${BAR} px-10 py-3`}><Radio v="none" label="Default Look" /><Radio v="color" label="Background Color" /><Radio v="photo" label="Background Image" /></div>
        <div className="relative grid h-[260px] place-items-center bg-[#f3f3f5] text-[18px] text-[#333]" style={w.bg === "color" ? { background: w.color } : w.bg === "photo" && w.photo ? { backgroundImage: `url(${w.photo})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
          {w.bg === "none" && "Grey Background"}
          {w.bg === "color" && <div className="flex flex-col items-center gap-2 rounded bg-white/90 p-3"><div className="flex items-center gap-2"><input type="color" aria-label="Background color" value={w.color} onChange={(e) => setSite((x) => ({ ...x, color: e.target.value }))} className="h-9 w-12" /><input aria-label="Background color code" value={w.color} onChange={(e) => setSite((x) => ({ ...x, color: e.target.value }))} className="h-9 w-28 border border-[#ccc] px-2 text-[14px]" /></div></div>}
          {w.bg === "photo" && <button type="button" onClick={() => setCrop(true)} className={`${btn} bg-white/95`}>{w.photo ? "Replace image" : "Upload image"}</button>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-6 text-[14px]">{([["barColor", "Top bar & heading color", "#37465f"], ["linkColor", "Link color", "#007DDE"]] as const).map(([k, label, fb]) => (
        <label key={k} className="flex items-center gap-2">{label}<input type="color" aria-label={label} value={w[k] || fb} onChange={(e) => setSite((x) => ({ ...x, [k]: e.target.value }))} />{w[k] && <button type="button" onClick={() => setSite((x) => ({ ...x, [k]: undefined }))} className="text-vc-site-blue">Reset</button>}</label>))}</div>
      <ImageCropper open={crop} onClose={() => setCrop(false)} aspect={16 / 9} outWidth={1600} uncropped title="Website Background" onSave={(url) => { setSite((x) => ({ ...x, bg: "photo", photo: url })); toast.success("Background saved"); }} />
    </div>
  );
}

type Panel = null | "tiles" | "quick" | "post" | "postEditor" | "lesson";

function Timeline({ c, setSite, me }: { c: Section; setSite: SetSite; me: string }) {
  const w = c.website;
  const list = useSectionAssignments(c.id);
  const [panel, setPanel] = useState<Panel>("tiles");
  const [title, setTitle] = useState(""); const [html, setHtml] = useState(""); const [text, setText] = useState("");
  const [all, setAll] = useState(false);
  const [status, setStatus] = useState<"Not Displayed" | "Displayed">("Not Displayed");
  const [lessonDate, setLessonDate] = useState(iso(today()));
  const reset = () => { setTitle(""); setHtml(""); setText(""); setAll(false); setStatus("Not Displayed"); setPanel("tiles"); };
  const savePost = (kind: "quick" | "full" | "lesson", published: boolean) => {
    if (!title.trim()) { toast.error("Add a title first."); return; }
    const post: SitePost = { id: newId(), title: title.trim(), date: kind === "lesson" ? lessonDate : iso(new Date()), body: sanitizeHtml(html) || text, links: [], published, kind, html: true, by: me };
    setSite((x) => ({ ...x, posts: [post, ...(x.posts ?? [])] }));
    toast.success(kind === "lesson" ? "Lesson plan saved" : "Post published"); reset();
  };
  type Ev = { key: string; date: Date; kind: "due" | "assigned" | "post" | "lesson"; title: string };
  const evs: Ev[] = [
    ...list.flatMap((a) => [{ key: `${a.id}-d`, date: a.due, kind: "due" as const, title: a.title }, { key: `${a.id}-a`, date: a.assigned, kind: "assigned" as const, title: a.title }]),
    ...(w.posts ?? []).filter((p) => p.published).map((p) => ({ key: p.id, date: parseISO(p.date), kind: (p.kind === "lesson" ? "lesson" : "post") as "post" | "lesson", title: p.title })),
  ].sort((a, b) => +b.date - +a.date);
  const weeks = new Map<string, { label: string; items: Ev[] }>();
  for (const e of evs) { const s = startOfWeek(e.date, { weekStartsOn: 0 }); const k = iso(s); const g = weeks.get(k) ?? { label: weekLabel(s), items: [] }; g.items.push(e); weeks.set(k, g); }
  const KIND = { due: ["Assignment Due", "text-[#2d6aa5]", "bg-[#2d6aa5]", BookOpen], assigned: ["Assignment Assigned", "text-[#2d6aa5]", "bg-[#2d6aa5]", BookOpen], post: ["Full Post", "text-[#3fa34d]", "bg-[#4cb85c]", Bookmark], lesson: ["Lesson Plan", "text-[#3fa34d]", "bg-[#4cb85c]", FileText] } as const;
  const Tile = ({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) => <button type="button" onClick={onClick} className="flex h-[176px] w-[176px] flex-col items-center justify-center gap-4 border border-[#dcdcdc] bg-white text-[19px] font-bold text-black shadow-[0_1px_2px_rgba(0,0,0,.1)] hover:bg-[#fafafa]">{icon}{label}</button>;
  const Back = ({ t }: { t: string }) => <div className="flex items-center gap-8"><button type="button" onClick={reset} className={`${btn} h-[40px] text-[15px]`}><ChevronLeft className="size-4" strokeWidth={3} />Back</button><h3 className="text-[32px] text-black">{t}</h3></div>;
  const Lbl = ({ children }: { children: string }) => <div className="mb-2 mt-6 text-[14px] uppercase text-[#444]">{children}</div>;
  return (
    <div className="grid min-h-[560px] grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="border-r border-[#e8e8e8] bg-white px-8 pb-10 pt-8">
        {evs.length === 0 ? <div className="max-w-[790px]"><Empty title="The timeline will appear here" text="There has been no recent activity in this class." /></div> : (
          <div className="relative mx-auto max-w-[700px]"><div aria-hidden className="absolute bottom-0 left-[190px] top-0 w-[2px] bg-[#c9c9c9]" />
            {[...weeks.values()].map((g) => (
              <div key={g.label} className="relative">
                <div className="relative mb-6 ml-[88px] flex h-[48px] w-[224px] items-center justify-center border border-[#d9d9d9] bg-white text-[24px] font-semibold text-[#2d6aa5] shadow-sm">{g.label}</div>
                {g.items.map((e) => { const [lab, tc, bg, Icon] = KIND[e.kind]; return (
                  <div key={e.key} className="relative mb-6 grid grid-cols-[150px_82px_minmax(0,1fr)] items-center">
                    <div className="pr-3 text-right text-[17px] leading-6"><div>{format(e.date, "EEEE")}</div><div className="font-bold">{format(e.date, "MMM dd")}</div></div>
                    <span className={`relative z-10 mx-auto grid size-[46px] place-items-center rounded-full text-white ${bg}`}><Icon className="size-5" /></span>
                    <div className={e.kind === "post" || e.kind === "lesson" ? "ml-2 border border-[#dcdcdc] bg-[#f7f7f7] px-3 py-2" : "pl-3"}><div className={`text-[17px] ${tc}`}>{lab}</div><div className="text-[20px] leading-6 text-black">{e.title}</div></div>
                  </div>); })}
              </div>))}</div>)}
      </div>
      <div className="bg-[#f6f6f7] px-8 pb-10 pt-8">
        {panel === "tiles" && <div className="mx-auto grid w-[392px] grid-cols-2 gap-10 pt-6">
          <Tile label="Quick Post" icon={<Bookmark className="size-9" strokeWidth={1.6} />} onClick={() => setPanel("quick")} />
          <Tile label="Post" icon={<Bookmark className="size-9 fill-black" />} onClick={() => setPanel("post")} />
          <Link to="/teacher/class/$classId" params={{ classId: c.id }} search={{ tab: "assignments" }} className="flex h-[176px] w-[176px] flex-col items-center justify-center gap-4 border border-[#dcdcdc] bg-white text-[19px] font-bold text-black shadow-[0_1px_2px_rgba(0,0,0,.1)] hover:bg-[#fafafa]"><BookOpen className="size-9 fill-black" />Assignment</Link>
          <Tile label="Lesson Plan" icon={<FileText className="size-9" strokeWidth={1.6} />} onClick={() => setPanel("lesson")} />
        </div>}
        {panel === "quick" && <div><Back t="Quick Post" /><Lbl>Title</Lbl><input aria-label="Title" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="h-[58px] w-full border border-[#d6d6d6] bg-white px-4 text-[22px] outline-none focus:border-[#4a90d9]" />
          <Lbl>Content</Lbl><MailEditor label="Content" minHeight={210} onChange={(h, t) => { setHtml(h); setText(t); }} />
          <Lbl>Applies to all sections</Lbl><button type="button" role="switch" aria-checked={all} aria-label="Applies to all sections" onClick={() => setAll(!all)} className="flex h-[34px] w-[68px] overflow-hidden border border-[#4a90d9] text-[12px] font-bold">{all ? <><span className="grid flex-1 place-items-center bg-vc-success text-primary-foreground">YES</span><span className="w-[26px] bg-white" /></> : <><span className="w-[26px] bg-white" /><span className="grid flex-1 place-items-center bg-[#ececec] text-[#bbb]">NO</span></>}</button>
          <button type="button" onClick={() => savePost("quick", true)} className={`${btn} mt-7 h-[44px] px-6 text-[18px]`}>Publish</button></div>}
        {panel === "post" && <div><Back t="Post" /><Lbl>Title</Lbl><input aria-label="Title" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="h-[58px] w-full border border-[#d6d6d6] bg-white px-4 text-[22px] outline-none focus:border-[#4a90d9]" />
          <button type="button" onClick={() => { if (!title.trim()) { toast.error("Add a title first."); return; } setPanel("postEditor"); }} className={`${btn} mt-5 h-[44px] px-5 text-[16px]`}>Continue to Editor ›</button></div>}
        {panel === "postEditor" && <div><Back t={title} /><Lbl>Content</Lbl><MailEditor label="Post content" minHeight={300} onChange={(h, t) => { setHtml(h); setText(t); }} />
          <div className="mt-6 flex gap-3"><button type="button" onClick={() => savePost("full", true)} className={greenBtn}>Publish</button><button type="button" onClick={() => savePost("full", false)} className={btn}>Save as Draft</button></div></div>}
        {panel === "lesson" && <div className="border border-[#dcdcdc] bg-white"><div className={`flex ${BAR} text-[15px]`}><span className="bg-white px-6 py-2.5 font-bold">General</span><span className="px-6 py-2.5 text-white/80">Preview</span></div>
          <div className="grid gap-6 p-5 md:grid-cols-[1fr_200px]"><div>
            <div className="grid grid-cols-[1fr_170px] gap-4"><div><Lbl>Title</Lbl><input aria-label="Lesson plan title" placeholder="Lesson plan title" value={title} onChange={(e) => setTitle(e.target.value)} className={`h-[36px] w-full bg-transparent text-[18px] outline-none ${DOT}`} /></div>
              <div><Lbl>Portal display status</Lbl><select aria-label="Portal display status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-[28px] w-full border border-[#bbb] bg-white text-[14px]"><option>Not Displayed</option><option>Displayed</option></select></div></div>
            <div className="mt-4 inline-block bg-[#f1f1f1] px-6 py-2 text-[14px] font-bold">Lesson Plan</div><MailEditor label="Lesson plan" minHeight={140} onChange={(h, t) => { setHtml(h); setText(t); }} /></div>
            <div><Lbl>Classes &amp; dates</Lbl><div className="text-[14px] text-[#2d6aa5]">{c.code} <span className="text-[#777]">{c.name}</span></div><input type="date" aria-label="Lesson date" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} className="mt-1 h-[34px] w-full border-0 bg-[#e8f0fb] px-2 text-[15px]" /></div></div>
          <div className="flex gap-3 border-t border-[#e6e6e6] bg-[#f3f3f3] p-3"><button type="button" onClick={() => savePost("lesson", status === "Displayed")} className={btn}>Save Lesson Plan</button><button type="button" onClick={reset} className="text-[#888] underline">Cancel</button></div></div>}
      </div>
    </div>
  );
}

function Pages({ c, setSite, onEdit }: { c: Section; setSite: SetSite; onEdit: (n: string) => void }) {
  const w = c.website;
  const [menu, setMenu] = useState<string | null>(null);
  const [sort, setSort] = useState(false);
  const [rm, setRm] = useState<string | null>(null);
  const pc = (n: string) => w.pageContent?.[n];
  const pubd = w.pages.filter((p) => pc(p)?.published), drafts = w.pages.filter((p) => !pc(p)?.published);
  const setPub = (n: string, on: boolean) => setSite((x) => ({ ...x, pageContent: { ...x.pageContent, [n]: { ...(x.pageContent?.[n] ?? { body: "", published: false }), published: on, date: on ? (x.pageContent?.[n]?.date ?? iso(new Date())) : x.pageContent?.[n]?.date } } }));
  const shift = (n: string, by: number) => setSite((x) => { const i = x.pages.indexOf(n), j = i + by; if (j < 0 || j >= x.pages.length) return x; const p = [...x.pages]; [p[i], p[j]] = [p[j]!, p[i]!]; return { ...x, pages: p }; });
  const Card = ({ n }: { n: string }) => { const p = pc(n); const open = menu === n; return (
    <div className="relative h-[134px] w-[240px] border border-[#dcdcdc] bg-white p-3 shadow-[0_1px_1px_rgba(0,0,0,.06)]">
      {p?.published && <span aria-hidden className="absolute right-0 top-0 size-0 border-l-[16px] border-t-[16px] border-l-transparent border-t-[#4cb85c]" />}
      <button type="button" onClick={() => onEdit(n)} className="block max-w-full truncate text-left text-[18px] text-[#333] hover:underline">{n}</button>
      <div className="absolute bottom-3 left-3 text-[12px] leading-4 text-[#555]">{p?.published ? <><div className="text-[11px]">Published:</div><div>{p.date ? format(parseISO(p.date), "EEE, MMM dd") : ""}</div></> : <div className="text-[11px]">Draft</div>}</div>
      <button type="button" aria-label={`${n} options`} aria-expanded={open} onClick={() => setMenu(open ? null : n)} className="absolute bottom-3 right-3 flex items-center text-[#888]"><Settings className="size-[15px]" /><ChevronDown className={`size-3 ${open ? "rotate-180" : ""}`} /></button>
      {open && <div className="absolute left-0 right-0 top-0 z-20 border border-[#dcdcdc] bg-white p-3 shadow-md"><ul className="space-y-2">
        {p?.published && <li><Link to="/class/$classId" params={{ classId: c.id }} search={{ page: n }} target="_blank" rel="noopener noreferrer" className={`${btn} w-full justify-start`}>⌕ View on Website</Link></li>}
        <li><button type="button" onClick={() => { setPub(n, !p?.published); setMenu(null); }} className={`${btn} w-full justify-start`}>{p?.published ? "⊘ Unpublish" : "✓ Publish"}</button></li>
        {p?.published && <li><button type="button" onClick={() => { setSite((x) => ({ ...x, homepage: n })); setMenu(null); toast.success(`${n} is now the homepage`); }} className={`${btn} w-full justify-start`}><Star className="size-3.5 fill-black" />Set as Homepage</button></li>}
        <li><button type="button" onClick={() => onEdit(n)} className={`${btn} w-full justify-start`}><Pencil className="size-3.5" />Edit</button></li>
        <li><button type="button" onClick={() => { setRm(n); setMenu(null); }} className={`${btn} w-full justify-start`}><Trash2 className="size-3.5" />Remove...</button></li></ul></div>}
    </div>); };
  return (
    <div className="px-[34px] pb-14 pt-6">
      <div className={`flex items-end justify-between pb-2 ${DOT}`}><h2 className="text-[34px] font-light text-black">Published</h2><button type="button" aria-pressed={sort} onClick={() => setSort(!sort)} className={`${btn} mb-1 h-[36px]`}>⇅ Sort Pages</button></div>
      {pubd.length ? <div className="mt-5 flex flex-wrap gap-5">{pubd.map((n) => sort ? <div key={n} className="flex h-[60px] w-[240px] items-center justify-between border border-[#dcdcdc] bg-white px-3 text-[16px]">{n}<span className="flex gap-1"><button type="button" aria-label={`Move ${n} earlier`} onClick={() => shift(n, -1)} className={btn}>↑</button><button type="button" aria-label={`Move ${n} later`} onClick={() => shift(n, 1)} className={btn}>↓</button></span></div> : <Card key={n} n={n} />)}</div>
        : <div className="mx-auto mt-8 max-w-[1320px]"><Empty title="Published pages will appear here" text="These pages will show up on the class website." /></div>}
      <h2 className={`mt-12 pb-2 text-[34px] font-light text-black ${DOT}`}>Drafts</h2>
      {drafts.length ? <div className="mt-5 flex flex-wrap gap-5">{drafts.map((n) => <Card key={n} n={n} />)}</div>
        : <div className="mx-auto mt-8 max-w-[1320px]"><Empty title="Pages in draft will appear here" text="You can keep pages in draft mode while you are still editing them." /></div>}
      {rm && <Modal title="Remove Page" onClose={() => setRm(null)}><p className="px-4 py-5 text-[15px]">Remove <b>{rm}</b> from this class website? This can&apos;t be undone.</p>
        <div className="flex items-center gap-3 border-t border-[#e6e6e6] bg-[#fafafa] px-4 py-3"><button type="button" onClick={() => { const n = rm; setSite((x) => { const { [n]: _g, ...rest } = x.pageContent ?? {}; return { ...x, pages: x.pages.filter((p) => p !== n), pageContent: rest, homepage: x.homepage === n ? undefined : x.homepage }; }); setRm(null); toast.success("Page removed"); }} className={btn}>Remove</button><span>or</span><button type="button" onClick={() => setRm(null)} className="text-[#888] underline">Cancel</button></div></Modal>}
    </div>
  );
}

function Resources({ w, setSite }: { w: Website; setSite: SetSite }) {
  const topics = w.resources ?? [];
  const [name, setName] = useState("");
  const [addTo, setAddTo] = useState<string | null>(null);
  const [lab, setLab] = useState(""); const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null); const target = useRef<string>("");
  const setTopics = (fn: (t: ResourceTopic[]) => ResourceTopic[]) => setSite((x) => ({ ...x, resources: fn(x.resources ?? []) }));
  const upload = async (list: FileList | null) => {
    const files = [...(list ?? [])]; if (!files.length) return;
    const big = files.find((f) => f.size > 3 * 1024 * 1024); if (big) { toast.error(`${big.name} is larger than 3 MB.`); return; }
    const urls = await Promise.all(files.map((f) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); })));
    setTopics((t) => t.map((x) => (x.id === target.current ? { ...x, links: [...x.links, ...files.map((f, i) => ({ label: f.name, url: urls[i] ?? "" }))] } : x)));
    if (fileRef.current) fileRef.current.value = "";
  };
  const icon = (l: { label: string; url: string }) => /^data:image|\.(png|jpe?g|gif|webp)$/i.test(l.url.startsWith("data:") ? l.url : l.label) ? <ImageIcon className="size-[18px] text-[#555]" /> : /^https?:/i.test(l.url) ? <Link2 className="size-[18px] text-[#777]" /> : <FileText className="size-[18px] fill-[#666] text-[#666]" />;
  return (
    <div className="px-[34px] pb-14 pt-4">
      <input ref={fileRef} type="file" multiple hidden aria-label="Upload files" onChange={(e) => void upload(e.target.files)} />
      <h2 className="text-[40px] font-bold leading-[48px] text-black">Class Resources</h2>
      <p className="mt-2 text-[17px] leading-7 text-[#333]">You can use topics to organize the resources on your class website. Topics are shared across the sections of this course, but the resources contained within a topic are class specific.</p>
      <p className="mt-4 text-[17px] text-[#333]">These resources are available to Parents and Students on your <span className="text-vc-site-blue">class website&apos;s Resources tab</span>.</p>
      <div className="mt-5 grid gap-x-12 gap-y-9 md:grid-cols-2">{topics.map((t) => (
        <div key={t.id}>
          <div className="flex items-center gap-2"><span aria-hidden className="text-[#777]">≡</span><input aria-label="Topic name" value={t.title} maxLength={80} onChange={(e) => setTopics((l) => l.map((x) => (x.id === t.id ? { ...x, title: e.target.value } : x)))} className="min-w-0 flex-1 bg-transparent text-[30px] leading-9 text-black outline-none" /></div>
          <div className="mt-1 flex items-center gap-4 text-[17px]"><button type="button" onClick={() => { setAddTo(addTo === t.id ? null : t.id); setLab(""); setUrl(""); }} className="flex items-center gap-1 text-vc-site-blue"><LayoutGrid className="size-4 fill-current" />select resources</button>
            <button type="button" onClick={() => { target.current = t.id; fileRef.current?.click(); }} className="flex items-center gap-1 text-vc-site-blue"><Cloud className="size-4 fill-current" />upload files</button>
            <button type="button" onClick={() => setTopics((l) => l.filter((x) => x.id !== t.id))} className="text-[#a8392b]">delete topic</button></div>
          {addTo === t.id && <div className="mt-2 flex gap-2"><input aria-label="Resource name" placeholder="Name" value={lab} onChange={(e) => setLab(e.target.value)} className="h-8 w-40 border border-[#ccc] px-2 text-[14px]" /><input aria-label="Resource address" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} className="h-8 min-w-0 flex-1 border border-[#ccc] px-2 text-[14px]" />
            <button type="button" onClick={() => { if (!/^https?:\/\//i.test(url.trim())) { toast.error("Enter a web address starting with https://"); return; } setTopics((l) => l.map((x) => (x.id === t.id ? { ...x, links: [...x.links, { label: lab.trim() || url.trim(), url: url.trim() }] } : x))); setAddTo(null); }} className={btn}>Add</button></div>}
          <ul className="mt-3 space-y-1.5">{t.links.map((l, i) => <li key={i} className="group flex items-center gap-2 text-[17px] text-[#222]">{icon(l)}<span className="truncate">{l.label}</span><button type="button" aria-label={`Remove ${l.label}`} onClick={() => setTopics((tl) => tl.map((x) => (x.id === t.id ? { ...x, links: x.links.filter((_, j) => j !== i) } : x)))} className="ml-1 hidden text-[#a8392b] group-hover:inline"><Trash2 className="size-3.5" /></button></li>)}
            {!t.links.length && <li className="text-[17px] italic text-[#777]">No resources have been included in this topic yet.</li>}</ul>
        </div>))}</div>
      <div className="mt-12 max-w-[610px]"><input aria-label="New topic name" placeholder="My New Topic" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={`h-[40px] w-full bg-transparent text-[26px] outline-none placeholder:text-[#bbb] ${DOT}`} />
        <button type="button" onClick={() => { setTopics((l) => [...l, { id: newId(), title: name.trim() || "General", links: [] }]); setName(""); }} className={`${greenBtn} mt-4 h-[38px] text-[20px]`}><Plus className="size-4" strokeWidth={3} />Add Topic</button></div>
    </div>
  );
}
