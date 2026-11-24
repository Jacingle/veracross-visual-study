import { LOGO_MAX_BYTES } from "./school-info";

const readUrl = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
/** Read a logo picture as a data URL, shrinking big raster pictures so the saved school record stays small. SVG is kept as is. */
export async function readLogo(file: File, maxW = 600, maxH = 300): Promise<string> {
  if (!/^image\/(png|jpe?g|gif|webp|svg\+xml)$/i.test(file.type)) throw new Error("Choose a PNG, JPG, GIF, WebP or SVG picture.");
  if (file.size > LOGO_MAX_BYTES) throw new Error("That picture is larger than 2 MB.");
  const url = await readUrl(file);
  if (file.type === "image/svg+xml") return url;
  try {
    // If the browser never reports the picture as loaded, keep the original rather than waiting forever.
    const img = await new Promise<HTMLImageElement | null>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("The picture could not be read.")); i.src = url; setTimeout(() => res(null), 4000); });
    if (!img) return url;
    const k = Math.min(1, maxW / img.width, maxH / img.height);
    if (k >= 1) return url;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * k); canvas.height = Math.round(img.height * k);
    const ctx = canvas.getContext("2d");
    if (!ctx) return url;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch { return url; }
}
