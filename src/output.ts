import type { Apartment } from "./types.js";

const BASE_URL = "https://bostad.stockholm.se";

function formatCurrency(value: number): string {
  return value.toLocaleString("sv-SE");
}

function formatRooms(apartment: Apartment): string {
  if (apartment.AntalRum !== null) {
    return `${apartment.AntalRum}`;
  }

  if (apartment.LägstaAntalRum !== null && apartment.HögstaAntalRum !== null) {
    if (apartment.LägstaAntalRum === apartment.HögstaAntalRum) {
      return `${apartment.HögstaAntalRum}`;
    }
    return `${apartment.LägstaAntalRum}-${apartment.HögstaAntalRum}`;
  }

  return "-";
}

function formatArea(apartment: Apartment): string {
  if (apartment.Yta !== null) {
    return `${apartment.Yta}`;
  }

  if (apartment.LägstaYtan !== null && apartment.HögstaYtan !== null) {
    if (apartment.LägstaYtan === apartment.HögstaYtan) {
      return `${apartment.HögstaYtan}`;
    }
    return `${apartment.LägstaYtan}-${apartment.HögstaYtan}`;
  }

  return "-";
}

function formatRent(apartment: Apartment): string {
  if (apartment.Hyra !== null) {
    return formatCurrency(apartment.Hyra);
  }

  if (apartment.LägstaHyran !== null && apartment.HögstaHyran !== null) {
    if (apartment.LägstaHyran === apartment.HögstaHyran) {
      return formatCurrency(apartment.HögstaHyran);
    }
    return `${formatCurrency(apartment.LägstaHyran)}-${formatCurrency(apartment.HögstaHyran)}`;
  }

  return "-";
}

function cell(value: string, width: number): string {
  return value.length > width ? value.slice(0, width - 1) + "…" : value.padEnd(width, " ");
}

export function toTable(apartments: Apartment[]): string {
  const headers = [
    cell("Address", 28),
    cell("Municipality", 14),
    cell("Rooms", 7),
    cell("Area", 8),
    cell("Rent", 16),
    cell("Deadline", 10),
    "URL",
  ];

  const lines = [headers.join("  ")];

  for (const apartment of apartments) {
    lines.push(
      [
        cell(apartment.Gatuadress, 28),
        cell(apartment.Kommun, 14),
        cell(formatRooms(apartment), 7),
        cell(formatArea(apartment), 8),
        cell(formatRent(apartment), 16),
        cell(apartment.AnnonseradTill, 10),
        `${BASE_URL}${apartment.Url}`,
      ].join("  "),
    );
  }

  return lines.join("\n");
}

export function toJson(apartments: Apartment[]): string {
  return JSON.stringify(apartments, null, 2);
}
