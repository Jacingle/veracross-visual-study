import { createMemoryHistory, createRootRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PersonRecord, type PersonDraft } from "@/components/admin/PersonRecord";
import { Route as ClassRoute } from "@/routes/class.$classId";
import { PortalStoreProvider } from "@/lib/portal-store";
import { SchoolStoreProvider } from "@/lib/school-store";
import { yearStartFor } from "@/lib/terms";

const Y = String(yearStartFor(new Date()));
const KEY = "cra-school-v2";
const person = (id: string, first: string, last: string, role: "student" | "teacher", extra: object = {}) => ({ id: `u-${id}`, email: `${first}.${last}@x.org`.toLowerCase(), password: "pw1234", role, first, last, personId: id, active: true, grade: 9, ...extra });
const comment = (id: string, byId: string, by: string, text: string, parent?: string) => ({ id, by, byId, date: "2026-09-10T10:00:00Z", text, ...(parent ? { parent } : {}) });
const base = (sessionId: string) => ({
  sampleCleared: true, sessionId,
  users: [person("t1", "Brad", "Homuth", "teacher", { prefix: "Mr." }), person("s-ann", "Ann", "Abbott", "student"), person("s-bob", "Bob", "Bishop", "student")],
  courses: [{ id: "ENG", name: "English 9", type: "ACADEMIC", dept: "", credits: 1, description: "" }],
  sections: [{
    id: "ENG-1", code: "ENG-1", name: "English 9", section: "1", teacherId: "t1", block: "A", room: "R1", letter: "", pct: 0, type: "ACADEMIC", days: [], time: "", courseNo: "ENG", teacherIds: ["t1"],
    terms: [`${Y}-S1`, `${Y}-S2`], published: true, studentIds: ["s-ann", "s-bob"],
    website: { bg: "none", color: "#3a6ea5", photo: "", sections: [], pages: [], discussions: [
      { id: "d-open", title: "Favorite book", body: "<p>Tell us about it.</p>", status: "open", comments: [comment("c1", "s-bob", "Bob Bishop", "I like Holes."), comment("c2", "t1", "Mr. Brad Homuth", "Nice pick!", "c1")] },
      { id: "d-draft", title: "Secret draft", body: "", status: "draft", comments: [] },
      { id: "d-done", title: "Summer reading", body: "", status: "closed", comments: [] },
    ] },
  }],
});
function mount(url: string) {
  const root = createRootRoute({ component: () => <SchoolStoreProvider><PortalStoreProvider><Outlet /></PortalStoreProvider></SchoolStoreProvider> });
  const child = (ClassRoute as unknown as { update: (o: never) => unknown }).update({ id: "/class/$classId", path: "/class/$classId", getParentRoute: () => root } as never);
  return render(<RouterProvider router={createRouter({ routeTree: root.addChildren([child as never]), history: createMemoryHistory({ initialEntries: [url] }) })} />);
}
beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("class website tabs", () => {
  it("shows a student Photos with the teacher and every classmate", async () => {
    localStorage.setItem(KEY, JSON.stringify(base("u-s-ann")));
    mount("/class/ENG-1?tab=photos");
    expect(await screen.findByRole("heading", { name: "Photos" })).toBeInTheDocument();
    expect(screen.getByText(/Students/)).toHaveTextContent("(2)");
    expect(screen.getByText("Bishop")).toBeInTheDocument();
    expect(screen.getByText("Homuth")).toBeInTheDocument();
    expect(screen.queryByText(/Nothing has been posted/)).toBeNull();
  });

  it("gives the teacher the same Photos tab, and no Discussions tab for anyone", async () => {
    localStorage.setItem(KEY, JSON.stringify(base("u-t1")));
    mount("/class/ENG-1?tab=photos");
    expect(await screen.findByRole("heading", { name: "Photos" })).toBeInTheDocument();
    const tabs = within(screen.getByRole("tablist")).getAllByRole("tab").map((t) => t.textContent);
    expect(tabs).toEqual(["Home", "Posts", "Timeline", "Calendar", "Resources", "Photos", "Directory"]);
    cleanup();
    localStorage.setItem(KEY, JSON.stringify(base("u-s-ann")));
    mount("/class/ENG-1");
    await screen.findByRole("tablist");
    expect(screen.queryByRole("tab", { name: /Discussions/ })).toBeNull();
  });
});

describe("person record", () => {
  const draft = (role: PersonDraft["role"]): PersonDraft => ({ email: "jane@school.org", username: "jane.smith", password: "abcd", role, first: "Jane", last: "Smith", personId: "new", active: true });
  const inApp = (el: React.ReactNode) => { const root = createRootRoute({ component: () => <SchoolStoreProvider><PortalStoreProvider>{el}</PortalStoreProvider></SchoolStoreProvider> }); return render(<RouterProvider router={createRouter({ routeTree: root, history: createMemoryHistory({ initialEntries: ["/"] }) })} />); };
  const Rec = ({ role }: { role: PersonDraft["role"] }) => { const [d, setD] = useState(draft(role)); return <><PersonRecord d={d} set={(p) => setD({ ...d, ...p })} onReplacePhoto={() => {}} /><output aria-label="draft">{JSON.stringify(d)}</output></>; };
  it("offers a prefix for faculty but not students", async () => {
    const { unmount } = inApp(<Rec role="teacher" />);
    const prefix = (await screen.findByLabelText("Prefix")) as HTMLSelectElement;
    expect([...prefix.options].map((o) => o.value)).toEqual(expect.arrayContaining(["", "Mr.", "Mrs.", "Ms.", "Dr."]));
    fireEvent.change(prefix, { target: { value: "Dr." } });
    expect(screen.getByLabelText("draft").textContent).toContain('"prefix":"Dr."');
    unmount();
    inApp(<Rec role="student" />);
    await screen.findByLabelText("First Name");
    expect(screen.queryByLabelText("Prefix")).toBeNull();
  });
  it("keeps the email and the username as two different fields", async () => {
    inApp(<Rec role="teacher" />);
    expect(((await screen.findByLabelText("Email 1")) as HTMLInputElement).value).toBe("jane@school.org");
    fireEvent.change(screen.getByLabelText("Email 1"), { target: { value: "jane.new@school.org" } });
    fireEvent.click(screen.getAllByRole("button", { name: /Portal Access/ })[0]!);
    const username = screen.getByLabelText("Username") as HTMLInputElement;
    expect(username.value).toBe("jane.smith");
    expect(screen.queryByLabelText(/Username \(Email\)/)).toBeNull();
    fireEvent.change(username, { target: { value: "jane smith 2" } });
    const out = screen.getByLabelText("draft").textContent ?? "";
    expect(out).toContain('"username":"janesmith2"');
    expect(out).toContain('"email":"jane.new@school.org"');
  });
});
