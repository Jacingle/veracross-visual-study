import { describe, expect, it } from "vitest";
import { ALL_HOMEPAGES, HOMEPAGES, homepagesByGroup, linkKind, metrics, pageHits, SYSTEM_PAGE, type AdminPath } from "./admin-homepages";
import { historyTag, searchAxiom, shortcutFor } from "./axiom-nav";
import { addItem, addSub, childrenOf, ensureWorkspaces, favoritesOf, personalId, removeItem, removeWorkspace, renameWorkspace, sharedId, toggleFavorite, trail, visibleTo } from "./workspaces";
import { AXIOM_LINKS } from "@/components/admin/AxiomShell";

const data = {
  users: [{ first: "Ada", last: "Lovelace", email: "ada@x.org", role: "student", grade: 10, active: true }, { first: "Grace", last: "Hopper", email: "grace@x.org", role: "teacher", active: false }],
  sections: [{ id: "ENG-1", code: "ENG-1", name: "English 9", courseNo: "ENG" }], courses: [{ id: "ENG", name: "English 9", dept: "English" }],
};

describe("homepages", () => {
  it("lists every Axiom page on some homepage, so nothing needs a sidebar", () => {
    const reachable = new Set<AdminPath>();
    for (const h of ALL_HOMEPAGES) for (const s of h.sections) for (const l of [...s.groups.flatMap((g) => g.links), ...(s.more ?? [])]) if ("to" in l) reachable.add(l.to);
    for (const l of AXIOM_LINKS) if (l.to !== "/admin") expect(reachable.has(l.to as AdminPath), l.to).toBe(true);
  });
  it("groups homepages under major areas and types links as find, add, report or configuration", () => {
    expect(homepagesByGroup().map((g) => g.group)[0]).toBe("System");
    expect(homepagesByGroup().flatMap((g) => g.pages)).toHaveLength(ALL_HOMEPAGES.length);
    expect(linkKind({ label: "x", action: "new-class" })).toBe("add");
    expect(linkKind({ label: "x", to: "/admin/queries" })).toBe("find");
    expect(linkKind({ label: "x", to: "/admin/terms" })).toBe("config");
    expect(HOMEPAGES.find((h) => h.id === "scheduling")?.group).toBe("Academics");
  });
  it("counts what counter tiles show", () => {
    const m = metrics({ users: [{ role: "student", active: true }, { role: "teacher", active: false }], sections: [{ published: false }, { published: true, scheduleBlockId: "a" }], courses: [1], purchases: [{ status: "Pending" }, { status: "Approved" }] });
    expect(m).toMatchObject({ accounts: 2, students: 1, faculty: 1, classes: 2, courses: 1, unpublished: 1, unscheduled: 1, inactive: 1, pendingPurchases: 1 });
    expect(SYSTEM_PAGE.counters?.length).toBeGreaterThan(3);
  });
  it("finds quick-access and tile links through search", () => {
    expect(pageHits("student schedules")[0]?.link).toBe("report");
    expect(pageHits("add class")[0]).toMatchObject({ link: "add", hit: { action: "new-class" } });
  });
});

