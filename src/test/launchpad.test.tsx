import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxField } from "@/components/admin/AxiomDetail";
import { AxiomShell } from "@/components/admin/AxiomShell";
import { Route as HomeRoute } from "@/routes/admin.index";
import { Route as WorkspacesRoute } from "@/routes/admin.workspaces";
import { SchoolStoreProvider } from "@/lib/school-store";
import { PortalStoreProvider } from "@/lib/portal-store";

const person = (id: string, first: string, last: string, role: "student" | "teacher") => ({ id: `u-${id}`, email: `${first}.${last}@x.org`.toLowerCase(), password: "pw1234", role, first, last, personId: id, active: true, grade: 9 });
const seed = {
  sampleCleared: true, sessionId: "u-admin",
  users: [{ id: "u-admin", email: "administrator@ulls.org", password: "administrator@ulls.org", role: "admin", first: "School", last: "Administrator", personId: "", active: true }, person("s-ann", "Ann", "Abbott", "student"), person("s-bob", "Bob", "Bishop", "student"), person("t1", "Tess", "Teacher", "teacher")],
  courses: [{ id: "ENG", name: "English 9", type: "ACADEMIC", dept: "English", credits: 1, description: "" }], sections: [], schedulingSets: [],
};

type PageRoute = { update: (o: never) => unknown };
const harness = (build: (root: never) => never[], at: string) => {
  const root = createRootRoute({ component: () => <SchoolStoreProvider><PortalStoreProvider><Outlet /></PortalStoreProvider></SchoolStoreProvider> });
  return render(<RouterProvider router={createRouter({ routeTree: root.addChildren(build(root as never)), history: createMemoryHistory({ initialEntries: [at] }) })} />);
};
const mount = (pages: { route: unknown; path: string }[], at: string) => harness((root) => pages.map((r) => (r.route as PageRoute).update({ id: r.path, path: r.path, getParentRoute: () => root } as never) as never), at);
const mountShell = (onUpdate: () => void) => harness((root) => [createRoute({ getParentRoute: () => root, path: "/admin/thing", component: () => <AxiomShell title="Thing" onUpdate={onUpdate}><input aria-label="field" /></AxiomShell> }) as never], "/admin/thing");

beforeEach(() => { localStorage.clear(); localStorage.setItem("cra-school-v2", JSON.stringify(seed)); });
afterEach(cleanup);

describe("Axiom Launchpad", () => {
  it("opens the homepage list with the backtick key and groups homepages by area", async () => {
    mount([{ route: HomeRoute, path: "/admin/" }], "/admin/");
    await screen.findByRole("heading", { name: "System Administration" });
    fireEvent.keyDown(document, { key: "`" });
    const panel = await screen.findByRole("dialog", { name: "Homepages" });
    for (const g of ["System", "Academics", "People", "Communications & Business", "Portals"]) expect(within(panel).getByRole("heading", { name: g })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Scheduling" })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Student Schedules" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("searches with / and shows each result's type", async () => {
    mount([{ route: HomeRoute, path: "/admin/" }], "/admin/");
    await screen.findByRole("heading", { name: "System Administration" });
    fireEvent.keyDown(document, { key: "/" });
    const box = await screen.findByRole("combobox");
    fireEvent.change(box, { target: { value: "student sched" } });
    const list = await screen.findByRole("listbox");
    expect(within(list).getByText("Student Schedules")).toBeInTheDocument();
    expect(within(list).getByText("Report")).toBeInTheDocument();
    fireEvent.change(box, { target: { value: "abbott" } });
    expect(await within(await screen.findByRole("listbox")).findByText("Student (9)")).toBeInTheDocument();
  });

  it("saves the Ctrl+S key to the screen's UPDATE button", async () => {
    const onUpdate = vi.fn();
    mountShell(onUpdate);
    await screen.findByRole("button", { name: "UPDATE" });
    fireEvent.keyDown(document, { key: "s", ctrlKey: true });
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});

describe("System homepage", () => {
  it("shows counter tiles, link tiles with typed links, quick Add and a task filter", async () => {
    mount([{ route: HomeRoute, path: "/admin/" }], "/admin/");
    const counters = await screen.findByLabelText("Counter tiles");
    expect(within(counters).getByText("Students").nextElementSibling).toHaveTextContent("2");
    const tile = screen.getByRole("region", { name: "Scheduling" });
    expect(within(tile).getByRole("link", { name: /Student Schedules/ })).toBeInTheDocument();
    expect(within(tile).getByLabelText("Report")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Find a task"), { target: { value: "assignment" } });
    expect(screen.queryByRole("region", { name: "Scheduling" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Academics" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Find a task"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Set-up links for General" }));
    expect(within(screen.getByRole("region", { name: "General" })).getByText("Set-up")).toBeInTheDocument();
  });
});

describe("Organize and Workspaces", () => {
  it("saves a bookmark to Favorites from the + menu, then manages it in the workspace", async () => {
    mount([{ route: WorkspacesRoute, path: "/admin/workspaces" }], "/admin/workspaces?w=personal-u-admin");
    await screen.findByRole("heading", { name: "Queries" });
    const org = screen.getByRole("button", { name: "Organize" });
    org.focus(); fireEvent.keyDown(org, { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "New Personal Bookmark" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Description"), { target: { value: "My workspace page" } });
    fireEvent.click(within(dialog).getByRole("switch", { name: "Display in Favorites" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Create Personal Bookmark" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const item = await screen.findByRole("link", { name: "My workspace page" });
    expect(item).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "~" });
    const fav = await screen.findByRole("dialog", { name: "Favorites" });
    expect(within(fav).getByRole("link", { name: "My workspace page" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Remove My workspace page" }));
    await waitFor(() => expect(screen.queryByRole("link", { name: "My workspace page" })).not.toBeInTheDocument());
  });

  it("adds, renames and deletes a sub-workspace", async () => {
    mount([{ route: WorkspacesRoute, path: "/admin/workspaces" }], "/admin/workspaces?w=personal-u-admin");
    await screen.findByRole("heading", { name: "Queries" });
    fireEvent.click(screen.getByRole("button", { name: "Add Workspace" }));
    fireEvent.change(screen.getByLabelText("Workspace name"), { target: { value: "Fall Review" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Workspace" }));
    expect(await screen.findByRole("link", { name: "Fall Review" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete Fall Review" }));
    await waitFor(() => expect(screen.queryByText("Fall Review")).not.toBeInTheDocument());
  });

  it("lists personal and shared workspaces at the top level", async () => {
    mount([{ route: WorkspacesRoute, path: "/admin/workspaces" }], "/admin/workspaces");
    const personal = await screen.findByRole("region", { name: "personal workspaces" });
    expect(within(personal).getByRole("link", { name: /My Workspace/ })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "shared workspaces" })).getByRole("link", { name: /Scheduling/ })).toBeInTheDocument();
  });
});

describe("detail screen conventions", () => {
  it("marks a changed field orange with a corner triangle until it is saved", () => {
    const { container, rerender } = render(<AxField label="Room" dirty><input aria-label="Room" /></AxField>);
    expect(container.querySelector('[data-changed="true"]')).not.toBeNull();
    rerender(<AxField label="Room"><input aria-label="Room" /></AxField>);
    expect(container.querySelector('[data-changed="true"]')).toBeNull();
  });
});
