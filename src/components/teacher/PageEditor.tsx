import { format } from "date-fns";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowLeft, ChevronLeft, ChevronRight, CircleCheck, Code, Copy, FileText, ImageIcon, Link2, Maximize2, Minus, Move, Newspaper, Paperclip, Pencil, Pointer, Trash2, UploadCloud, X, CircleHelp, MoreVertical } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { MailEditor } from "@/components/common/MailEditor";
import { BlockView, newBlock } from "@/components/site/PageBlocks";
import type { BlockType, PageBlock } from "@/lib/class-site";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { staffIds, useSchool, type Section } from "@/lib/school-store";

const MAX_BYTES = 3 * 1024 * 1024;
const TILES: [BlockType, string, ReactNode][] = [
  ["header", "Header", <span key="a" className="font-serif text-[26px] font-bold leading-none text-[#3a6ea5]">A</span>],
  ["text", "Text", <AlignLeft key="t" className="size-[22px]" strokeWidth={2.4} />],
  ["button", "Button", <Pointer key="b" className="size-[22px]" />],
  ["divider", "Divider", <Minus key="d" className="size-[22px]" strokeWidth={2.6} />],
  ["textimage", "Text + Image", <Newspaper key="ti" className="size-[22px]" />],
  ["images", "Images", <ImageIcon key="i" className="size-[22px]" />],
  ["file", "File", <Paperclip key="f" className="size-[22px]" />],
  ["embed", "Embed", <Code key="e" className="size-[22px]" />],
];
const readUrl = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });

