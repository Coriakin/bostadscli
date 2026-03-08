export interface Apartment {
  "LägenhetId": number;
  "Gatuadress": string;
  "Kommun": string;
  "Stadsdel": string;
  "AnnonseradTill": string;
  "AnnonseradFran": string;
  "KoordinatLatitud": number;
  "KoordinatLongitud": number;
  "Url": string;
  "Antal": number;
  "AntalRum": number | null;
  "Yta": number | null;
  "Hyra": number | null;
  "LägstaAntalRum": number | null;
  "HögstaAntalRum": number | null;
  "LägstaYtan": number | null;
  "HögstaYtan": number | null;
  "LägstaHyran": number | null;
  "HögstaHyran": number | null;
  "Vanlig": boolean;
  "Student": boolean;
  "Ungdom": boolean;
  "Senior": boolean;
  "Korttid": boolean;
  "BostadSnabbt": boolean;
}

export type SortOrder =
  | "annonserad-fran-desc"
  | "annonserad-till-asc"
  | "hyra-asc"
  | "yta-asc"
  | "antal-rum-asc"
  | "omrade-asc";

export interface Bounds {
  s: number;
  n: number;
  w: number;
  e: number;
}

export interface SearchCriteria extends Bounds {
  sort: SortOrder;
  minAntalRum?: number;
  maxAntalRum?: number;
  maxHyra?: number;
  vanlig?: boolean;
  student?: boolean;
  ungdom?: boolean;
  senior?: boolean;
  korttid?: boolean;
}
