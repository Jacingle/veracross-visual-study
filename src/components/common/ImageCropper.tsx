import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Pick a photo, drag to position and zoom inside a fixed frame, then save a cropped JPEG data URL. */
export function ImageCropper({ open, onClose, onSave, aspect, outWidth, title = "Crop Photo" }: {
  open: boolean; onClose: () => void; onSave: (dataUrl: string) => void; aspect: number; outWidth: number; title?: string;
}) {
  const [src, setSrc] = useState("");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const FW = 420, FH = Math.round(FW / aspect);
  useEffect(() => { if (!open) { setSrc(""); setImg(null); setZoom(1); setOff({ x: 0, y: 0 }); } }, [open]);
  useEffect(() => { if (!src) return; let active = true; const i = new Image(); i.onload = () => { if (active) { setImg(i); setLoading(false); } }; i.onerror = () => { if (active) { setLoading(false); toast.error("This photo cannot be opened. Please choose a JPG, PNG or WebP photo."); } }; i.src = src; return () => { active = false; }; }, [src]);
  // Image is scaled to cover the frame at zoom 1.
  const base = img ? Math.max(FW / img.width, FH / img.height) : 1;
  const w = img ? img.width * base * zoom : 0, h = img ? img.height * base * zoom : 0;
  const clamp = (o: { x: number; y: number }) => ({ x: Math.min(0, Math.max(FW - w, o.x)), y: Math.min(0, Math.max(FH - h, o.y)) });
  const pos = clamp(off.x === 0 && off.y === 0 && img ? { x: (FW - w) / 2, y: (FH - h) / 2 } : off);
  const save = () => {
    if (!img) return;
    const cv = document.createElement("canvas"); const k = outWidth / FW;
    cv.width = outWidth; cv.height = Math.round(FH * k);
    const context = cv.getContext("2d");
    if (!context) return;
    context.drawImage(img, pos.x * k, pos.y * k, w * k, h * k);
    try { onSave(cv.toDataURL("image/jpeg", 0.82)); onClose(); } catch { toast.error("Photo could not be saved. Please try another photo."); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[480px] text-[13px]">
        <DialogHeader><DialogTitle className="text-[17px]">{title}</DialogTitle></DialogHeader>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label="Choose photo" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; e.target.value = ""; if (f.size > 20e6) { toast.error("Please choose a photo under 20 MB."); return; } setLoading(true); setImg(null); const r = new FileReader(); r.onerror = () => { setLoading(false); toast.error("Photo could not be read."); }; r.onload = () => { setOff({ x: 0, y: 0 }); setZoom(1); setSrc(String(r.result)); }; r.readAsDataURL(f); }} />
        <div className="relative mx-auto max-w-full touch-none overflow-hidden bg-muted" style={{ width: FW, aspectRatio: aspect, cursor: img ? "grab" : "default" }}
          onPointerDown={(e) => { if (!img) return; (e.target as Element).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y }; }}
          onPointerMove={(e) => { const d = drag.current; const scale = FW / e.currentTarget.clientWidth; if (d) setOff(clamp({ x: d.ox + (e.clientX - d.x) * scale, y: d.oy + (e.clientY - d.y) * scale })); }}
          onPointerUp={() => { drag.current = null; }}>
          {img ? <img src={src} alt="Crop preview" draggable={false} style={{ position: "absolute", left: `${pos.x / FW * 100}%`, top: `${pos.y / FH * 100}%`, width: `${w / FW * 100}%`, height: `${h / FH * 100}%`, maxWidth: "none" }} />
            : <div className="grid h-full place-items-center text-muted-foreground">{loading ? "Opening photo…" : "Choose a photo"}</div>}
        </div>
        {img && <label className="flex items-center gap-3">Zoom<Slider min={1} max={3} step={0.05} value={[zoom]} onValueChange={([z]) => { if (z !== undefined) setZoom(z); }} /></label>}
        <p className="text-[12px] text-muted-foreground">Drag the photo to position it inside the frame.</p>
        <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="button" size="sm" disabled={!img || loading} onClick={save}>Save Photo</Button></div>
      </DialogContent>
    </Dialog>
  );
}
