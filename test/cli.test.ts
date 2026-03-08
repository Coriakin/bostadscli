import { describe, expect, it, vi } from "vitest";
import { mergeOptions, parseArgs, runCli } from "../src/cli.js";
import { makeApartment } from "./factory.js";

describe("parseArgs", () => {
  it("parses required bounds and filters", () => {
    const parsed = parseArgs([
      "--s",
      "59.0",
      "--n",
      "60.0",
      "--w",
      "17.0",
      "--e",
      "19.0",
      "--max-hyra",
      "18000",
      "--vanlig",
      "--sort",
      "yta-asc",
    ]);

    expect(parsed.criteria.s).toBe(59.0);
    expect(parsed.criteria.maxHyra).toBe(18000);
    expect(parsed.criteria.vanlig).toBe(true);
    expect(parsed.criteria.sort).toBe("yta-asc");
  });

  it("allows missing bounds at parse stage", () => {
    const parsed = parseArgs(["--s", "59"]);
    expect(Number.isNaN(parsed.criteria.n)).toBe(true);
  });
});

describe("runCli", () => {
  it("prints table output with match count", async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => [
        makeApartment({ "LägenhetId": 10, Gatuadress: "A-gatan 1", Url: "/bostad/10" }),
      ],
    })) as unknown as typeof fetch;

    const code = await runCli(
      ["--s", "59", "--n", "60", "--w", "17", "--e", "19"],
      {
        fetchFn,
        stdout: { write: (chunk: string) => void stdout.push(chunk) },
        stderr: { write: (chunk: string) => void stderr.push(chunk) },
      },
    );

    const output = stdout.join("");
    expect(code).toBe(0);
    expect(output).toContain("A-gatan 1");
    expect(output).toContain("1 matching apartments");
    expect(stderr.join("")).toBe("");
  });

  it("prints json output", async () => {
    const stdout: string[] = [];

    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => [makeApartment({ "LägenhetId": 11 })],
    })) as unknown as typeof fetch;

    const code = await runCli(
      ["--s", "59", "--n", "60", "--w", "17", "--e", "19", "--json"],
      {
        fetchFn,
        stdout: { write: (chunk: string) => void stdout.push(chunk) },
        stderr: { write: () => undefined },
      },
    );

    expect(code).toBe(0);
    expect(stdout.join("")).toContain('"LägenhetId": 11');
  });

  it("returns non-zero and reports fetch errors", async () => {
    const stderr: string[] = [];

    const fetchFn = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const code = await runCli(
      ["--s", "59", "--n", "60", "--w", "17", "--e", "19"],
      {
        fetchFn,
        stdout: { write: () => undefined },
        stderr: { write: (chunk: string) => void stderr.push(chunk) },
      },
    );

    expect(code).toBe(1);
    expect(stderr.join("")).toContain("Failed to fetch apartments");
  });

  it("uses config when bounds are not passed via CLI", async () => {
    const stdout: string[] = [];

    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => [makeApartment({ "LägenhetId": 12, Gatuadress: "Configgatan 2" })],
    })) as unknown as typeof fetch;

    const code = await runCli(
      [],
      {
        fetchFn,
        loadConfigFn: async () => ({
          s: 59,
          n: 60,
          w: 17,
          e: 19,
          vanlig: true,
        }),
        stdout: { write: (chunk: string) => void stdout.push(chunk) },
        stderr: { write: () => undefined },
      },
    );

    expect(code).toBe(0);
    expect(stdout.join("")).toContain("Configgatan 2");
  });

  it("lets CLI arguments override config values", async () => {
    const merged = mergeOptions(
      parseArgs(["--s", "58.5", "--n", "60.1", "--w", "16.8", "--e", "18.8", "--sort", "yta-asc"]),
      {
        s: 1,
        n: 2,
        w: 3,
        e: 4,
        sort: "hyra-asc",
      },
    );

    expect(merged.criteria.s).toBe(58.5);
    expect(merged.criteria.sort).toBe("yta-asc");
  });

  it("uses config sort when CLI sort is not provided", () => {
    const merged = mergeOptions(
      parseArgs(["--s", "58.5", "--n", "60.1", "--w", "16.8", "--e", "18.8"]),
      {
        sort: "hyra-asc",
      },
    );
    expect(merged.criteria.sort).toBe("hyra-asc");
  });
});
