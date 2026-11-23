import { describe, expect, it } from "vitest";
import { blockTimes, changeSection, enrollStudent, fmtTime, placementFor, reviewStudent, weeklyGrid, withdrawStudent, type ReviewSection } from "./schedule-review";
import type { SchedulingSet } from "./scheduling";

const set: SchedulingSet = {
  id: "set", name: "Weekly", terms: ["2026-S1", "2026-S2"], weekdays: [1, 2],
  blocks: [{ id: "a", name: "A Block", days: [], start: "", end: "" }, { id: "b", name: "B Block", days: [], start: "", end: "" }, { id: "l", name: "Lunch", days: [], start: "", end: "" }],
  meetings: [
    { id: "m1", day: 1, start: "08:00", end: "08:50", blockId: "a" }, { id: "m2", day: 1, start: "09:00", end: "09:50", blockId: "b" },
    { id: "m3", day: 2, start: "08:00", end: "08:50", blockId: "b" }, { id: "m4", day: 2, start: "09:00", end: "09:50", blockId: "a" },
  ],
};
const cls = (id: string, courseNo: string, block: string | undefined, terms = ["2026-S1", "2026-S2"], extra: Partial<ReviewSection> = {}): ReviewSection => ({
  id, code: id, name: `Course ${courseNo}`, courseNo, terms, scheduleSetId: block ? "set" : undefined, scheduleBlockId: block,
  teacherIds: [], room: "", studentIds: ["s1"], published: true, ...extra,
});
const review = (sections: ReviewSection[], settings = {}) => reviewStudent({ sections, studentId: "s1", yearId: "2026", sets: [set], settings });
const kinds = (sections: ReviewSection[], settings = {}) => review(sections, settings).issues.map((i) => i.kind);

describe("student schedule review", () => {
  it("accepts a full, even schedule (Lunch does not need a class)", () => {
    const r = review([cls("e1", "ENG", "a"), cls("m1", "MATH", "b")]);
    expect(r.issues).toEqual([]);
    expect(r.terms[0]?.rows.find((x) => x.block.id === "l")?.required).toBe(false);
  });
  it("flags a block with nothing in it, per term", () => {
    const r = review([cls("e1", "ENG", "a"), cls("m1", "MATH", "b", ["2026-S1"])]);
    const empty = r.issues.filter((i) => i.kind === "empty-block");
    expect(empty).toHaveLength(1);
    expect(empty[0]?.termId).toBe("2026-S2");
    expect(empty[0]?.blockId).toBe("b");
  });
  it("flags two classes in one block", () => {
    const r = review([cls("e1", "ENG", "a"), cls("m1", "MATH", "a"), cls("h1", "HIST", "b")]);
    const conflict = r.issues.find((i) => i.kind === "block-conflict");
    expect(conflict?.sectionIds.sort()).toEqual(["e1", "m1"]);
    expect(r.issues.some((i) => i.kind === "empty-block")).toBe(false);
  });
  it("flags two sections of the same course in overlapping terms, but not in different terms", () => {
    expect(kinds([cls("e1", "ENG", "a"), cls("e2", "ENG", "b"), cls("m1", "MATH", "b")])).toContain("duplicate-course");
    const split = [cls("e1", "ENG", "a", ["2026-S1"]), cls("e2", "ENG", "a", ["2026-S2"]), cls("m1", "MATH", "b")];
    expect(kinds(split)).not.toContain("duplicate-course");
  });
  it("flags a term with too few classes, using the blocks that need a class unless a minimum is set", () => {
    expect(kinds([cls("e1", "ENG", "a")])).toContain("term-short");
    expect(kinds([cls("e1", "ENG", "a"), cls("m1", "MATH", "b")], { minPerTerm: 3 })).toContain("term-short");
    expect(kinds([cls("e1", "ENG", "a"), cls("m1", "MATH", "b")], { minPerTerm: 2 })).not.toContain("term-short");
  });
  it("flags uneven terms", () => {
    const r = review([cls("e1", "ENG", "a"), cls("m1", "MATH", "b"), cls("h1", "HIST", undefined, ["2026-S1"])]);
    const uneven = r.issues.find((i) => i.kind === "term-uneven");
    expect(uneven?.message).toMatch(/Semester 1 has 3 classes but .*Semester 2 has 2 classes/);
  });
  it("warns about classes with no block, drafts, and terms without a timetable", () => {
    const k = kinds([cls("e1", "ENG", "a"), cls("m1", "MATH", "b"), cls("x1", "ART", undefined, ["2026-S1", "2026-S2"], { published: false })]);
    expect(k).toContain("unscheduled");
    expect(k).toContain("unpublished");
    const none = reviewStudent({ sections: [], studentId: "s1", yearId: "2026", sets: [] });
    expect(none.issues.map((i) => i.kind)).toContain("no-timetable");
  });
  it("lets the administrator require or exempt a block", () => {
    const base = [cls("e1", "ENG", "a"), cls("m1", "MATH", "b")];
    expect(kinds(base, { required: { l: true } })).toContain("empty-block");
    expect(kinds([cls("e1", "ENG", "a")], { required: { b: false } })).not.toContain("empty-block");
  });
  it("ignores other students' classes and other school years", () => {
    const other = cls("z1", "ENG", "a", ["2025-S1"]);
    expect(review([other, cls("o1", "ENG", "a", ["2026-S1", "2026-S2"], { studentIds: ["s2"] })]).terms.every((t) => t.classes.length === 0)).toBe(true);
  });
});

