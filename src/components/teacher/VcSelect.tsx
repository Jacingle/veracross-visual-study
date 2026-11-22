import { Children, isValidElement, useEffect, useRef, useState, type ChangeEvent, type ReactElement, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Opt = { value: string; label: ReactNode; disabled?: boolean };

/** Drop-in replacement for a native <select> with the Veracross list look: white list, blue highlighted row with white text. */
export function VcSelect({ children, value, onChange, className = "", disabled, ...rest }: {
  children: ReactNode; value?: string; onChange?: (e: ChangeEvent<HTMLSelectElement>) => void; className?: string; disabled?: boolean; "aria-label"?: string;
}) {
  const opts: Opt[] = [];
  Children.forEach(children, (ch) => {
    if (!isValidElement(ch)) return;
    const el = ch as ReactElement<{ value?: string; children?: ReactNode; disabled?: boolean }>;
    const label = el.props.children;
    opts.push({ value: String(el.props.value ?? (typeof label === "string" ? label : "")), label, disabled: el.props.disabled });
  });
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);
  const cur = value === undefined ? opts[0] : opts.find((o) => o.value === String(value));
  const pick = (v: string) => { setOpen(false); onChange?.({ target: { value: v }, currentTarget: { value: v } } as unknown as ChangeEvent<HTMLSelectElement>); };
  return (
    <div ref={ref} className={`relative inline-block max-w-full align-top ${/(^|\s)!?w-full/.test(className) ? "!block w-full" : ""}`}>
      <button type="button" aria-label={rest["aria-label"]} aria-haspopup="listbox" aria-expanded={open} disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        className={`flex cursor-pointer items-center justify-between gap-1 truncate whitespace-nowrap text-left outline-none disabled:cursor-default ${className}`}>
        <span className="min-w-0 flex-1 truncate">{cur?.label ?? ""}</span>
        {!className.includes("bg-transparent") && <ChevronDown aria-hidden className="size-[13px] shrink-0 text-[#666]" strokeWidth={1.75} />}
      </button>
      {open && (
        <ul role="listbox" className="absolute left-0 top-full z-[60] mt-[2px] min-w-full max-h-[260px] overflow-auto border border-[#d6d6d6] bg-white py-0 text-[12px] leading-[17px] text-[#4a4a4a] shadow-[0_2px_6px_rgba(0,0,0,.12)]">
          {opts.map((o) => {
            const on = (hot ?? String(value ?? "")) === o.value;
            return (
              <li key={o.value} role="option" aria-selected={o.value === String(value ?? "")} aria-disabled={o.disabled}
                onMouseEnter={() => !o.disabled && setHot(o.value)} onMouseLeave={() => setHot(null)}
                onClick={() => !o.disabled && pick(o.value)}
                className={`h-[28px] cursor-pointer whitespace-nowrap px-[10px] leading-[28px] ${o.disabled ? "text-[#aaa]" : on ? "bg-[#3b8fe8] text-white" : ""}`}>{o.label}</li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