describe("Launchpad search and keys", () => {
  it("suggests homepages, links, people with role and grade, classes and courses", () => {
    expect(searchAxiom("a", data)).toEqual([]);
    const people = searchAxiom("lovelace", data);
    expect(people[0]).toMatchObject({ kind: "Person", label: "Lovelace, Ada", hint: "Student (10)", dest: { to: "/admin/users", search: { q: "ada@x.org" } } });
    expect(searchAxiom("hopper", data)[0]?.hint).toBe("Faculty · Inactive");
    const kinds = searchAxiom("english", data).map((h) => h.kind);
    expect(kinds).toEqual(["Class", "Course"]);
    expect(searchAxiom("scheduling", data).some((h) => h.kind === "Homepage" && "params" in h.dest)).toBe(true);
    expect(searchAxiom("add person", data)[0]).toMatchObject({ kind: "Add", dest: { action: "new-person" } });
  });
  it("maps keys to Launchpad actions only when not typing", () => {
    const k = (key: string, o = {}) => ({ key, ctrlKey: false, metaKey: false, altKey: false, ...o });
    expect(shortcutFor(k("`"), false)).toBe("rocket");
    expect(shortcutFor(k("~"), false)).toBe("favorites");
    expect(shortcutFor(k("/"), false)).toBe("search");
    expect(shortcutFor(k("/"), true)).toBeNull();
    expect(shortcutFor(k("s", { ctrlKey: true }), true)).toBe("save");
    expect(shortcutFor(k("S", { metaKey: true }), false)).toBe("save");
    expect(shortcutFor(k("x"), false)).toBeNull();
  });
  it("tags history entries by function", () => {
    expect(historyTag("/admin")).toBe("Homepage");
    expect(historyTag("/admin/home/scheduling")).toBe("Homepage");
    expect(historyTag("/admin/queries?source=people")).toBe("Query");
    expect(historyTag("/admin/courses/ENG-1")).toBe("Record");
    expect(historyTag("/admin/workspaces?w=x")).toBe("Workspace");
    expect(historyTag("/admin/terms")).toBe("Page");
  });
});

describe("workspaces", () => {
  const pages = [{ id: "system", title: "System" }, { id: "scheduling", title: "Scheduling" }];
  const base = ensureWorkspaces(undefined, "u1", pages);
  const item = { id: "i1", kind: "bookmark" as const, title: "Student Schedules", path: "/admin/student-schedules", favorite: false };
  it("gives every person a personal workspace and every homepage a shared one, once", () => {
    expect(base.map((w) => w.id)).toEqual([personalId("u1"), sharedId("system"), sharedId("scheduling")]);
    expect(ensureWorkspaces(base, "u1", pages)).toHaveLength(3);
    expect(visibleTo(ensureWorkspaces(base, "u2", pages), "u1").map((w) => w.id)).not.toContain(personalId("u2"));
  });
  it("adds, renames and deletes sub-workspaces with everything inside; primaries stay", () => {
    let l = addSub(base, personalId("u1"), "  Fall  ", "w1");
    l = addSub(l, "w1", "Week 1", "w2");
    expect(trail(l, "w2").map((w) => w.name)).toEqual(["My Workspace", "Fall", "Week 1"]);
    expect(l.find((w) => w.id === "w2")).toMatchObject({ scope: "personal", ownerId: "u1" });
    expect(addSub(l, "w1", "   ", "w3")).toBe(l);
    expect(renameWorkspace(l, "w1", "Autumn").find((w) => w.id === "w1")?.name).toBe("Autumn");
    expect(removeWorkspace(l, personalId("u1"))).toBe(l);
    expect(removeWorkspace(l, "w1").map((w) => w.id)).not.toContain("w2");
    expect(childrenOf(l, personalId("u1")).map((w) => w.id)).toEqual(["w1"]);
  });
  it("saves bookmarks, stars them for Favorites, and keeps personal and shared apart", () => {
    let l = addItem(base, personalId("u1"), item);
    l = addItem(l, sharedId("system"), { ...item, id: "i2", path: "/admin/courses/ENG-1", favorite: true });
    expect(l.find((w) => w.id === sharedId("system"))?.items[0]?.record).toBe(true);
    expect(favoritesOf(l, "u1").personal).toEqual([]);
    l = toggleFavorite(l, personalId("u1"), "i1");
    expect(favoritesOf(l, "u1").personal[0]?.items[0]?.title).toBe("Student Schedules");
    expect(favoritesOf(l, "u1").shared[0]?.workspace.name).toBe("System");
    expect(favoritesOf(l, "u2").personal).toEqual([]);
    expect(favoritesOf(removeItem(l, personalId("u1"), "i1"), "u1").personal).toEqual([]);
  });
});
