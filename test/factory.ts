import type { Apartment } from "../src/types.js";

export function makeApartment(overrides: Partial<Apartment> = {}): Apartment {
  return {
    "LägenhetId": 1,
    "Gatuadress": "Testgatan 1",
    "Kommun": "Stockholm",
    "Stadsdel": "Kista",
    "AnnonseradTill": "2026-03-08",
    "AnnonseradFran": "2026-03-01",
    "KoordinatLatitud": 59.4,
    "KoordinatLongitud": 18.1,
    "Url": "/bostad/1",
    "Antal": 1,
    "AntalRum": 2,
    "Yta": 45,
    "Hyra": 10000,
    "LägstaAntalRum": null,
    "HögstaAntalRum": null,
    "LägstaYtan": null,
    "HögstaYtan": null,
    "LägstaHyran": null,
    "HögstaHyran": null,
    "Vanlig": true,
    "Student": false,
    "Ungdom": false,
    "Senior": false,
    "Korttid": false,
    "BostadSnabbt": false,
    ...overrides,
  };
}
