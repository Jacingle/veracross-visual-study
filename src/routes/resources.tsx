import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CalendarDays, CalendarPlus, GraduationCap, HeartPulse, Laptop, Library, MessagesSquare, Shirt, ShoppingBag, Trophy, Utensils } from "lucide-react";
import { toast } from "sonner";
import { PortalShell } from "@/components/portal/PortalShell";
import { RESOURCE_TILES } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

const ICONS = [CalendarDays, Utensils, CalendarPlus, GraduationCap, BookOpen, Library, ShoppingBag, Shirt, Trophy, MessagesSquare, Laptop, HeartPulse];

export const Route = createFileRoute("/resources")({
  head: () => pageHead("Resources", "Calendars, menus, handbooks and help links for students."),
  component: () => (
    <PortalShell>
      <div className="border-b border-vc-line px-4 py-3.5 text-[18px]">Resources</div>
      <div className="grid grid-cols-4 gap-4 p-6">
        {RESOURCE_TILES.map((t, i) => { const Icon = ICONS[i] ?? BookOpen; return (
          <button key={t} onClick={() => toast(t, { description: "This resource opens the school's linked document." })}
            className="flex h-[118px] flex-col items-center justify-center gap-2.5 border-2 border-vc-resource-edge bg-vc-resource px-3 text-center text-[14px] text-primary-foreground hover:brightness-110">
            <Icon className="size-8" strokeWidth={1.5} />{t}
          </button>); })}
      </div>
    </PortalShell>
  ),
});
