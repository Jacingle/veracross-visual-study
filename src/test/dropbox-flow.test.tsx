import { createMemoryHistory, createRootRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Route as GradesRoute } from "@/routes/grades.$classId";
import { Route as SubmitRoute } from "@/routes/submit";
import { Route as TeacherClassRoute } from "@/routes/teacher.class.$classId";
import { PortalStoreProvider } from "@/lib/portal-store";
import { SchoolStoreProvider } from "@/lib/school-store";
import { yearStartFor } from "@/lib/terms";

// jsdom has no ResizeObserver (the teacher class page uses one).
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const Y = String(yearStartFor(new Date()));
const person = (id: string, first: string, last: string, role: "student" | "teacher", extra: object = {}) => ({ id: `u-${id}`, email: `${first}.${last}@x.org`.toLowerCase(), password: "pw1234", role, first, last, personId: id, active: true, grade: 9, ...extra });
const assignment = (id: string, title: string, due: string) => ({ id, courseId: "ENG-1", title, category: "WRITING", assigned: "2026-11-01", due, points: 10, details: `<p>Instructions for ${title}</p>`, notes: "", published: true, inCalc: true, extraCredit: false, allSections: false, method: "Points" });
const base = {
  sampleCleared: true, sessionId: "u-s-ann",
  users: [
    { id: "u-admin", email: "administrator@ulls.org", password: "administrator@ulls.org", role: "admin", first: "School", last: "Administrator", personId: "", active: true },
    person("t1", "Brad", "Homuth", "teacher", { prefix: "Mr." }), person("s-ann", "Ann", "Abbott", "student"),
  ],
  courses: [{ id: "ENG", name: "English 9", type: "ACADEMIC", dept: "", credits: 1, description: "" }],
  sections: [{
    id: "ENG-1", code: "ENG-1", name: "English 9", section: "1", teacherId: "t1", block: "A", room: "R1", letter: "", pct: 0, type: "ACADEMIC", days: [], time: "", courseNo: "ENG", teacherIds: ["t1"],
    terms: [`${Y}-S1`, `${Y}-S2`], published: true, studentIds: ["s-ann"], website: { bg: "none", color: "#3a6ea5", photo: "", sections: [], pages: [] },
  }],
  custom: [assignment("c-open", "Unit 2 Essay", "2026-12-01"), assignment("c-shut", "Reading Quiz", "2026-12-04")],
};
const KEY = "cra-school-v2";
const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const saved = () => JSON.parse(localStorage.getItem(KEY) ?? "{}") as { comments: Record<string, string>; aStatus: Record<string, string>; submissions: Record<string, { text: string; files: { name: string }[] }[]> };

