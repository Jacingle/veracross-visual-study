/** Original column mark used for the portal switcher (stands in for the vendor logo). */
export function VcLogo({ className = "h-5 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 22" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M2 6.5C6 2.5 13 1.5 19 3.2c3 .8 5.4 2.4 6.8 4.3" strokeLinecap="round" />
      <path d="M6 8h15M7.5 8v12M11.5 8v12M15.5 8v12M19.5 8v12M5 20.5h17" strokeLinecap="round" />
    </svg>
  );
}
