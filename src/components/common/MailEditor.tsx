import { useEffect, useRef } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Eraser, Indent, Italic, Link2, List, ListOrdered, Outdent, Redo2, Strikethrough, Underline, Undo2 } from "lucide-react";

const COLORS = ["#000000", "#555555", "#c0392b", "#e67e22", "#27ae60", "#2980b9", "#8e44ad"];
const SIZES: [string, string][] = [["Small", "2"], ["Normal", "3"], ["Large", "5"], ["Huge", "6"]];
const FONTS = ["Source Sans 3", "Arial", "Georgia", "Times New Roman", "Courier New", "Verdana"];

/** Rich-text writing area for school mail: fonts, sizes, colours, lists, alignment, links. Reports its HTML on every edit. */
export function MailEditor({ onChange, minHeight = 260, label = "Message", initial = "" }: { onChange: (html: string, text: string) => void; minHeight?: number; label?: string; initial?: string }) {
  const area = useRef<HTMLDivElement>(null);
  useEffect(() => { if (area.current && initial) area.current.innerHTML = initial; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { try { document.execCommand("styleWithCSS", false, "false"); } catch { /* older browsers */ } }, []);
  const run = (cmd: string, arg?: string) => { area.current?.focus(); try { document.execCommand(cmd, false, arg); } catch { /* ignore */ } emit(); };
  const emit = () => { const el = area.current; if (el) onChange(el.innerHTML, el.innerText); };
  const Btn = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className="grid h-[26px] w-[26px] place-items-center rounded-[3px] text-[#555] hover:bg-[#e8eef4]">{children}</button>
  );
  const sel = "h-[26px] rounded-[3px] border border-[#d6d6d6] bg-white px-1 text-[12px] text-[#444]";
  const sep = <span aria-hidden className="mx-1 h-[18px] w-px bg-[#d6d6d6]" />;
  return (
    <div className="border border-[#d6d6d6] bg-white">
      <div role="toolbar" aria-label="Writing tools" className="flex flex-wrap items-center gap-0.5 border-b border-[#d6d6d6] bg-[#f7f7f7] px-1.5 py-1">
        <Btn title="Undo" onClick={() => run("undo")}><Undo2 className="size-3.5" /></Btn>
        <Btn title="Redo" onClick={() => run("redo")}><Redo2 className="size-3.5" /></Btn>{sep}
        <select aria-label="Font" className={sel} defaultValue="" onChange={(e) => { if (e.target.value) run("fontName", e.target.value); e.target.value = ""; }}><option value="">Font</option>{FONTS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
        <select aria-label="Size" className={sel} defaultValue="" onChange={(e) => { if (e.target.value) run("fontSize", e.target.value); e.target.value = ""; }}><option value="">Size</option>{SIZES.map(([l, v]) => <option key={v} value={v}>{l}</option>)}</select>{sep}
        <Btn title="Bold" onClick={() => run("bold")}><Bold className="size-3.5" /></Btn>
        <Btn title="Italic" onClick={() => run("italic")}><Italic className="size-3.5" /></Btn>
        <Btn title="Underline" onClick={() => run("underline")}><Underline className="size-3.5" /></Btn>
        <Btn title="Strikethrough" onClick={() => run("strikeThrough")}><Strikethrough className="size-3.5" /></Btn>{sep}
        {COLORS.map((c) => <button key={c} type="button" title={`Text colour ${c}`} aria-label={`Text colour ${c}`} onMouseDown={(e) => e.preventDefault()} onClick={() => run("foreColor", c)} className="size-[14px] rounded-full border border-black/10" style={{ background: c }} />)}{sep}
        <Btn title="Bulleted list" onClick={() => run("insertUnorderedList")}><List className="size-3.5" /></Btn>
        <Btn title="Numbered list" onClick={() => run("insertOrderedList")}><ListOrdered className="size-3.5" /></Btn>
        <Btn title="Decrease indent" onClick={() => run("outdent")}><Outdent className="size-3.5" /></Btn>
        <Btn title="Increase indent" onClick={() => run("indent")}><Indent className="size-3.5" /></Btn>{sep}
        <Btn title="Align left" onClick={() => run("justifyLeft")}><AlignLeft className="size-3.5" /></Btn>
        <Btn title="Align centre" onClick={() => run("justifyCenter")}><AlignCenter className="size-3.5" /></Btn>
        <Btn title="Align right" onClick={() => run("justifyRight")}><AlignRight className="size-3.5" /></Btn>{sep}
        <Btn title="Insert link" onClick={() => { const u = window.prompt("Link address (https://…)"); if (u && /^(https?:|mailto:)/i.test(u.trim())) run("createLink", u.trim()); }}><Link2 className="size-3.5" /></Btn>
        <Btn title="Clear formatting" onClick={() => run("removeFormat")}><Eraser className="size-3.5" /></Btn>
      </div>
      <div ref={area} role="textbox" aria-multiline aria-label={label} contentEditable suppressContentEditableWarning onInput={emit} style={{ minHeight }} className="px-3 py-2.5 text-[13px] leading-[18px] text-black outline-none [&_a]:text-vc-link [&_a]:underline [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc" />
    </div>
  );
}
