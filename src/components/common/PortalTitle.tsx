import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { classIdFromPath, portalAbbr, portalTitle, setPortalIdentity, toPublicPath } from "@/lib/portal-url";
import { useSchool } from "@/lib/school-store";
import { SCHOOL } from "@/lib/sis-data";

/**
 * Keeps the browser tab and address bar in the portal style once someone is signed in:
 * "<School> - <Role> Portal" on home, "<Class or report> - <Role> Portal" on other pages,
 * and addresses like /ulls/student/student/daily-schedule.
 */
export function PortalTitle() {
  const { ready, user, sections } = useSchool();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // The name each page already gives itself (from its head()), used as the report name.
  const routeTitle = useRouterState({
    select: (s) => {
      for (let i = s.matches.length - 1; i >= 0; i--) {
        const found = (s.matches[i]?.meta as unknown as { title?: string }[] | undefined)?.find((m) => m?.title)?.title;
        if (found) return found;
      }
      return "";
    },
  });
  useEffect(() => { if (ready) document.documentElement.dataset.ready = "1"; }, [ready]);
  const role = user?.role;
  const abbr = user ? portalAbbr(user.email, SCHOOL.short) : "";

  useEffect(() => {
    if (!ready || !role) return;
    setPortalIdentity({ abbr, role });
    // An older-style link (/schedule) is shown in the public form once we know who is signed in.
    const pub = toPublicPath(pathname, { abbr, role });
    if (pub && pub !== window.location.pathname) window.history.replaceState(window.history.state, "", pub + window.location.search + window.location.hash);
  }, [ready, role, abbr, pathname]);

  const classId = classIdFromPath(pathname);
  const section = classId ? sections.find((c) => c.id === classId) : undefined;
  const className = section ? `${section.name} - ${section.section}` : undefined;
  const title = ready && role ? portalTitle({ pathname, routeTitle, school: SCHOOL.name, role, className }) : null;

  useEffect(() => {
    if (!title) return;
    const apply = () => { if (document.title !== title) document.title = title; };
    apply();
    // The page's own head() may write the tab title again after this runs: put ours back.
    const watch = new MutationObserver(apply);
    watch.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => watch.disconnect();
  }, [title]);

  return null;
}
