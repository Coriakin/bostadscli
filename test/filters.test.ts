import { describe, expect, it } from "vitest";
import { applyFilters, applySort, isInsideBounds, matchesRentFilter, matchesRoomFilter } from "../src/filters.js";
import type { SearchCriteria } from "../src/types.js";
import { makeApartment } from "./factory.js";

const baseCriteria: SearchCriteria = {
  s: 59.0,
  n: 60.0,
  w: 17.0,
  e: 19.0,
  sort: "annonserad-fran-desc",
};

describe("bounds filtering", () => {
  it("includes apartments inside bounds", () => {
    const apartment = makeApartment({ KoordinatLatitud: 59.5, KoordinatLongitud: 18.2 });
    expect(isInsideBounds(apartment, baseCriteria)).toBe(true);
  });

  it("excludes apartments outside bounds", () => {
    const apartment = makeApartment({ KoordinatLatitud: 60.2, KoordinatLongitud: 18.2 });
    expect(isInsideBounds(apartment, baseCriteria)).toBe(false);
  });
});

describe("room and rent filters", () => {
  it("applies min and max room logic with ranges", () => {
    const apartment = makeApartment({
      AntalRum: null,
      "LägstaAntalRum": 2,
      "HögstaAntalRum": 4,
    });

    expect(matchesRoomFilter(apartment, { ...baseCriteria, minAntalRum: 4 })).toBe(true);
    expect(matchesRoomFilter(apartment, { ...baseCriteria, minAntalRum: 5 })).toBe(false);
    expect(matchesRoomFilter(apartment, { ...baseCriteria, maxAntalRum: 1 })).toBe(false);
  });

  it("applies max rent logic with ranges", () => {
    const apartment = makeApartment({
      Hyra: null,
      "LägstaHyran": 9000,
      "HögstaHyran": 12000,
    });

    expect(matchesRentFilter(apartment, { ...baseCriteria, maxHyra: 10000 })).toBe(true);
    expect(matchesRentFilter(apartment, { ...baseCriteria, maxHyra: 8000 })).toBe(false);
  });
});

describe("sorting and filter pipeline", () => {
  it("sorts by announced date descending", () => {
    const apartments = [
      makeApartment({ "LägenhetId": 1, AnnonseradFran: "2026-03-01" }),
      makeApartment({ "LägenhetId": 2, AnnonseradFran: "2026-03-07" }),
    ];

    const sorted = applySort(apartments, "annonserad-fran-desc");
    expect(sorted[0]["LägenhetId"]).toBe(2);
  });

  it("applies selected type filters", () => {
    const apartments = [
      makeApartment({ "LägenhetId": 1, Vanlig: true, Student: false }),
      makeApartment({ "LägenhetId": 2, Vanlig: false, Student: true }),
    ];

    const filtered = applyFilters(apartments, { ...baseCriteria, student: true });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]["LägenhetId"]).toBe(2);
  });
});
