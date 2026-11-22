import { describe, expect, it } from "vitest";
import { defaultCourseFlags, makeCourseId, makeSectionId, validateCourse } from "./course-records";

describe("course records", () => {
  it("starts new courses like Veracross", () => {
    const f = defaultCourseFlags();
    expect([f["report"], f["conferences"], f["reviews"]]).toEqual([true, true, true]);
    expect([f["transcript"], f["gpa"], f["archive"], f["request"], f["scheduler"]]).toEqual([false, false, false, false, false]);
  });
  it("makes a unique course ID from the name", () => {
    expect(makeCourseId("K Homeroom", [])).toBe("KHOME");
    expect(makeCourseId("Mathematics 6", [])).toBe("MATH6");
    expect(makeCourseId("K Homeroom", ["KHOME"])).toBe("KHOME-2");
    expect(makeCourseId("   ", [])).toBe("COURSE");
  });
  it("makes a safe, unique class key from a typed Class ID", () => {
    expect(makeSectionId("K-HR: 1", [])).toBe("K-HR-1");
    expect(makeSectionId("K-HR: 1", ["K-HR-1"])).toBe("K-HR-1-2");
  });
  it("requires a name and subject, and allows a blank course ID", () => {
    const ok = { id: "", name: "K Homeroom", dept: "Lower School", credits: 0 };
    expect(validateCourse(ok, [])).toBeNull();
    expect(validateCourse({ ...ok, name: " " }, [])).toBe("Course name is required.");
    expect(validateCourse({ ...ok, dept: "" }, [])).toBe("Subject is required.");
    expect(validateCourse({ ...ok, id: "A" }, ["A"])).toBe("That course ID already exists.");
    expect(validateCourse({ ...ok, id: "A" }, ["A"], true)).toBeNull();
  });
});