describe("previewing a section for a student", () => {
  const mine = [cls("e1", "ENG", "a"), cls("m1", "MATH", "b")];
  it("reports a taken block and a repeated course", () => {
    expect(placementFor({ candidate: cls("h1", "HIST", "a", ["2026-S1"], { studentIds: [] }), mine, sets: [set] }).conflicts[0]).toMatch(/A Block is already taken by Course ENG/);
    expect(placementFor({ candidate: cls("e2", "ENG", "l", ["2026-S2"], { studentIds: [] }), mine, sets: [set] }).conflicts[0]).toMatch(/Already in Course ENG/);
  });
  it("is clear when swapping sections of one course and when the block is open", () => {
    expect(placementFor({ candidate: cls("e2", "ENG", "a", ["2026-S1", "2026-S2"], { studentIds: [] }), mine, sets: [set], replacing: "e1" }).conflicts).toEqual([]);
    expect(placementFor({ candidate: cls("h1", "HIST", "l", ["2026-S1"], { studentIds: [] }), mine, sets: [set] }).conflicts).toEqual([]);
  });
  it("notes a section that has no block", () => {
    expect(placementFor({ candidate: cls("h1", "HIST", undefined, ["2026-S1"], { studentIds: [] }), mine, sets: [set] }).notes).toHaveLength(1);
  });
});

describe("enrollment helpers and timetable text", () => {
  const all = [cls("e1", "ENG", "a", undefined, { studentIds: [] }), cls("e2", "ENG", "b", undefined, { studentIds: ["s1"] })];
  it("enrolls, withdraws and changes section without touching others", () => {
    expect(enrollStudent(all, "e1", "s1")[0]?.studentIds).toEqual(["s1"]);
    expect(enrollStudent(enrollStudent(all, "e1", "s1"), "e1", "s1")[0]?.studentIds).toEqual(["s1"]);
    expect(withdrawStudent(all, "e2", "s1")[1]?.studentIds).toEqual([]);
    const moved = changeSection(all, "s1", "e2", "e1");
    expect(moved.map((c) => c.studentIds)).toEqual([["s1"], []]);
  });
  it("describes block times and the weekly grid", () => {
    expect(fmtTime("13:05")).toBe("1:05 pm");
    expect(fmtTime("00:00")).toBe("12:00 am");
    expect(blockTimes(set, "a")).toBe("Mon 8:00 am–8:50 am · Tue 9:00 am–9:50 am");
    expect(blockTimes(set, "l")).toBe("");
    const g = weeklyGrid(set);
    expect(g.days).toEqual([1, 2]);
    expect(g.slots.map((s) => s.start)).toEqual(["08:00", "09:00"]);
    expect(g.cell(2, "09:00-09:50")?.blockId).toBe("a");
  });
});
