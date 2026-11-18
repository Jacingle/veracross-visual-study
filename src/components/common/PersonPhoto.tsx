import { useEffect, useState } from 'react';
import placeholder from '@/assets/default-profile.asset.json';
import { useSchool } from '@/lib/school-store';

const cache = new Map<string, string>();

/**
 * Responsive image loading: uploaded photos are stored once at high resolution, so for a known
 * display size we draw a cover-cropped copy at (display size x device pixel ratio) and use that.
 * Existing photos work as-is; nothing needs re-uploading.
 */
function useSized(src: string | undefined, w?: number, h?: number) {
  const [out, setOut] = useState<{ src: string; url: string } | null>(null);
  useEffect(() => {
    if (!src || !w || !h || !src.startsWith('data:')) return;
    const dpr = Math.min(3, Math.max(1, Math.ceil(window.devicePixelRatio || 1)));
    const tw = Math.round(w * dpr), th = Math.round(h * dpr);
    const key = `${tw}x${th}:${src.length}:${src.slice(-48)}`;
    const hit = cache.get(key);
    if (hit) { setOut({ src, url: hit }); return; }
    let live = true;
    const img = new Image();
    img.onload = () => {
      if (!live) return;
      if (img.width <= tw * 1.1 && img.height <= th * 1.1) { cache.set(key, src); setOut({ src, url: src }); return; }
      const s = Math.max(tw / img.width, th / img.height);
      const sw = tw / s, sh = th / s;
      const cv = document.createElement('canvas'); cv.width = tw; cv.height = th;
      const cx = cv.getContext('2d'); if (!cx) return;
      cx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, tw, th);
      const url = cv.toDataURL('image/jpeg', 0.85);
      cache.set(key, url); setOut({ src, url });
    };
    img.src = src;
    return () => { live = false; };
  }, [src, w, h]);
  return out && out.src === src ? out.url : src;
}

/** True when this person has uploaded a photo (otherwise the shared placeholder is shown). */
export function useHasPhoto(personId?: string) {
  const { photos, fullPhotos } = useSchool();
  return Boolean(personId && (fullPhotos[personId] || photos[personId]));
}

/**
 * `fit` renders the photo at an exact CSS size (and loads a matching-resolution copy). With
 * `squareIfMissing`, people without a photo get a square placeholder of the fit width instead.
 */
export function PersonPhoto({ personId, className = 'size-16', alt = 'Profile', full = false, fit, squareIfMissing = false }: { personId?: string | undefined; className?: string; alt?: string; full?: boolean; fit?: { w: number; h: number }; squareIfMissing?: boolean }) {
  const { photos, fullPhotos } = useSchool();
  const source = personId ? (full ? fullPhotos[personId] || photos[personId] : photos[personId]) : undefined;
  const square = Boolean(fit && squareIfMissing && !source);
  const w = fit ? fit.w : undefined, h = fit ? (square ? fit.w : fit.h) : undefined;
  const sized = useSized(source, w, h);
  if (fit) return <img src={sized || placeholder.url} alt={alt} width={w} height={h} loading="lazy" decoding="async" style={{ width: w, height: h }} className={`shrink-0 rounded-none object-cover ${className}`} />;
  return <img src={sized || placeholder.url} alt={alt} loading="lazy" decoding="async" className={`shrink-0 rounded-[4px] ${full ? 'h-auto object-contain' : 'aspect-square object-cover'} ${className}`} />;
}
