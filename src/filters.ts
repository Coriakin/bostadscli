import type { Apartment, SearchCriteria, SortOrder } from "./types.js";

const EPSILON = 0.00001;

export function isInsideBounds(apartment: Apartment, criteria: SearchCriteria): boolean {
  return (
    apartment.KoordinatLatitud + EPSILON > criteria.s &&
    apartment.KoordinatLatitud - EPSILON < criteria.n &&
    apartment.KoordinatLongitud + EPSILON > criteria.w &&
    apartment.KoordinatLongitud - EPSILON < criteria.e
  );
}

export function matchesRoomFilter(apartment: Apartment, criteria: SearchCriteria): boolean {
  if (criteria.minAntalRum !== undefined) {
    if (apartment.LägstaAntalRum !== null && apartment.HögstaAntalRum !== null) {
      if (apartment.HögstaAntalRum + 0.5 < criteria.minAntalRum) {
        return false;
      }
    } else if (apartment.AntalRum !== null && apartment.AntalRum < criteria.minAntalRum) {
      return false;
    }
  }

  if (criteria.maxAntalRum !== undefined) {
    if (apartment.LägstaAntalRum !== null && apartment.HögstaAntalRum !== null) {
      if (apartment.LägstaAntalRum > criteria.maxAntalRum + 0.5) {
        return false;
      }
    } else if (apartment.AntalRum !== null && apartment.AntalRum > criteria.maxAntalRum + 0.5) {
      return false;
    }
  }

  return true;
}

export function matchesRentFilter(apartment: Apartment, criteria: SearchCriteria): boolean {
  if (criteria.maxHyra === undefined) {
    return true;
  }

  if (apartment.LägstaHyran !== null && apartment.HögstaHyran !== null) {
    return apartment.LägstaHyran <= criteria.maxHyra;
  }

  if (apartment.Hyra !== null) {
    return apartment.Hyra <= criteria.maxHyra;
  }

  return true;
}

export function matchesTypeFilter(apartment: Apartment, criteria: SearchCriteria): boolean {
  const anyTypeFilter = Boolean(
    criteria.vanlig || criteria.student || criteria.ungdom || criteria.senior || criteria.korttid,
  );

  if (!anyTypeFilter) {
    return true;
  }

  return Boolean(
    (criteria.vanlig && apartment.Vanlig) ||
      (criteria.student && apartment.Student) ||
      (criteria.ungdom && apartment.Ungdom) ||
      (criteria.senior && apartment.Senior) ||
      (criteria.korttid && apartment.Korttid),
  );
}

function omradeCompare(a: Apartment, b: Apartment): number {
  const kommunSort = a.Kommun.localeCompare(b.Kommun, "sv-SE");
  if (kommunSort !== 0) {
    return kommunSort;
  }

  const stadsdelSort = a.Stadsdel.localeCompare(b.Stadsdel, "sv-SE");
  if (stadsdelSort !== 0) {
    return stadsdelSort;
  }

  return a.Gatuadress.localeCompare(b.Gatuadress, "sv-SE");
}

function nullSort(a: number | null, b: number | null): number {
  if (a === null) {
    return -1;
  }
  if (b === null) {
    return 1;
  }
  return Number.NaN;
}

function sortComparator(sort: SortOrder): (a: Apartment, b: Apartment) => number {
  switch (sort) {
    case "annonserad-fran-desc":
      return (a, b) => +new Date(b.AnnonseradFran) - +new Date(a.AnnonseradFran) || omradeCompare(a, b);
    case "annonserad-till-asc":
      return (a, b) => +new Date(a.AnnonseradTill) - +new Date(b.AnnonseradTill) || omradeCompare(a, b);
    case "hyra-asc":
      return (a, b) => nullSort(a.Hyra, b.Hyra) || (a.Hyra ?? 0) - (b.Hyra ?? 0) || omradeCompare(a, b);
    case "yta-asc":
      return (a, b) => nullSort(a.Yta, b.Yta) || (a.Yta ?? 0) - (b.Yta ?? 0) || omradeCompare(a, b);
    case "antal-rum-asc":
      return (a, b) =>
        nullSort(a.AntalRum, b.AntalRum) || (a.AntalRum ?? 0) - (b.AntalRum ?? 0) || omradeCompare(a, b);
    case "omrade-asc":
      return omradeCompare;
    default:
      return (a, b) => +new Date(b.AnnonseradFran) - +new Date(a.AnnonseradFran) || omradeCompare(a, b);
  }
}

export function applyFilters(apartments: Apartment[], criteria: SearchCriteria): Apartment[] {
  return apartments.filter(
    (apartment) =>
      isInsideBounds(apartment, criteria) &&
      matchesRoomFilter(apartment, criteria) &&
      matchesRentFilter(apartment, criteria) &&
      matchesTypeFilter(apartment, criteria),
  );
}

export function applySort(apartments: Apartment[], sort: SortOrder): Apartment[] {
  return apartments.slice().sort(sortComparator(sort));
}
