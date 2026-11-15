import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { PortalShell, PageTitle } from "@/components/portal/PortalShell";
import { NEWS, TODAY_EVENTS, events } from "@/lib/sis-data";
import { useSchool } from "@/lib/school-store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/teacher/news")({
  head: () => pageHead("School News & Events", "Announcements, news and upcoming events for faculty."),
  component: News,
});

function News() {
  const { sent } = useSchool();
  const ann = sent.filter((m) => m.audience !== "students");
  return (
    <PortalShell portal="teacher" area="teacher">
      <PageTitle>School News & Events</PageTitle>
      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6 px-4 py-4">
        <section>
          <h2 className="mb-2 text-[19px]">News</h2>
          {[...ann.map((m) => ({ title: m.subject, body: m.body, date: parseISO(m.date) })), ...NEWS].map((n) => (
            <article key={n.title + +n.date} className="border-b border-vc-line py-3"><h3 className="text-[16px] text-vc-link-strong">{n.title}</h3><div className="text-[12px] text-muted-foreground">{format(n.date, "EEEE, MMMM d")}</div><p className="mt-1 whitespace-pre-line text-[14px]">{n.body}</p></article>))}
        </section>
        <aside>
          <h2 className="mb-2 text-[19px]">Today</h2>
          {TODAY_EVENTS.map((e) => <div key={e.title} className="border-b border-vc-line py-2 text-[13px]"><b>{e.time} {e.ampm}</b> · <span className="text-[11px] text-muted-foreground">{e.kind}</span><div className="text-vc-event">{e.title}</div></div>)}
          <h2 className="mb-2 mt-4 text-[19px]">Upcoming</h2>
          {events().slice(0, 8).map((e) => <div key={e.title} className="border-b border-vc-line py-2 text-[13px]"><b>{format(e.date, "MMM d")}</b> {e.time && <span className="text-muted-foreground">{e.time}</span>}<div className="text-vc-event">{e.title}</div></div>)}
        </aside>
      </div>
    </PortalShell>
  );
}
