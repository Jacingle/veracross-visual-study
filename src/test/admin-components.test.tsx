import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdvancedSearch, type SearchRow } from "@/components/admin/AdvancedSearch";
import { PersonField } from "@/components/admin/PersonField";
import { routeTree } from "@/routeTree.gen";

afterEach(cleanup);
const names: Record<string, string> = { a: "Pace, Sheila", b: "Green, Sarah", c: "Hopper, Grace" };

describe("PersonField", () => {
  it("removes a highlighted name when Delete is pressed", () => {
    const onChange = vi.fn();
    render(<PersonField label="Teacher's Aide" multi ids={["a", "b"]} onChange={onChange} nameOf={(id) => names[id] ?? id} onSearch={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Pace, Sheila" }));
    fireEvent.keyDown(screen.getByRole("group"), { key: "Delete" });
    expect(onChange).toHaveBeenCalledWith(["b"]);
  });
  it("highlights the last name first on Backspace, then deletes it", () => {
    const onChange = vi.fn();
    const { rerender } = render(<PersonField label="Teacher" ids={["a"]} onChange={onChange} nameOf={(id) => names[id] ?? id} onSearch={() => {}} />);
    fireEvent.keyDown(screen.getByRole("group"), { key: "Backspace" });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("group"), { key: "Backspace" });
    expect(onChange).toHaveBeenCalledWith([]);
    rerender(<PersonField label="Teacher" ids={[]} onChange={onChange} nameOf={(id) => names[id] ?? id} onSearch={() => {}} />);
  });
  it("opens the advanced search from the magnifier", () => {
    const onSearch = vi.fn();
    render(<PersonField label="Teacher" ids={[]} onChange={() => {}} nameOf={(id) => id} onSearch={onSearch} />);
    fireEvent.click(screen.getByRole("button", { name: "Search Teacher" }));
    expect(onSearch).toHaveBeenCalled();
  });
});

describe("AdvancedSearch", () => {
  const rows: SearchRow[] = [
    { id: "s1", first: "Cassandra", last: "Abbott", grade: 6, cells: ["Abbott, Cassandra", "Grade 6", "Student (6)"] },
    { id: "s2", first: "Chris", last: "Abbott", grade: 2, cells: ["Abbott, Chris", "Grade 2", "Student (2)"] },
    { id: "s3", first: "Joshua", last: "Accime", grade: 7, cells: ["Accime, Joshua", "Grade 7", "Student (7)"] },
  ];
  it("filters by current grade on Run Query and selects the ticked people", () => {
    const onSelect = vi.fn();
    render(<AdvancedSearch open onClose={() => {}} noun="Person" kind="person" multi heads={["Full Name", "Current Grade", "Roles"]} rows={rows} onSelect={onSelect} />);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByLabelText("Grade 2"));
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Run Query" })[0]!);
    expect(within(dialog).queryByText("Abbott, Cassandra")).toBeNull();
    fireEvent.click(within(dialog).getByLabelText("Select Abbott, Chris"));
    fireEvent.click(within(dialog).getByRole("button", { name: /Select Person/ }));
    expect(onSelect).toHaveBeenCalledWith(["s2"]);
  });
  it("lets a single-select search pick only one person", () => {
    const onSelect = vi.fn();
    render(<AdvancedSearch open onClose={() => {}} noun="Person" kind="person" heads={["Full Name"]} rows={rows} onSelect={onSelect} />);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByLabelText("Select Abbott, Cassandra"));
    fireEvent.click(within(dialog).getByLabelText("Select Accime, Joshua"));
    fireEvent.click(within(dialog).getByRole("button", { name: /Select Person/ }));
    expect(onSelect).toHaveBeenCalledWith(["s3"]);
  });
  it("hides people who are already chosen", () => {
    render(<AdvancedSearch open onClose={() => {}} noun="Person" kind="person" heads={["Full Name"]} rows={rows} exclude={["s1"]} onSelect={() => {}} />);
    expect(screen.queryByText("Abbott, Cassandra")).toBeNull();
    expect(screen.getByText("Abbott, Chris")).toBeTruthy();
  });
});

describe("administrator routes", () => {
  it.each(["/admin/home/academic-configuration", "/admin/classes", "/admin/course/new", "/admin/course/KHOME", "/admin/class/new?course=KHOME"])("matches %s", (path) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const pathname = path.split("?")[0]!;
    expect(router.matchRoutes(pathname).at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
