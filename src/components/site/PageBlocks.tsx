import { FileText } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { BlockType, PageBlock } from "@/lib/class-site";

const uid = () => Math.random().toString(36).slice(2, 10);
const TITLE_BLUE = "#4aa3c8";

/** A fresh block with the placeholder content the Veracross page editor starts with. */
export function newBlock(type: BlockType): PageBlock {
  const id = uid();
  const col = { title: "", titleColor: TITLE_BLUE, html: "This is a Text Block! Click on this text to edit it. You can add content easily by dragging content blocks from the right sidebar. Drag this and other blocks around to re-order them.", align: "left" as const };
  switch (type) {
    case "header": return { id, type, text: "Enter Your Title Here!", align: "left", size: "M", bold: true, color: TITLE_BLUE };
    case "text": return { id, type, cols: 1, columns: [col] };
    case "button": return { id, type, align: "full", buttons: [{ text: "Click Me", url: "", color: "#4a90d9" }] };
    case "divider": return { id, type };
    case "textimage": return { id, type, layout: "left", image: "", size: "S", html: col.html };
    case "images": return { id, type, images: [] };
    case "file": return { id, type, text: "", mode: "upload", url: "", name: "" };
    case "embed": return { id, type, code: "" };
  }
}

/** Only an https iframe/embed source is kept from pasted embed code. */
export function embedSrc(code: string): { src: string; height: number } | null {
  const m = /<(?:iframe|embed)\b[^>]*?\ssrc\s*=\s*["']([^"']+)["']/i.exec(code);
  if (!m) return null;
  const src = (m[1] ?? "").replace(/&amp;/g, "&");
  if (!/^https:\/\//i.test(src)) return null;
  const h = /\sheight\s*=\s*["']?(\d{2,4})/i.exec(code);
  return { src, height: h ? Math.min(900, Number(h[1])) : 300 };
}

const SIZE = { S: "text-[18px]", M: "text-[26px]", L: "text-[34px]", XL: "text-[46px]" } as const;
const IMG = { S: "w-[22%]", M: "w-[38%]", L: "w-[56%]" } as const;
const safeHref = (u: string) => (/^(https?:|mailto:|data:)/i.test(u.trim()) ? u.trim() : "");

/** One block as the student sees it (and as it looks inside the editor canvas). */
export function BlockView({ b }: { b: PageBlock }) {
  const wrap = (children: React.ReactNode) => <div style={b.bg ? { background: b.bg } : undefined} className="px-[35px] py-[10px]">{children}</div>;
  switch (b.type) {
    case "header": {
      const t = <span className={`${SIZE[b.size]} ${b.bold ? "font-bold" : "font-normal"} font-[Arial,sans-serif] leading-tight`} style={{ color: b.color }}>{b.text}</span>;
      const href = b.link ? safeHref(b.link) : "";
      return wrap(<div style={{ textAlign: b.align }}>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{t}</a> : t}</div>);
    }
    case "text":
      return wrap(<div className={`grid gap-6 ${b.cols === 1 ? "grid-cols-1" : b.cols === 2 ? "grid-cols-2" : "grid-cols-3"}`}>{b.columns.slice(0, b.cols).map((c, i) => (
        <div key={i} style={{ textAlign: c.align }} className="font-[Arial,sans-serif] text-[13px] leading-[26px]">
          {c.title && <div className="mb-1 text-[18px] font-bold leading-6" style={{ color: c.titleColor }}>{c.title}</div>}
          <div className="[&_a]:text-vc-site-blue [&_a]:underline [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.html) }} />
        </div>))}</div>);
    case "button":
      return wrap(<div className={`flex gap-3 ${b.align === "center" ? "justify-center" : b.align === "right" ? "justify-end" : ""}`}>{b.buttons.map((x, i) => {
        const href = safeHref(x.url);
        const cls = `${b.align === "full" ? "flex-1" : "min-w-[120px] px-6"} block py-[14px] text-center font-[Arial,sans-serif] text-[15px] text-primary-foreground shadow-sm`;
        return href ? <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={cls} style={{ background: x.color }}>{x.text}</a> : <span key={i} className={cls} style={{ background: x.color }}>{x.text}</span>;
      })}</div>);
    case "divider": return wrap(<hr className="my-3 border-0 border-t border-[#d9d9d9]" />);
    case "textimage":
      return wrap(<div className={`flex items-start gap-5 ${b.layout === "right" ? "flex-row-reverse" : ""}`}>
        {b.image ? <img src={b.image} alt="" className={`${IMG[b.size]} shrink-0 object-cover`} /> : <div className={`${IMG[b.size]} grid aspect-[3/2] shrink-0 place-items-center bg-[#e3e3e3] text-[11px] text-[#999]`}>No image</div>}
        <div className="min-w-0 flex-1 font-[Arial,sans-serif] text-[13px] leading-[26px] [&_a]:text-vc-site-blue [&_a]:underline [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(b.html) }} />
      </div>);
    case "images":
      return wrap(b.images.length ? <div className="flex flex-col gap-3">{b.images.map((s, i) => <img key={i} src={s} alt="" className="w-full" />)}</div> : <div className="grid h-[120px] place-items-center bg-[#e3e3e3] text-[12px] text-[#999]">No images yet</div>);
    case "file": {
      const href = b.url ? safeHref(b.url) : "";
      const label = b.text || b.name || "Choose a file…";
      return wrap(<div className="flex items-center gap-2 text-[14px]"><FileText className="size-[18px] text-[#444]" strokeWidth={1.4} />{href ? <a href={href} download={b.mode === "upload" ? b.name || true : undefined} target="_blank" rel="noopener noreferrer" className="text-vc-site-blue hover:underline">{label}</a> : <span className="text-vc-site-blue">{label}</span>}</div>);
    }
    case "embed": {
      const e = embedSrc(b.code);
      return wrap(e ? <iframe src={e.src} title="Embedded content" width="100%" height={e.height} frameBorder={0} sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" allow="fullscreen" /> : <div className="grid h-[90px] place-items-center bg-[#e3e3e3] text-[12px] text-[#999]">Paste embed code to show it here</div>);
    }
  }
}

/** A whole page: its blocks stacked in a white column. */
export function BlocksView({ blocks }: { blocks: PageBlock[] }) {
  return <div className="bg-background">{blocks.map((b) => <BlockView key={b.id} b={b} />)}</div>;
}
