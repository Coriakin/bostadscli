import type { Apartment } from "./types.js";

export const APARTMENTS_URL = "https://bostad.stockholm.se/AllaAnnonser/";

function isApartmentRecord(value: unknown): value is Apartment {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record["Gatuadress"] === "string" &&
    typeof record["Kommun"] === "string" &&
    typeof record["KoordinatLatitud"] === "number" &&
    typeof record["KoordinatLongitud"] === "number"
  );
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number, fetchFn: typeof fetch): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Unexpected HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchApartments(opts?: {
  timeoutMs?: number;
  retries?: number;
  fetchFn?: typeof fetch;
}): Promise<Apartment[]> {
  const timeoutMs = opts?.timeoutMs ?? 10_000;
  const retries = opts?.retries ?? 1;
  const fetchFn = opts?.fetchFn ?? fetch;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const data = await fetchJsonWithTimeout(APARTMENTS_URL, timeoutMs, fetchFn);

      if (!Array.isArray(data)) {
        throw new Error("Expected JSON array from apartment endpoint");
      }

      if (!data.every(isApartmentRecord)) {
        throw new Error("Apartment payload schema mismatch");
      }

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Failed to fetch apartments: ${(lastError as Error).message}`);
}
