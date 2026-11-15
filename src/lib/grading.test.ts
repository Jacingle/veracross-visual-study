import { describe, expect, it } from "vitest";
import { defaultWeights, letterFor, weightedAverage } from "./grading";

describe("grade math", () => {
  it("default weights always total 100", () => {
    expect(defaultWeights(["HOMEWORK", "QUIZ", "TEST"]).reduce((s, w) => s + w.weight, 0)).toBe(100);
  });
  it("weights categories by their percentage", () => {
    const items = [{ category: "HW", points: 10, score: 10 }, { category: "TEST", points: 100, score: 50 }];
    expect(weightedAverage(items, [{ cat: "HW", weight: 25, drop: false }, { cat: "TEST", weight: 75, drop: false }])).toBe(62.5);
  });
  it("drop lowest removes the weakest score in that category", () => {
    const items = [{ category: "QZ", points: 10, score: 2 }, { category: "QZ", points: 10, score: 9 }];
    expect(weightedAverage(items, [{ cat: "QZ", weight: 100, drop: true }])).toBe(90);
  });
  it("ungraded categories don't drag the average down", () => {
    const items = [{ category: "HW", points: 10, score: 9 }, { category: "TEST", points: 100 }];
    expect(weightedAverage(items, [{ cat: "HW", weight: 20, drop: false }, { cat: "TEST", weight: 80, drop: false }])).toBe(90);
  });
  it("letter scale cut-offs", () => {
    expect(letterFor(93)).toBe("A"); expect(letterFor(89.9)).toBe("B+"); expect(letterFor(59)).toBe("F");
  });
});
