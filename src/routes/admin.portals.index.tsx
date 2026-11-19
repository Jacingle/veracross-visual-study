import { createFileRoute, redirect } from "@tanstack/react-router";

/** The Portals entry in the Axiom menu opens the first portal (the student portal). */
export const Route = createFileRoute("/admin/portals/")({
  beforeLoad: () => { throw redirect({ to: "/admin/portals/$portalId", params: { portalId: "student" } }); },
});
