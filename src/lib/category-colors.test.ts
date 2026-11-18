import { describe, expect, it } from "vitest";
import { categoryColor } from "./category-colors";
import { setTypeColors } from "./type-colors";
describe("category colors", () => {
  it("uses the color the administrator set for the assignment type", () => { setTypeColors([{ description: "Quiz", color: "#123456" }]); expect(categoryColor([{ cat: "QUIZ", weight: 50, drop: false, color: "#ffffff" }], "QUIZ")).toBe("#123456"); setTypeColors([]); });
  it("gives the same category the same color every time", () => { expect(categoryColor(undefined, "TEST")).toBe(categoryColor([], "TEST")); });
});
