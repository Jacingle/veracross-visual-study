import { createMemoryHistory, createRootRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route as PageRoute } from "@/routes/admin.student-schedules";
import { SchoolStoreProvider } from "@/lib/school-store";
import { PortalStoreProvider } from "@/lib/portal-store";
import { yearStartFor } from "@/lib/terms";

const Y = String(yearStartFor(new Date()));
const person = (id: string, first: string, last: string, role: "student" | "teacher") => ({ id: `u-${id}`, email: `${first}.${last}@x.org`.toLowerCase(), password: "pw1234", role, first, last, personId: id, active: true, grade: 9 });
const sec = (id: string, courseNo: string, name: string, block: string, students: string[], terms = [`${Y}-S1`, `${Y}-S2`]) => ({
  id, code: id, name, section: "1", teacherId: "t1", block: "", room: "R1", letter: "", pct: 0, type: "ACADEMIC", days: [], time: "", courseNo, teacherIds: ["t1"], terms, published: true, studentIds: students,
  website: { bg: "none", color: "#3a6ea5", photo: "", sections: [], pages: [] }, scheduleSetId: "ss", scheduleBlockId: block,
});
const meetings = [1, 2, 3, 4, 5].flatMap((day) => [["a", "08:00", "08:50"], ["b", "09:00", "09:50"], ["l", "12:00", "12:40"], ["c", "13:00", "13:50"]].map(([blockId, start, end]) => ({ id: `${day}${blockId}`, day, start, end, blockId })));
const seed = {
  sampleCleared: true, sessionId: "u-admin",
  users: [{ id: "u-admin", email: "administrator@ulls.org", password: "administrator@ulls.org", role: "admin", first: "School", last: "Administrator", personId: "", active: true }, person("s-ann", "Ann", "Abbott", "student"), person("s-bob", "Bob", "Bishop", "student"), person("t1", "Tess", "Teacher", "teacher")],
  courses: [["ENG", "English 9"], ["MATH", "Algebra"], ["SCI", "Biology"]].map(([id, name]) => ({ id, name, type: "ACADEMIC", dept: "", credits: 1, description: "" })),
  schedulingSets: [{ id: "ss", name: "Weekly", terms: [`${Y}-S1`, `${Y}-S2`], weekdays: [1, 2, 3, 4, 5], blocks: [["a", "A Block"], ["b", "B Block"], ["c", "C Block"], ["l", "Lunch"]].map(([id, name]) => ({ id, name, days: [], start: "", end: "" })), meetings }],
  sections: [
    sec("ENG-1", "ENG", "English 9", "a", ["s-ann", "s-bob"]), sec("MATH-1", "MATH", "Algebra", "b", ["s-ann"]), sec("SCI-1", "SCI", "Biology", "c", ["s-ann"]),
    sec("MATH-2", "MATH", "Algebra", "a", ["s-bob"]), sec("SCI-2", "SCI", "Biology", "c", []),
  ],
};

function mount() {
  const root = createRootRoute({ component: () => <SchoolStoreProvider><PortalStoreProvider><Outlet /></PortalStoreProvider></SchoolStoreProvider> });
  const page = PageRoute.update({ id: "/admin/student-schedules", path: "/admin/student-schedules", getParentRoute: () => root } as never);
  const router = createRouter({ routeTree: root.addChildren([page as never]), history: createMemoryHistory({ initialEntries: ["/admin/student-schedules"] }) });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => { localStorage.clear(); localStorage.setItem("cra-school-v2", JSON.stringify(seed)); });
afterEach(cleanup);

describe("Student Schedules page", () => {
  it("shows a clean schedule for one student and the problems for another", async () => {
    mount();
    expect(await screen.findByText(/No problems found/)).toBeInTheDocument();
    expect(screen.getByText("No errors")).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("list", { name: "Students" })).getByText("Bishop, Bob"));
    const problems = await screen.findByRole("list", { name: "Schedule problems" });
    expect(within(problems).getAllByText(/A Block has 2 classes/).length).toBe(2);
    expect(within(problems).getAllByText(/Nothing is scheduled in B Block/).length).toBe(2);
    expect(within(problems).getAllByText(/Nothing is scheduled in C Block/).length).toBe(2);
    expect(within(problems).getAllByText(/has 2 classes; at least 3 are expected/).length).toBe(2);
    expect(document.querySelectorAll('[data-state="conflict"]').length).toBe(2);
    expect(document.querySelectorAll('[data-state="empty"]').length).toBe(4);
    expect(document.querySelectorAll('[data-state="free"]').length).toBe(2);
  });

  it("adds a course into an empty block, then drops it", async () => {
    mount();
    fireEvent.click(await screen.findByText("Bishop, Bob"));
    await screen.findByRole("list", { name: "Schedule problems" });
    // Row order is B Block (S1, S2) then C Block (S1, S2): the third button fills C Block in Semester 1.
    fireEvent.click(screen.getAllByRole("button", { name: /Add class/ })[2]!);
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Course"), { target: { value: "SCI" } });
    expect(within(dialog).getAllByText("Fills C Block").length).toBe(2);
    fireEvent.click(within(dialog).getByLabelText("Choose SCI-2"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Add to Schedule" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryAllByText(/Nothing is scheduled in C Block/).length).toBe(0));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Drop Biology" })[0]!);
    expect((await screen.findAllByText(/Nothing is scheduled in C Block/)).length).toBe(2);
  });

  it("warns before adding a section that clashes, and jumps to the next student with errors", async () => {
    mount();
    await screen.findByText(/No problems found/);
    fireEvent.click(screen.getByRole("button", { name: "Add Course" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Course"), { target: { value: "MATH" } });
    fireEvent.click(within(dialog).getByLabelText("Choose MATH-2"));
    expect(within(dialog).getByRole("alert")).toHaveTextContent(/A Block is already taken by English 9/);
    expect(within(dialog).getByRole("button", { name: "Add Anyway" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Next student with errors" }));
    expect(await screen.findByRole("list", { name: "Schedule problems" })).toBeInTheDocument();
  });

  it("changes a student to another section of the same course", async () => {
    mount();
    fireEvent.click(await screen.findByText("Bishop, Bob"));
    await screen.findByRole("list", { name: "Schedule problems" });
    fireEvent.click(screen.getAllByRole("button", { name: "Change section of Algebra" })[0]!);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Pick another section/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByLabelText("Choose MATH-1"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Change Section" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryAllByText(/A Block has 2 classes/).length).toBe(0));
  });
});
