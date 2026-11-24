import { createMemoryHistory, createRootRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Route as SchoolRoute } from "@/routes/admin.school";
import { PortalStoreProvider } from "@/lib/portal-store";
import { SchoolStoreProvider } from "@/lib/school-store";
import { applySchool, SCHOOL } from "@/lib/sis-data";

const KEY = "cra-school-v2";
const seed = { sampleCleared: true, sessionId: "u-admin", users: [{ id: "u-admin", email: "administrator@ulls.org", password: "administrator@ulls.org", role: "admin", first: "School", last: "Administrator", personId: "", active: true }], courses: [], sections: [] };
const saved = () => JSON.parse(localStorage.getItem(KEY) ?? "{}") as { school?: Record<string, string> };
function mount() {
  const root = createRootRoute({ component: () => <SchoolStoreProvider><PortalStoreProvider><Outlet /></PortalStoreProvider></SchoolStoreProvider> });
  const child = (SchoolRoute as unknown as { update: (o: never) => unknown }).update({ id: "/admin/school", path: "/admin/school", getParentRoute: () => root } as never);
  return render(<RouterProvider router={createRouter({ routeTree: root.addChildren([child as never]), history: createMemoryHistory({ initialEntries: ["/admin/school"] }) })} />);
}
beforeEach(() => { localStorage.clear(); localStorage.setItem(KEY, JSON.stringify(seed)); applySchool(); });
afterEach(() => { cleanup(); applySchool(); });

describe("School Information page", () => {
  it("shows the current school and saves a new name, domain and contact details everywhere", async () => {
    mount();
    const name = (await screen.findByLabelText("School Name")) as HTMLInputElement;
    expect(name.value).toBe("Cedar Ridge Academy");
    fireEvent.change(name, { target: { value: "Oak Hill School" } });
    fireEvent.change(screen.getByLabelText("Short Name"), { target: { value: "ohs" } });
    fireEvent.change(screen.getByLabelText("Email Domain"), { target: { value: "oakhill.edu" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Austin" } });
    expect(name.closest("[data-changed]")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));
    await waitFor(() => expect(saved().school?.name).toBe("Oak Hill School"));
    expect(saved().school).toMatchObject({ short: "OHS", domain: "oakhill.edu", city: "Austin" });
    expect(SCHOOL.name).toBe("Oak Hill School");
    expect(within(screen.getByRole("banner")).getByText("Oak Hill School")).toBeInTheDocument();
    expect(name.closest("[data-changed]")).toBeNull();
  });

  it("does not save a bad draft", async () => {
    mount();
    fireEvent.change(await screen.findByLabelText("Email Domain"), { target: { value: "nodot" } });
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));
    await new Promise((r) => setTimeout(r, 150));
    expect(saved().school).toBeUndefined();
    expect(SCHOOL.domain).toBe("cedarridge.edu");
  });

  it("uploads a logo, shows it in the top bar, and can remove it", async () => {
    mount();
    const input = (await screen.findByLabelText("Choose logo file")) as HTMLInputElement;
    const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'], "logo.svg", { type: "image/svg+xml" });
    fireEvent.change(input, { target: { files: [svg] } });
    const preview = await screen.findByAltText("Cedar Ridge Academy logo");
    expect((preview as HTMLImageElement).src).toMatch(/^data:image\/svg\+xml/);
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));
    await waitFor(() => expect(saved().school?.logo).toMatch(/^data:image\/svg\+xml/));
    await waitFor(() => expect(screen.getByRole("banner").querySelector('img[src^="data:image/svg"]')).not.toBeNull());
    fireEvent.click(screen.getByRole("button", { name: /Remove/ }));
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));
    await waitFor(() => expect(saved().school?.logo).toBe(""));
  });

  it("refuses a file that is not a picture", async () => {
    mount();
    const input = (await screen.findByLabelText("Choose logo file")) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["hello"], "notes.txt", { type: "text/plain" })] } });
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByAltText(/logo/)).toBeNull();
  });
});
