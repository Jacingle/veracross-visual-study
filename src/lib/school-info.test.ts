import { describe, expect, it } from "vitest";
import { changedFields, cleanSchool, validateSchool } from "./school-info";
import { applySchool, SCHOOL, SCHOOL_DEFAULT, type SchoolInfo } from "./sis-data";

const ok: SchoolInfo = { ...SCHOOL_DEFAULT, name: "Oak Hill School", short: "ohs", domain: "@OakHill.edu ", website: "https://oakhill.edu" };

describe("school information", () => {
  it("cleans a draft: trims, upper-cases the short name, stores the domain without @", () => {
    expect(cleanSchool({ ...ok, name: "  Oak Hill School ", phone: " 555-1234 " })).toMatchObject({ name: "Oak Hill School", short: "OHS", domain: "oakhill.edu", phone: "555-1234" });
  });
  it("accepts a good draft and explains each problem", () => {
    expect(validateSchool(ok)).toBeNull();
    expect(validateSchool({ ...ok, name: "  " })).toMatch(/name/);
    expect(validateSchool({ ...ok, short: "TOOLONGNAME" })).toMatch(/short name/);
    expect(validateSchool({ ...ok, short: "A B" })).toMatch(/no spaces/);
    expect(validateSchool({ ...ok, domain: "nodot" })).toMatch(/email domain/);
    expect(validateSchool({ ...ok, website: "oakhill.edu" })).toMatch(/https?:/);
    expect(validateSchool({ ...ok, logo: "data:text/html;base64,AAAA" })).toMatch(/logo/);
    expect(validateSchool({ ...ok, logo: "data:image/png;base64,AAAA" })).toBeNull();
  });
  it("lists the fields that changed", () => {
    expect(changedFields({ ...ok, city: "Austin" }, ok)).toEqual(["city"]);
    expect(changedFields(ok, ok)).toEqual([]);
  });
  it("applySchool shows saved values and falls back to the defaults", () => {
    applySchool({ name: "Oak Hill School", logo: "data:image/png;base64,AAAA" });
    expect(SCHOOL).toMatchObject({ name: "Oak Hill School", short: "CRA", logo: "data:image/png;base64,AAAA" });
    applySchool();
    expect(SCHOOL).toEqual(SCHOOL_DEFAULT);
  });
});
