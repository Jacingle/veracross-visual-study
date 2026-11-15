import { describe, expect, it } from "vitest";
import { categoryColor } from "./category-colors";
describe("category colors", () => {
  it("uses the teacher-chosen weight color", () => { expect(categoryColor([{ cat: "QUIZ", weight: 50, drop: false, color: "#123456" }], "QUIZ")).toBe("#123456"); });
  it("gives the same category the same color every time", () => { expect(categoryColor(undefined, "TEST")).toBe(categoryColor([], "TEST")); });
});
