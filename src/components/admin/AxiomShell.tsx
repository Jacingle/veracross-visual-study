import { useRouterState } from "@tanstack/react-router";
import { ChevronDown, Star } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { AddHoverMenu } from "@/components/admin/AdminTools";
import { HomepageAnchor, Launchpad, type Crumb } from "@/components/admin/Launchpad";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ALL_HOMEPAGES, homepageById, homepagesByGroup } from "@/lib/admin-homepages";
import { useAdminWorkspace } from "@/lib/admin-workspace";
import { isHomepagePath } from "@/lib/axiom-nav";
import { useSchool } from "@/lib/school-store";

export { AXIOM_LINKS } from "@/components/admin/axiom-links";

/**
 * Axiom (admin) frame, as in Veracross: the Launchpad bar stays at the top of every screen and is the way around (Rocket Ship,
 * Favorites, search, History, Workspaces, Help); there is no side menu. Detail screens keep their own left section menu (`side`).
 */
export function AxiomShell({ title, crumbs = [], actions, side, onUpdate, recordMenu, children }: { title: string; crumbs?: Crumb[]; actions?: ReactNode; /** Replaces the lightning-bolt menu on a record screen (Save to Workspace, Copy Record, Delete). */ recordMenu?: ReactNode; /** Kept for older screens; the frame no longer has a side rail. */ compactRail?: boolean; /** Left section menu for detail screens. */ side?: ReactNode; /** Shows the green UPDATE button in the bar; Ctrl or Cmd + S does the same. */ onUpdate?: (() => void) | undefined; children: ReactNode }) {
  const bar = <>{actions}{onUpdate && <button type="button" data-ax-update onClick={onUpdate} className="h-[30px] rounded-[3px] bg-ax-save px-5 text-[13px] font-bold tracking-wide text-primary-foreground active:brightness-90">UPDATE</button>}</>;
  return <RoleGate area="admin"><Frame title={title} crumbs={crumbs} actions={bar} recordMenu={recordMenu}>{side ? <div className="flex bg-background">{side}<main className="min-w-0 flex-1">{children}</main></div> : children}</Frame></RoleGate>;
}

function Frame({ title, crumbs, actions, recordMenu, children }: { title: string; crumbs: Crumb[]; actions: ReactNode; recordMenu: ReactNode; children: ReactNode }) {
  const { user } = useSchool();
  const workspace = useAdminWorkspace(user?.id);
  const path = useRouterState({ select: (r) => r.location.href });
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  useEffect(() => { if (workspace.ready && path) workspace.visit({ title, path }); }, [title, path, workspace.ready]);
  const here = pathname.startsWith("/admin/home/") ? homepageById(pathname.split("/")[3] ?? "") : pathname === "/admin" || pathname === "/admin/" ? homepageById("system") : undefined;
  return (
    <div className="min-h-screen bg-ax-side text-[13px]">
      <Launchpad title={title} crumbs={crumbs} actions={actions} recordMenu={recordMenu} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vc-line bg-background px-4 py-2">
        <h1 className="text-[18px] font-normal text-ax-top">{title}</h1>
        <div className="flex items-center gap-2">
          {!isHomepagePath(pathname) && <AddHoverMenu />}
          <Button variant="ghost" size="icon" aria-label="Favorite this page" title="Favorite this page" className="size-7" onClick={() => workspace.toggleFavorite({ title, path })}><Star className={`size-4 ${workspace.favorites.some((f) => f.path === path) ? "fill-current text-vc-tile-warm-fg" : "text-vc-gray"}`} /></Button>
          {isHomepagePath(pathname) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-7 text-[12px]">Related Pages<ChevronDown className="size-3" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[240px]">
                {[...homepagesByGroup()].sort((a, b) => Number(b.group === here?.group) - Number(a.group === here?.group)).map((g) => <div key={g.group}><DropdownMenuLabel className="text-[11px] uppercase text-muted-foreground">{g.group}</DropdownMenuLabel>{g.pages.filter((h) => h.id !== here?.id).map((h) => <DropdownMenuItem key={h.id} asChild><HomepageAnchor h={h}>{h.title}</HomepageAnchor></DropdownMenuItem>)}</div>)}
                {ALL_HOMEPAGES.length < 2 && <DropdownMenuLabel>No related pages</DropdownMenuLabel>}
              </DropdownMenuContent>
            </DropdownMenu>)}
        </div>
      </div>
      <main className="min-w-0 p-3 sm:p-4">{children}</main>
    </div>
  );
}

/** Axiom-style white panel with a grey header strip. */
export function Panel({ title, right, children, className = "" }: { title: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`border border-vc-line bg-background ${className}`}>
      <div className="flex items-center justify-between border-b border-vc-line bg-ax-head px-3 py-1.5 text-[13px] font-semibold">{title}{right}</div>
      <div className="p-3">{children}</div>
    </section>
  );
}
