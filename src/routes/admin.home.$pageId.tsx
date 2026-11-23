import { createFileRoute, Link } from "@tanstack/react-router";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { HomepageView } from "@/components/admin/HomepageView";
import { homepageById } from "@/lib/admin-homepages";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/admin/home/$pageId")({
  head: ({ params }) => pageHead(`Axiom · ${homepageById(params.pageId)?.title ?? "Homepage"}`, "Administrator homepage: every task for this area of the school, grouped."),
  component: Homepage,
});

function Homepage() {
  const { pageId } = Route.useParams();
  const h = homepageById(pageId);
  if (!h) return <AxiomShell title="Homepage not found"><p>No homepage called {pageId}. <Link to="/admin" className="text-vc-link-strong">Back to the System homepage</Link></p></AxiomShell>;
  return <AxiomShell title={h.title}><HomepageView page={h} /></AxiomShell>;
}
