import { Plus, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { RoleGate } from "@/components/auth/RoleGate";

/** Frame for a record opened in its own window: blue title bar, one green action button, then the form full width. */
export function RecordWindow({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <RoleGate area="admin">
      <div className="min-h-screen bg-background text-[13px]">
        <header className="sticky top-0 z-30 flex h-[46px] items-center gap-2 bg-ax-bar px-3 text-primary-foreground shadow-sm">
          <h1 className="min-w-0 flex-1 truncate text-[16px] font-normal">{title}</h1>
          {action}
          <span aria-hidden className="grid h-[34px] w-[46px] place-items-center border-l border-primary-foreground/40 bg-primary-foreground/10"><Zap className="size-5" fill="currentColor" /></span>
          <span aria-hidden className="grid h-[34px] w-[46px] place-items-center border-l border-primary-foreground/40 bg-primary-foreground/10"><Plus className="size-5" strokeWidth={3} /></span>
        </header>
        {children}
      </div>
    </RoleGate>
  );
}
