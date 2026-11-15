import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { PortalShell } from "@/components/portal/PortalShell";
import { RESOURCES } from "@/lib/sis-data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/resources")({
  head: () => pageHead("Resources", "Handbooks, policies and help documents for students."),
  component: () => (
    <PortalShell>
      <div className="border-b border-vc-line px-5 py-5 text-[22px]">Resources</div>
      <div className="grid grid-cols-3 gap-8 p-8">
        {RESOURCES.map((g) => (
          <div key={g.group}><h2 className="mb-3 border-b border-vc-line pb-2 text-[22px]">{g.group}</h2>
            <ul className="space-y-3">{g.items.map((i) => <li key={i}><button onClick={() => toast(`${i}`, { description: "Document preview coming soon." })} className="flex items-center gap-2 text-vc-link-strong hover:underline"><FileText className="size-4" />{i}</button></li>)}</ul></div>
        ))}
      </div>
    </PortalShell>
  ),
});
