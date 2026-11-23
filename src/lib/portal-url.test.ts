import { describe, expect, it } from "vitest";
import { classIdFromPath, portalAbbr, portalTitle, toInternalPath, toPublicPath, type PortalIdentity } from "./portal-url";

const student: PortalIdentity = { abbr: "ulls", role: "student" };
const teacher: PortalIdentity = { abbr: "ulls", role: "teacher" };
const admin: PortalIdentity = { abbr: "ulls", role: "admin" };

describe("public portal addresses", () => {
  it("builds /<school>/<role>/<role>/<page>", () => {
    expect(toPublicPath("/schedule", student)).toBe("/ulls/student/student/daily-schedule");
    expect(toPublicPath("/class/252-3", student)).toBe("/ulls/student/student/class-website/252-3");
    expect(toPublicPath("/assignments", student)).toBe("/ulls/student/student/assignments");
  });
  it("home has no second role and no page", () => {
    expect(toPublicPath("/student", student)).toBe("/ulls/student");
    expect(toPublicPath("/teacher", teacher)).toBe("/ulls/teacher");
    expect(toPublicPath("/admin", admin)).toBe("/ulls/admin");
  });
  it("keeps the faculty and administration areas", () => {
    expect(toPublicPath("/teacher/class/9", teacher)).toBe("/ulls/teacher/teacher/class/9");
    expect(toPublicPath("/admin/courses/252-3", admin)).toBe("/ulls/admin/admin/courses/252-3");
  });
  it("leaves the login page, signed-out visitors and admins on shared pages alone", () => {
    expect(toPublicPath("/", student)).toBeNull();
    expect(toPublicPath("/schedule", null)).toBeNull();
    expect(toPublicPath("/assignments", admin)).toBeNull();
  });
  it("turns a public address back into the app path, and back again", () => {
    const cases: [string, PortalIdentity][] = [
      ["/schedule", student], ["/class/252-3", student], ["/grades/9", teacher], ["/student", student],
      ["/teacher", teacher], ["/teacher/class/9", teacher], ["/teacher/news", teacher], ["/admin", admin], ["/admin/courses/252-3", admin], ["/admin/messages", admin], ["/admin/classes", admin],
    ];
    for (const [path, id] of cases) {
      const pub = toPublicPath(path, id)!;
      expect(toInternalPath(pub)).toEqual({ path, identity: id });
    }
  });
  it("does not mistake ordinary app paths for public addresses", () => {
    for (const p of ["/", "/schedule", "/student", "/admin/courses/1", "/class/student", "/grades/teacher", "/teacher/class/9"]) expect(toInternalPath(p)).toBeNull();
    expect(toInternalPath("/ulls/student/teacher/schedule")).toBeNull();
  });
  it("takes the school abbreviation from the email domain", () => {
    expect(portalAbbr("student@ulls.org", "CRA")).toBe("ulls");
    expect(portalAbbr("nobody", "CRA")).toBe("cra");
  });
});

describe("browser tab titles", () => {
  const base = { school: "University Lionburg High School", routeTitle: "" };
  it("home is the school and the portal", () => {
    expect(portalTitle({ ...base, pathname: "/student", role: "student" })).toBe("University Lionburg High School - Student Portal");
    expect(portalTitle({ ...base, pathname: "/teacher", role: "teacher" })).toBe("University Lionburg High School - Faculty Portal");
  });
  it("a class page is the class name and the portal", () => {
    expect(portalTitle({ ...base, pathname: "/class/252-3", role: "student", className: "Math 6 - 2" })).toBe("Math 6 - 2 - Student Portal");
  });
  it("a report is its name and the portal", () => {
    expect(portalTitle({ ...base, pathname: "/schedule", role: "student", routeTitle: "Daily Schedule | University Lionburg High School" })).toBe("Daily Schedule - Student Portal");
    expect(portalTitle({ ...base, pathname: "/admin/users", role: "admin", routeTitle: "Axiom · Users | University Lionburg High School" })).toBe("Users - Administrator Portal");
  });
  it("falls back to the home title when a page has no name of its own", () => {
    expect(portalTitle({ ...base, pathname: "/updates", role: "student", routeTitle: "University Lionburg High School Portal" })).toBe("University Lionburg High School - Student Portal");
  });
  it("finds the class a page is about", () => {
    expect(classIdFromPath("/class/252-3")).toBe("252-3");
    expect(classIdFromPath("/admin/courses/252-3")).toBe("252-3");
    expect(classIdFromPath("/teacher/class/9")).toBe("9");
    expect(classIdFromPath("/admin/courses")).toBeNull();
    expect(classIdFromPath("/schedule")).toBeNull();
  });
});
