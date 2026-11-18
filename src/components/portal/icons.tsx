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

/** Light outlined envelope with corner ticks (empty inbox on Student Home). */
export function MailOutline(p: P) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <rect x="2" y="6" width="44" height="36" />
      <path d="M3 9l21 17L45 9" />
      <path d="M10 36l5-5M38 36l-5-5" />
    </svg>
  );
}

/** White disc with a play triangle cut out (Submit Assignments). */
export function PlayDisc(p: P) {
  return (
    <svg {...solid} {...p}>
      <circle cx="12" cy="12" r="11" />
      <path d="M9.6 6.8v10.4L17.4 12z" style={cutFill} />
    </svg>
  );
}

/** Solid house (Veracross Online School / Home). */
export function HomeSolid(p: P) {
  return <svg {...solid} {...p}><path d="M12 2.5 1 12.2h3V21h6.2v-6h3.6v6H20v-8.8h3z" /></svg>;
}

/** Solid building with window cut-outs (School News & Events). */
export function BuildingSolid(p: P) {
  return (
    <svg {...solid} {...p}>
      <path d="M4 2h11v20H4zM16.5 8H21v14h-4.5z" />
      <path d="M7 5h2v2H7zm4 0h2v2h-2zM7 9h2v2H7zm4 0h2v2h-2zM7 13h2v2H7zm4 0h2v2h-2z" style={cutFill} />
    </svg>
  );
}

/** Solid open folder (Faculty Resource Page). */
export function FolderSolid(p: P) {
  return <svg {...solid} {...p}><path d="M2 4h7.5l2 2.5H20V10H6.5L3.5 19H2zM7.4 11.5H23l-3.2 8.5H4.2z" /></svg>;
}

/** Solid briefcase (My Classes Page / Grade & Student Management). */
export function BriefcaseSolid(p: P) {
  return (
    <svg {...solid} {...p}>
      <path d="M2 7h20v13H2z" />
      <path d="M8.5 7V4.5h7V7" style={cutStroke} strokeWidth="1.8" />
      <path d="M2 12.5h20" style={cutStroke} strokeWidth="1.4" />
    </svg>
  );
}

/** Solid receipt (Purchase Requests). */
export function ReceiptSolid(p: P) {
  return (
    <svg {...solid} {...p}>
      <path d="M5 2h14v20l-2.3-1.6L14.3 22 12 20.4 9.7 22l-2.4-1.6L5 22z" />
      <path d="M8.5 7.5h7M8.5 11.5h7M8.5 15.5h4.5" style={cutStroke} strokeWidth="1.6" />
    </svg>
  );
}

/** School crest: an Ionic column capital with a scrolled volute and three fluted shafts. */
export function Crest(p: P) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d="M4 6.5h33" />
      <path d="M13 11.5H5.8C2.5 11.5 2 16 5 17.5c3 1.400 6-.6 4.700-3.200-1-1.800-3.800-1-3.400.9" />
      <path d="M17 11.5h18M15 17v19M22 17v19M29 17v19" />
    </svg>
  );
}
