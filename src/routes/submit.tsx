import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { SubmissionCenter } from "@/components/portal/SubmissionCenter";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/submit")({
  validateSearch: (s: Record<string, unknown>): { aid?: string } => (typeof s["aid"] === "string" && s["aid"] ? { aid: s["aid"] } : {}),
  head: () => pageHead("Assignment Submission", "Hand in work for assignments your teachers have opened to you."),
  component: Submit,
});

function Submit() {
  const { aid } = Route.useSearch();
  const nav = useNavigate();
  return (
    <PortalShell portal="student" maxWidth={1060}>
      <SubmissionCenter aid={aid} onPick={(id) => nav({ to: "/submit", search: { aid: id }, replace: true })} />
    </PortalShell>
  );
}
