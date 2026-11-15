import { Landmark } from "lucide-react";

/** Original school portal mark. */
export function VcLogo({ className = "h-5 w-6" }: { className?: string }) {
  return <Landmark className={className} strokeWidth={1.5} aria-hidden />;
}