function Opt({ on, onClick, children, label }: { on: boolean; onClick: () => void; children: ReactNode; label: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`relative flex h-[62px] w-[92px] flex-col items-center justify-center gap-1 border bg-white text-[11px] text-[#555] ${on ? "border-[#4a90d9] shadow-[0_0_0_1px_#4a90d9]" : "border-[#e1e1e1] hover:bg-[#fafafa]"}`}>
      {on && <CircleCheck className="absolute -right-2 -top-2 size-[18px] fill-[#4a90d9] text-white" />}{children}<span>{label}</span>
    </button>
  );
}
const Label = ({ children }: { children: string }) => <div className="mb-1.5 mt-4 text-[12px] text-[#444]">{children}</div>;
const Band = ({ children }: { children: string }) => <div className="-mx-[24px] mt-5 border-y border-[#ececec] bg-[#f7f7f7] py-2 text-center text-[19px] font-light text-[#333]">{children}</div>;
const Swatch = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => <input type="color" aria-label={label} value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff"} onChange={(e) => onChange(e.target.value)} className="h-[30px] w-[44px] cursor-pointer border border-[#d6d6d6] bg-white p-0.5" />;
const Field = "h-[36px] w-full border border-[#d6d6d6] bg-white px-2.5 text-[14px] text-black outline-none focus:border-[#4a90d9]";

/** Full-screen page editor: blocks on the left, "Add Section" / block settings on the right. */
export function PageEditor({ c, name, onBack }: { c: Section; name: string; onBack: () => void }) {
  const { update, sections, user } = useSchool();
  const page = c.website.pageContent?.[name] ?? { body: "", published: false };
  const [blocks, setBlocks] = useState<PageBlock[]>(page.blocks ?? []);
  const [sel, setSel] = useState<string | null>(null);
  const [state, setState] = useState<"saved" | "dirty">("saved");
  const [pub, setPub] = useState(false);
  const [targets, setTargets] = useState<string[]>([]);
  const [wide, setWide] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const others = sections.filter((x) => x.id !== c.id && user && staffIds(x).includes(user.personId));

  const commit = (next: PageBlock[]) => {
    setBlocks(next); setState("dirty");
    update((s) => ({ ...s, sections: s.sections.map((x) => (x.id === c.id ? { ...x, website: { ...x.website, pageContent: { ...x.website.pageContent, [name]: { ...(x.website.pageContent?.[name] ?? { body: "", published: false }), blocks: next } } } } : x)) }));
    setState("saved");
  };
  const patch = (id: string, p: Partial<PageBlock>) => commit(blocks.map((b) => (b.id === id ? ({ ...b, ...p } as PageBlock) : b)));
  const move = (id: string, by: number) => { const i = blocks.findIndex((b) => b.id === id), j = i + by; if (i < 0 || j < 0 || j >= blocks.length) return; const n = [...blocks]; [n[i], n[j]] = [n[j]!, n[i]!]; commit(n); };
  const add = (t: BlockType) => { const b = newBlock(t); commit([...blocks, b]); setSel(b.id); };
  const dup = (id: string) => { const i = blocks.findIndex((b) => b.id === id); const b = blocks[i]; if (!b) return; const n = [...blocks]; n.splice(i + 1, 0, { ...structuredClone(b), id: Math.random().toString(36).slice(2, 10) }); commit(n); };
  const del = (id: string) => { commit(blocks.filter((b) => b.id !== id)); if (sel === id) setSel(null); };
  const upload = async (list: FileList | null, set: (urls: string[], names: string[]) => void) => {
    if (!list?.length) return;
    const files = [...list]; const big = files.find((f) => f.size > MAX_BYTES);
    if (big) { toast.error(`${big.name} is larger than 3 MB.`); return; }
    try { set(await Promise.all(files.map(readUrl)), files.map((f) => f.name)); } catch { toast.error("That file couldn't be read."); }
  };
  const publish = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    update((s) => ({ ...s, sections: s.sections.map((x) => {
      if (x.id === c.id) return { ...x, website: { ...x.website, pageContent: { ...x.website.pageContent, [name]: { ...(x.website.pageContent?.[name] ?? { body: "", published: false }), blocks, published: true, date: x.website.pageContent?.[name]?.date ?? today } } } };
      if (!targets.includes(x.id)) return x;
      const pages = x.website.pages.includes(name) ? x.website.pages : [...x.website.pages, name];
      return { ...x, website: { ...x.website, pages, pageContent: { ...x.website.pageContent, [name]: { body: "", blocks: structuredClone(blocks), published: true, date: today } } } };
    }) }));
    toast.success(`Published ${name}`); setPub(false); onBack();
  };

  const cur = blocks.find((b) => b.id === sel);
  const tb = "grid size-[26px] place-items-center rounded-full bg-[#333] text-white hover:bg-black";
  const Seg3 = <T extends string>({ value, opts, set }: { value: T; opts: [T, string, ReactNode][]; set: (v: T) => void }) => <div className="flex flex-wrap gap-2.5">{opts.map(([v, l, i]) => <Opt key={v} on={value === v} onClick={() => set(v)} label={l}>{i}</Opt>)}</div>;
  const AL: [("left" | "center" | "right"), string, ReactNode][] = [["left", "Left", <AlignLeft key="l" className="size-5" />], ["center", "Center", <AlignCenter key="c" className="size-5" />], ["right", "Right", <AlignRight key="r" className="size-5" />]];

  const panel = (b: PageBlock) => {
    const bg = <><Label>Background Color</Label><div className="flex items-center gap-2"><Swatch value={b.bg ?? "#ffffff"} onChange={(v) => patch(b.id, { bg: v })} label="Background color" />{b.bg && <button type="button" onClick={() => patch(b.id, { bg: undefined })} className="text-[12px] text-vc-site-blue">Clear</button>}</div></>;
    switch (b.type) {
      case "header": return <>{bg}<Label>Alignment</Label><Seg3 value={b.align} opts={AL} set={(v) => patch(b.id, { align: v })} />
        <Label>Text</Label><div className="flex gap-2"><input aria-label="Header text" className={Field} value={b.text} onChange={(e) => patch(b.id, { text: e.target.value })} />
          <button type="button" title="Link" aria-label="Link" onClick={() => { const u = window.prompt("Link address (https://…)", b.link ?? ""); if (u !== null) patch(b.id, { link: u.trim() }); }} className={`grid h-[36px] w-[44px] shrink-0 place-items-center border border-[#d6d6d6] ${b.link ? "bg-[#4a90d9] text-white" : "bg-[#f1f1f1] text-[#666]"}`}><Link2 className="size-4" /></button>
          <Swatch value={b.color} onChange={(v) => patch(b.id, { color: v })} label="Text color" /></div>
        <Band>Options</Band><Label>Text Size</Label><Seg3 value={b.size} opts={[["S", "Small", <b key="s" className="font-serif text-[16px]">S</b>], ["M", "Medium", <b key="m" className="font-serif text-[18px]">M</b>], ["L", "Large", <b key="l" className="font-serif text-[20px]">L</b>], ["XL", "X-Large", <b key="x" className="font-serif text-[22px]">XL</b>]]} set={(v) => patch(b.id, { size: v })} />
        <Label>Weight</Label><Seg3 value={b.bold ? "B" : "N"} opts={[["N", "Normal", <span key="n" className="font-serif text-[18px]">N</span>], ["B", "Bold", <b key="b" className="font-serif text-[18px]">B</b>]]} set={(v) => patch(b.id, { bold: v === "B" })} /></>;
      case "text": return <>{bg}<Label>Layout</Label><Seg3 value={String(b.cols)} opts={[["1", "Column", <b key="1" className="font-serif text-[20px] font-normal">1</b>], ["2", "Columns", <b key="2" className="font-serif text-[20px] font-normal">2</b>], ["3", "Columns", <b key="3" className="font-serif text-[20px] font-normal">3</b>]]}
        set={(v) => { const n = Number(v) as 1 | 2 | 3; const cols = [...b.columns]; while (cols.length < n) cols.push({ ...(newBlock("text") as Extract<PageBlock, { type: "text" }>).columns[0]! }); patch(b.id, { cols: n, columns: cols }); }} />
        {b.columns.slice(0, b.cols).map((col, i) => { const set = (p: Partial<typeof col>) => patch(b.id, { columns: b.columns.map((x, j) => (j === i ? { ...x, ...p } : x)) }); return (
          <div key={`${b.id}-${i}`}><Band>{`Column ${i + 1}`}</Band><Label>Alignment</Label><Seg3 value={col.align} opts={AL} set={(v) => set({ align: v })} />
            <Label>Column Title</Label><div className="flex gap-2"><input aria-label={`Column ${i + 1} title`} placeholder="optional" className={Field} value={col.title} onChange={(e) => set({ title: e.target.value })} /><Swatch value={col.titleColor} onChange={(v) => set({ titleColor: v })} label="Title color" /></div>
            <Label>Text</Label><MailEditor label={`Column ${i + 1} text`} minHeight={90} initial={col.html} onChange={(h) => set({ html: sanitizeHtml(h) })} /></div>); })}</>;
      case "button": return <>{bg}<Label>Alignment</Label><Seg3 value={b.align} opts={[...AL, ["full", "Full", <AlignJustify key="f" className="size-5" />] as ["full", string, ReactNode]]} set={(v) => patch(b.id, { align: v })} />
        <Label>Number of Buttons</Label><Seg3 value={String(b.buttons.length)} opts={[["1", "Button", <b key="1" className="font-serif text-[20px] font-normal">1</b>], ["2", "Buttons", <b key="2" className="font-serif text-[20px] font-normal">2</b>], ["3", "Buttons", <b key="3" className="font-serif text-[20px] font-normal">3</b>]]}
          set={(v) => { const n = Number(v); const list = b.buttons.slice(0, n); while (list.length < n) list.push({ text: "Click Me", url: "", color: "#4a90d9" }); patch(b.id, { buttons: list }); }} />
        {b.buttons.map((x, i) => { const set = (p: Partial<typeof x>) => patch(b.id, { buttons: b.buttons.map((y, j) => (j === i ? { ...y, ...p } : y)) }); return (
          <div key={i}><Band>{`Button ${i + 1}`}</Band><Label>Text</Label><input aria-label={`Button ${i + 1} text`} className={Field} value={x.text} onChange={(e) => set({ text: e.target.value })} />
            <Label>Link</Label><input aria-label={`Button ${i + 1} link`} placeholder="https://" className={Field} value={x.url} onChange={(e) => set({ url: e.target.value })} />
            <Label>Button Color</Label><Swatch value={x.color} onChange={(v) => set({ color: v })} label="Button color" /></div>); })}</>;
      case "divider": return <>{bg}<p className="mt-5 text-[13px] text-[#777]">A thin line across the page. There is nothing else to set.</p></>;
      case "textimage": return <>{bg}<Label>Layout</Label><Seg3 value={b.layout} opts={[["left", "Left", <ImageIcon key="l" className="size-5" />], ["right", "Right", <ImageIcon key="r" className="size-5" />]]} set={(v) => patch(b.id, { layout: v })} />
        <Band>Image</Band><Label>Image</Label><div className="flex items-center gap-4">{b.image ? <img src={b.image} alt="" className="h-[80px] w-[120px] object-cover" /> : <div className="grid h-[80px] w-[120px] place-items-center bg-[#e3e3e3] text-[11px] text-[#999]">No image</div>}
          <button type="button" onClick={() => { fileRef.current!.onchange = () => void upload(fileRef.current!.files, (u) => patch(b.id, { image: u[0] ?? "" })); fileRef.current!.accept = "image/*"; fileRef.current!.multiple = false; fileRef.current!.click(); }} className="h-[34px] border border-[#d4d4d4] bg-[#f3f3f3] px-4 text-[14px] text-[#666] shadow-[0_1px_1px_rgba(0,0,0,.15)]">Choose File</button></div>
        <Label>Image Size</Label><Seg3 value={b.size} opts={[["S", "Small", <ImageIcon key="s" className="size-3.5" />], ["M", "Medium", <ImageIcon key="m" className="size-[18px]" />], ["L", "Large", <ImageIcon key="l" className="size-[22px]" />]]} set={(v) => patch(b.id, { size: v })} />
        <Band>Text</Band><Label>Text</Label><MailEditor label="Text" minHeight={90} initial={b.html} onChange={(h) => patch(b.id, { html: sanitizeHtml(h) })} /></>;
      case "images": return <>{bg}<Label>Images</Label><div className="flex flex-wrap gap-2.5">{b.images.map((s, i) => <div key={i} className="relative"><img src={s} alt="" className="h-[70px] w-[100px] object-cover" /><button type="button" aria-label="Remove image" onClick={() => patch(b.id, { images: b.images.filter((_, j) => j !== i) })} className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-[#333] text-white"><X className="size-3" /></button></div>)}</div>
        <button type="button" onClick={() => { fileRef.current!.onchange = () => void upload(fileRef.current!.files, (u) => patch(b.id, { images: [...b.images, ...u] })); fileRef.current!.accept = "image/*"; fileRef.current!.multiple = true; fileRef.current!.click(); }} className="mt-3 h-[34px] border border-[#d4d4d4] bg-[#f3f3f3] px-4 text-[14px] text-[#666] shadow-[0_1px_1px_rgba(0,0,0,.15)]">Choose Files</button></>;
      case "file": return <>{bg}<Band>Text</Band><Label>File Text</Label><input aria-label="File text" className={Field} value={b.text} onChange={(e) => patch(b.id, { text: e.target.value })} />
        <Band>File</Band><Label>Upload Type</Label><Seg3 value={b.mode} opts={[["upload", "Upload File", <UploadCloud key="u" className="size-5" />], ["url", "Paste URL", <Link2 key="l" className="size-5" />]]} set={(v) => patch(b.id, { mode: v })} />
        <Label>File</Label>{b.mode === "url" ? <input aria-label="File address" placeholder="https://" className={Field} value={b.url} onChange={(e) => patch(b.id, { url: e.target.value })} />
          : <div className="flex items-center justify-between border border-dashed border-[#d6d6d6] p-3"><span className="flex items-center gap-2 text-[14px] text-vc-site-blue"><FileText className="size-5 text-[#444]" strokeWidth={1.4} />{b.name || "Choose a file…"}</span>
            <button type="button" onClick={() => { fileRef.current!.onchange = () => void upload(fileRef.current!.files, (u, n) => patch(b.id, { url: u[0] ?? "", name: n[0] ?? "" })); fileRef.current!.accept = ""; fileRef.current!.multiple = false; fileRef.current!.click(); }} className="h-[34px] border border-[#d4d4d4] bg-[#f3f3f3] px-4 text-[14px] text-[#666] shadow-[0_1px_1px_rgba(0,0,0,.15)]">Choose File</button></div>}</>;
      case "embed": return <>{bg}<Label>Embed Code</Label><p className="text-[14px] text-[#444]">You can embed videos, maps, audio, images and much more. Only secure (https) iframe and embed tags are supported.</p>
        <textarea aria-label="Embed code" value={b.code} onChange={(e) => patch(b.id, { code: e.target.value })} spellCheck={false} className="mt-3 h-[150px] w-full resize-y bg-[#2f3a4f] p-3 font-mono text-[12px] text-white outline-none" /></>;
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white text-[14px]">
      <input ref={fileRef} type="file" hidden aria-label="Choose file" />
      <div className="flex h-[58px] shrink-0 items-center gap-3 border-b border-[#e3e3e3] border-t-2 border-t-[#4a64a0] px-3">
        <button type="button" onClick={onBack} className="flex h-[30px] items-center gap-1 border border-[#d4d4d4] bg-white px-3 text-[11px] font-bold uppercase text-[#444] shadow-[0_1px_1px_rgba(0,0,0,.15)]"><ArrowLeft className="size-3" strokeWidth={3} />Pages</button>
        <button type="button" onClick={() => { setTargets([]); setPub(true); }} className="flex h-[30px] items-center gap-1.5 rounded-[2px] border-b-[3px] border-b-vc-success-edge bg-vc-success px-3 text-[13px] font-semibold text-primary-foreground"><CircleCheck className="size-4" />Publish...</button>
        <div className="ml-auto flex items-center gap-5 pr-4 text-[13px] text-[#555]"><span>{state === "dirty" ? "Unsaved Changes" : "Saved a few seconds ago"}</span><button type="button" aria-label="Expand" onClick={() => setWide(!wide)}><Maximize2 className="size-5 text-[#999]" /></button><CircleHelp className="size-5 fill-black text-white" /></div>
        <div className="flex h-full w-[340px] shrink-0 items-center border-l border-[#e3e3e3]"><MoreVertical className="ml-2 size-4 text-[#888]" /><div className="flex-1 text-center text-[24px] font-light text-[#333]">{cur ? ({ header: "Header", text: "Text Only", button: "Button", divider: "Divider", textimage: "Text + Image", images: "Images", file: "File", embed: "Embed" })[cur.type] : "Add Section"}</div>
          {cur && <button type="button" onClick={() => setSel(null)} className="mr-1 h-[32px] rounded-[2px] border-b-[3px] border-b-vc-success-edge bg-vc-success px-4 text-[14px] font-semibold text-primary-foreground">Done</button>}</div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto bg-[#f0f0f2]" onClick={() => setSel(null)}>
          <div className={`mx-auto pb-24 pt-[34px] ${wide ? "max-w-[1100px]" : "max-w-[760px]"}`}>
            <div className="mb-3 flex items-baseline justify-between"><h1 className="text-[20px] font-semibold text-[#222]">{name}</h1><span className="text-[13px] text-[#444]">{format(new Date(), "EEEE, MMM d")}</span></div>
            {blocks.length === 0 ? <div className="grid h-[180px] place-items-center border-2 border-dashed border-[#d6d6d6] text-[18px] text-[#777]">Drag Section Blocks Here</div>
              : <div className="bg-white shadow-sm">{blocks.map((b, i) => (
                <div key={b.id} role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setSel(b.id); }} onKeyDown={(e) => { if (e.key === "Enter") setSel(b.id); }} className={`group relative cursor-pointer ${sel === b.id ? "outline outline-2 -outline-offset-1 outline-[#4a90d9]" : "hover:outline hover:outline-1 hover:outline-[#a9c9ec]"}`}>
                  <BlockView b={b} />
                  {sel === b.id && <>
                    <button type="button" aria-label="Move up" disabled={i === 0} onClick={(e) => { e.stopPropagation(); move(b.id, -1); }} className={`${tb} absolute -left-[42px] top-1/2 size-[44px] -translate-y-1/2 disabled:opacity-30`}><ChevronLeft className="size-5" /></button>
                    <button type="button" aria-label="Move down" disabled={i === blocks.length - 1} onClick={(e) => { e.stopPropagation(); move(b.id, 1); }} className={`${tb} absolute -right-[42px] top-1/2 size-[44px] -translate-y-1/2 disabled:opacity-30`}><ChevronRight className="size-5" /></button>
                    <span className={`${tb} absolute left-[58px] top-[-14px] size-[34px]`}><Move className="size-4" /></span>
                    <div className="absolute right-[58px] top-[-14px] flex gap-2">
                      <button type="button" aria-label="Edit block" onClick={(e) => { e.stopPropagation(); setSel(b.id); }} className={`${tb} size-[34px]`}><Pencil className="size-4" /></button>
                      <button type="button" aria-label="Duplicate block" onClick={(e) => { e.stopPropagation(); dup(b.id); }} className={`${tb} size-[34px]`}><Copy className="size-4" /></button>
                      <button type="button" aria-label="Delete block" onClick={(e) => { e.stopPropagation(); del(b.id); }} className={`${tb} size-[34px]`}><Trash2 className="size-4" /></button></div></>}
                </div>))}</div>}
          </div>
        </div>
        <aside className="w-[340px] shrink-0 overflow-y-auto border-l border-[#e3e3e3] bg-white px-[24px] pb-16 pt-[18px]">
          {cur ? panel(cur) : <div className="grid grid-cols-2 gap-[14px]">{TILES.map(([t, l, i]) => (
            <button key={t} type="button" onClick={() => add(t)} className="flex h-[88px] flex-col items-center justify-center gap-2 border border-[#e1e1e1] bg-white text-[12px] font-semibold text-[#222] shadow-[0_1px_1px_rgba(0,0,0,.08)] hover:border-[#4a90d9]">{i}{l}</button>))}</div>}
        </aside>
      </div>
      {pub && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" role="dialog" aria-label={`Publish Page: ${name}`}>
          <div className="w-[590px] bg-white shadow-xl">
            <div className="flex h-[44px] items-center justify-between bg-[#4a64a0] px-3 text-[16px] font-bold text-white">Publish Page: {name}<button type="button" aria-label="Close" onClick={() => setPub(false)}><X className="size-5" strokeWidth={3} /></button></div>
            <div className="min-h-[250px] px-3 pt-4"><div className="border-b border-dotted border-[#ccc] pb-1 text-[20px] font-light text-[#444]">Other Classes</div>
              <p className="mt-3 text-[14px] text-[#444]">Publish this page to other class websites</p>
              {others.length === 0 ? <p className="mt-3 text-[14px] text-[#444]">There are no other class websites to publish to.</p>
                : <ul className="mt-3 space-y-1.5">{others.map((o) => <li key={o.id}><label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={targets.includes(o.id)} onChange={(e) => setTargets(e.target.checked ? [...targets, o.id] : targets.filter((x) => x !== o.id))} />{o.code}: {o.name}</label></li>)}</ul>}</div>
            <div className="flex items-center gap-3 border-t border-[#e6e6e6] bg-[#fafafa] px-3 py-3"><button type="button" onClick={publish} className="h-[32px] border border-[#d4d4d4] bg-white px-4 text-[13px] font-bold shadow-[0_1px_1px_rgba(0,0,0,.15)]">Publish</button><span className="text-[#555]">or</span><button type="button" onClick={() => setPub(false)} className="text-[#888] underline">Cancel</button></div>
          </div>
        </div>)}
    </div>
  );
}
