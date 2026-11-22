import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { homepageById, type HomeLink } from "@/lib/admin-homepages";
import { useRecordWindow } from "@/lib/record-window";
import { useNavigate } from "@tanstack/react-router";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/home/$pageId")({
  head: ({ params }) => pageHead(`Axiom · ${homepageById(params.pageId)?.title ?? "Homepage"}`, "Administrator homepage: every task for this area of the school, grouped."),
  component: Homepage,
});

const linkCls = "block py-[3px] text-[14px] text-vc-link-strong hover:underline";
const btnCls = "my-1 inline-flex items-center gap-2 border border-vc-line bg-vc-panel px-3 py-1.5 text-[14px] text-foreground hover:bg-ax-head";

function Homepage() {
  const { pageId } = Route.useParams();
  const h = homepageById(pageId);
  const openRecord = useRecordWindow();
  const nav = useNavigate();
  if (!h) return <AxiomShell title="Homepage not found"><p>No homepage called {pageId}. <Link to="/admin" className="text-vc-link-strong">Back to the System homepage</Link></p></AxiomShell>;
  const run = (a: "new-course" | "new-class" | "new-person") => { if (a === "new-course") openRecord("/admin/course/new"); else if (a === "new-class") openRecord("/admin/class/new"); else nav({ to: "/admin/users", search: { add: "user" } }); };
  const render = (l: HomeLink) => "action" in l
    ? <button key={l.label} type="button" onClick={() => run(l.action)} className={btnCls}><Plus className="size-4" />{l.label}</button>
    : <Link key={`${l.to}${JSON.stringify(l.search ?? {})}${l.label}`} to={l.to} search={(l.search ?? {}) as never} className={linkCls}>{l.label}</Link>;
  return (
    <AxiomShell title={h.title}>
      <div className="mx-auto max-w-[1240px] border border-vc-line bg-background">
        <div role="tablist" className="flex border-b border-vc-line bg-vc-panel"><span role="tab" aria-selected className="border-r border-vc-line bg-background px-6 py-3 text-[15px] font-semibold">Homepage</span></div>
        <h2 className="px-5 pb-1 pt-5 text-[30px] font-light text-ax-top">{h.heading}</h2>
        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
          {h.sections.map((s) => (
            <section key={s.title} aria-label={s.title} className="min-h-[220px] border border-vc-line border-t-2 border-t-ax-panel bg-background">
              <h3 className="bg-vc-panel px-4 py-2 text-[17px] font-light">{s.title}</h3>
              <div className="space-y-4 px-4 py-3">
                {s.groups.map((g) => <div key={g.heading}><h4 className="mb-1 text-[14px] font-bold">{g.heading}</h4>{g.links.map(render)}</div>)}
              </div>
            </section>))}
        </div>
      </div>
    </AxiomShell>
  );
}
