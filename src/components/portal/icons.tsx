import type { SVGProps } from "react";

/**
 * Solid portal icons that the stock icon set lacks. They paint with currentColor; the details that
 * "cut out" of the solid shape read the `--cut` custom property, which the parent sets to the
 * background behind the icon (so one icon works on the nav bar, tiles and hover states).
 */
type P = SVGProps<SVGSVGElement>;
const solid = { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true } as const;
const cutFill = { fill: "var(--cut, var(--background))" };
const cutStroke = { stroke: "var(--cut, var(--background))", fill: "none" };

export function SharpEnvelope(p: P) {
  return <svg {...solid} {...p}><rect x="1" y="4" width="22" height="16" /><path d="M2 5l10 8L22 5M2 19l7-7M22 19l-7-7" style={cutStroke} strokeWidth="1.7" /></svg>;
}

export function ResourcesIcon(p: P) {
  return <svg {...solid} {...p}><path d="M2 2h20v20H2z" /><circle cx="12" cy="7" r="3" style={cutFill} /><path d="M7 20v-5c0-5 10-5 10 0v5M4 4v16M20 4v16" style={cutStroke} strokeWidth="2" /></svg>;
}

/** Square bullets with bold rules (Classes & Reports). */
export function ListSquares(p: P) {
  return (
    <svg {...solid} {...p}>
      {[3, 9.5, 16].map((y) => <rect key={y} x="2" y={y} width="5" height="5" rx=".6" />)}
      {[4.4, 10.9, 17.4].map((y) => <rect key={y} x="9.5" y={y} width="12.5" height="2.2" />)}
    </svg>
  );
}

/** Solid clock face with hands and quarter ticks (Daily Schedule). */
export function ClockSolid(p: P) {
  return (
    <svg {...solid} {...p}>
      <circle cx="12" cy="12" r="10.5" />
      <path d="M12 6.4V12l3.5 2.1" style={cutStroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3.6v1.3M12 19.1v1.3M3.6 12h1.3M19.1 12h1.3" style={cutStroke} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Solid basketball (Athletic Calendar). */
export function Basketball(p: P) {
  return (
    <svg {...solid} {...p}>
      <circle cx="12" cy="12" r="10.5" />
      <g style={cutStroke} strokeWidth="1.2" strokeLinecap="round">
        <path d="M12 1.5v21M1.5 12h21" />
        <path d="M4.6 3.9c4 3.6 4 12.6 0 16.2M19.4 3.9c-4 3.6-4 12.6 0 16.2" />
      </g>
    </svg>
  );
}

/** Solid book with a bookmark ribbon notch (Assignments / Assignment Planner). */
export function BookRibbon(p: P) {
  return (
    <svg {...solid} {...p}>
      <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M13.5 2v7.2l2.25-1.7L18 9.2V2z" style={cutFill} />
      <rect x="4" y="17.2" width="16" height="1.6" style={cutFill} />
    </svg>
  );
}

/** Solid desk phone (Directories). */
export function DeskPhone(p: P) {
  return (
    <svg {...solid} {...p}>
      <path d="M3 9.2C3 7 7.2 5.5 12 5.5s9 1.5 9 3.7V11h-5.2V9.4a15 15 0 0 0-7.6 0V11H3z" />
      <path d="M5.2 12.6h13.6l2 7.4H3.2z" />
      <circle cx="12" cy="16.3" r="2.5" style={cutFill} />
    </svg>
  );
}

/** Outline sprout on a ground line (NWEA MAP Growth report). */
export function SproutLine(p: P) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d="M3 35h13.5M23.5 35H37" />
      <circle cx="20" cy="35" r="3.4" />
      <path d="M20 31.6V13" />
      <path d="M20 23c-6.5 0-10-4-10-9.5 6.5 0 10 3.5 10 9.5z" />
      <path d="M20 17c5.5 0 9-3 9-8.5-5.5 0-9 3-9 8.5z" />
    </svg>
  );
}