function mount(page: { route: unknown; path: string }, url: string) {
  const root = createRootRoute({ component: () => <SchoolStoreProvider><PortalStoreProvider><Outlet /></PortalStoreProvider></SchoolStoreProvider> });
  const child = (page.route as { update: (o: never) => unknown }).update({ id: page.path, path: page.path, getParentRoute: () => root } as never);
  const router = createRouter({ routeTree: root.addChildren([child as never]), history: createMemoryHistory({ initialEntries: [url] }) });
  return render(<RouterProvider router={router} />);
}
const seed = (over: object = {}) => localStorage.setItem(KEY, JSON.stringify({ ...base, ...over }));

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("assignment dropbox, student side", () => {
  it("shows a Submit button on All Assignments only for assignments the teacher opened", async () => {
    seed({ comments: { "d|c-open|s-ann": "Expecting" } });
    mount({ route: GradesRoute, path: "/grades/$classId" }, "/grades/ENG-1");
    const open = (await screen.findByText("Unit 2 Essay")).closest("div.relative") as HTMLElement;
    expect(within(open).getByRole("link", { name: /Submit/ })).toHaveAttribute("href", expect.stringContaining("/submit"));
    const shut = screen.getByText("Reading Quiz").closest("div.relative") as HTMLElement;
    expect(within(shut).queryByRole("link", { name: /Submit/ })).toBeNull();
  });

  it("shows Pending, not an invented Complete, for a past assignment with no grade", async () => {
    seed({});
    mount({ route: GradesRoute, path: "/grades/$classId" }, "/grades/ENG-1");
    await screen.findByText("Unit 2 Essay");
    expect(screen.getAllByText("Pending").length).toBe(2);
    expect(screen.queryByText("Complete")).toBeNull();
  });

  it("changes a graded assignment's status to Complete and shows its score", async () => {
    seed({ scores: { "c-open|s-ann": "9" } });
    mount({ route: GradesRoute, path: "/grades/$classId" }, "/grades/ENG-1");
    await screen.findByText("Unit 2 Essay");
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBe(1);
  });

  it("lists only open assignments on the submission page and submits work", async () => {
    seed({ comments: { "d|c-open|s-ann": "Expecting" } });
    mount({ route: SubmitRoute, path: "/submit" }, "/submit");
    expect(await screen.findByText("Assignment Submission")).toBeInTheDocument();
    expect(screen.getAllByText("Unit 2 Essay").length).toBeGreaterThan(0);
    expect(screen.queryByText("Reading Quiz")).toBeNull();
    expect(screen.getByText(/Add a submission below/)).toBeInTheDocument();
    const send = screen.getByRole("button", { name: "Submit" });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Add Submission"), { target: { value: "Here is my assignment!" } });
    expect(send).toBeEnabled();
    fireEvent.click(send);
    expect(await screen.findByText("Here is my assignment!")).toBeInTheDocument();
    expect(screen.getByText("Abbott, Ann")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Is this assignment complete?" })).toHaveAttribute("aria-checked", "false");
    await waitFor(() => expect(saved().comments["d|c-open|s-ann"]).toBe("Received"));
    expect(saved().aStatus["c-open|s-ann"]).toBeUndefined();
    expect(saved().submissions["c-open|s-ann"]?.[0]?.text).toBe("Here is my assignment!");
  });

  it("opens on the assignment from the Submit button, and keeps a closed one readable with its submissions", async () => {
    seed({ comments: { "d|c-open|s-ann": "Expecting", "d|c-shut|s-ann": "Closed" },
      submissions: { "c-shut|s-ann": [{ id: "x", at: "2026-12-02T15:00:00.000Z", text: "Late draft", files: [] }] } });
    mount({ route: SubmitRoute, path: "/submit" }, "/submit?aid=c-shut");
    expect(await screen.findByText("Late draft")).toBeInTheDocument();
    expect(screen.getByText(/closed submissions for this assignment/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit" })).toBeNull();
  });

  it("lets a student mark an assignment complete and back to pending", async () => {
    seed({ comments: { "d|c-open|s-ann": "Expecting" } });
    mount({ route: SubmitRoute, path: "/submit" }, "/submit?aid=c-open");
    const sw = await screen.findByRole("switch", { name: "Is this assignment complete?" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    fireEvent.click(sw);
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "true"));
    expect(saved().aStatus["c-open|s-ann"]).toBe("Complete");
    fireEvent.click(sw);
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "false"));
  });

  it("attaches a file and shows it as a download in the conversation", async () => {
    seed({ comments: { "d|c-open|s-ann": "Expecting" } });
    mount({ route: SubmitRoute, path: "/submit" }, "/submit?aid=c-open");
    const chooser = await screen.findByLabelText("Choose files");
    fireEvent.change(chooser, { target: { files: [new File(["hello"], "Unit 2 Essay - Ann Abbott.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })] } });
    expect(await screen.findByText("Unit 2 Essay - Ann Abbott.docx")).toBeInTheDocument();
    const send = screen.getByRole("button", { name: "Submit" });
    expect(send).toBeEnabled();
    fireEvent.click(send);
    const link = await screen.findByRole("link", { name: /Unit 2 Essay - Ann Abbott\.docx/ });
    expect(link).toHaveAttribute("download", "Unit 2 Essay - Ann Abbott.docx");
    expect(link.getAttribute("href")).toMatch(/^data:/);
    await waitFor(() => expect(saved().submissions["c-open|s-ann"]?.[0]?.files[0]?.name).toBe("Unit 2 Essay - Ann Abbott.docx"));
  });

  it("refuses a file that is too large", async () => {
    seed({ comments: { "d|c-open|s-ann": "Expecting" } });
    mount({ route: SubmitRoute, path: "/submit" }, "/submit?aid=c-open");
    const chooser = await screen.findByLabelText("Choose files");
    const big = new File(["x"], "huge.pdf"); Object.defineProperty(big, "size", { value: 4 * 1024 * 1024 });
    fireEvent.change(chooser, { target: { files: [big] } });
    await waitFor(() => expect(screen.queryByText("huge.pdf")).toBeNull());
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });
});

describe("assignment dropbox, faculty side", () => {
  const afterSubmit = { sessionId: "u-t1",
    comments: { "d|c-open|s-ann": "Received", "a|c-open|s-ann": "Nice work." }, aStatus: { "c-open|s-ann": "Complete" },
    submissions: { "c-open|s-ann": [{ id: "x", at: "2026-12-01T18:51:00.000Z", text: "Here is my assignment!", files: [{ name: "Essay - Ann Abbott.docx", size: 12000, type: "", data: "data:text/plain;base64,aGk=" }] }] } };

  it("shows Received, Complete and the student's work after a submission", async () => {
    seed(afterSubmit);
    mount({ route: TeacherClassRoute, path: "/teacher/class/$classId" }, "/teacher/class/ENG-1?tab=assignments&aid=c-open&sub=students");
    const dropbox = await screen.findByLabelText("Dropbox status for Ann");
    expect(dropbox).toHaveTextContent("Received");
    expect(screen.getByLabelText("Assignment status for Ann")).toHaveTextContent("Complete");
    fireEvent.click(screen.getByRole("button", { name: "Feedback for Ann" }));
    expect(await screen.findByText("Here is my assignment!")).toBeInTheDocument();
    expect(screen.getByText("Essay - Ann Abbott.docx")).toBeInTheDocument();
    expect(screen.getByText("Nice work.")).toBeInTheDocument();
  });

  it("changes Pending to Complete as soon as a grade is entered", async () => {
    seed({ sessionId: "u-t1", comments: { "d|c-open|s-ann": "Expecting" }, aStatus: { "c-open|s-ann": "Pending" } });
    mount({ route: TeacherClassRoute, path: "/teacher/class/$classId" }, "/teacher/class/ENG-1?tab=assignments&aid=c-open&sub=students");
    const status = await screen.findByLabelText("Assignment status for Ann");
    expect(status).toHaveTextContent("Pending");
    fireEvent.change(screen.getByLabelText("Score for Ann"), { target: { value: "8" } });
    await waitFor(() => expect(screen.getByLabelText("Assignment status for Ann")).toHaveTextContent("Complete"));
  });
  it("marks gradebook cells with an orange triangle while expecting work and green once received", async () => {
    const todays = [{ ...assignment("c-open", "Unit 2 Essay", isoToday()), assigned: isoToday() }, { ...assignment("c-shut", "Reading Quiz", isoToday()), assigned: isoToday() }];
    seed({ sessionId: "u-t1", custom: todays, comments: { "d|c-open|s-ann": "Expecting" } });
    const view = mount({ route: TeacherClassRoute, path: "/teacher/class/$classId" }, "/teacher/class/ENG-1?tab=gradebook");
    expect(await screen.findByTitle("Dropbox: Expecting")).toBeInTheDocument();
    expect(screen.queryByTitle("Dropbox: Received")).toBeNull();
    view.unmount(); cleanup();
    seed({ sessionId: "u-t1", custom: todays, comments: { "d|c-open|s-ann": "Received" } });
    mount({ route: TeacherClassRoute, path: "/teacher/class/$classId" }, "/teacher/class/ENG-1?tab=gradebook");
    expect(await screen.findByTitle("Dropbox: Received")).toBeInTheDocument();
  });
});
