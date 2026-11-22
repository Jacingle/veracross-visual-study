/** Small allow-list sanitizer for message bodies written in the mail editor (no scripts, no event handlers, safe links only). */
const OK = new Set(["B", "STRONG", "I", "EM", "U", "S", "STRIKE", "UL", "OL", "LI", "BR", "P", "DIV", "SPAN", "A", "FONT", "BLOCKQUOTE", "H1", "H2", "H3"]);
const DROP = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META", "FORM", "INPUT", "BUTTON", "SVG", "IMG"]);
const STYLE_OK = /^(color|background-color|font-size|font-weight|font-style|text-decoration|text-align|margin-left|padding-left)$/;

export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (node: Node) => {
    for (const ch of Array.from(node.childNodes)) {
      if (ch.nodeType === 3) continue;
      if (ch.nodeType !== 1) { ch.parentNode?.removeChild(ch); continue; }
      const el = ch as HTMLElement;
      if (DROP.has(el.tagName.toUpperCase())) { el.remove(); continue; }
      if (!OK.has(el.tagName)) { walk(el); el.replaceWith(...Array.from(el.childNodes)); continue; }
      for (const a of Array.from(el.attributes)) {
        const n = a.name.toLowerCase();
        if (el.tagName === "A" && n === "href" && /^(https?:|mailto:)/i.test(a.value.trim())) continue;
        if (el.tagName === "FONT" && (n === "size" || n === "color") && /^[#\w]+$/.test(a.value)) continue;
        if (n === "style") {
          const keep = a.value.split(";").map((d) => d.trim()).filter((d) => { const [k, ...v] = d.split(":"); return k && STYLE_OK.test(k.trim().toLowerCase()) && /^[#\w\s.,()%-]+$/.test(v.join(":").trim()); });
          if (keep.length) el.setAttribute("style", keep.join("; ")); else el.removeAttribute("style");
          continue;
        }
        el.removeAttribute(a.name);
      }
      if (el.tagName === "A") { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener noreferrer"); }
      walk(el);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
