import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fetchApartments } from "./api.js";
import { applyFilters, applySort } from "./filters.js";
import { toJson, toTable } from "./output.js";
import type { SearchCriteria, SortOrder } from "./types.js";

const ALLOWED_SORTS: SortOrder[] = [
  "annonserad-fran-desc",
  "annonserad-till-asc",
  "hyra-asc",
  "yta-asc",
  "antal-rum-asc",
  "omrade-asc",
];

function printHelp(): string {
  return [
    "Usage:",
    "  bostad --s <south> --n <north> --w <west> --e <east> [options]",
    "",
    "Required:",
    "  --s, --n, --w, --e              Bounding box coordinates",
    "",
    "Options:",
    "  --sort <order>                  annonserad-fran-desc | annonserad-till-asc | hyra-asc | yta-asc | antal-rum-asc | omrade-asc",
    "  --min-antal-rum <number>",
    "  --max-antal-rum <number>",
    "  --max-hyra <number>",
    "  --vanlig                        Include regular rentals",
    "  --student                       Include student rentals",
    "  --ungdom                        Include youth rentals",
    "  --senior                        Include senior rentals",
    "  --korttid                       Include short-term rentals",
    "  --json                          Output JSON",
    "  --timeout-ms <number>           Request timeout in ms (default: 10000)",
    "  --config <path>                 Optional config file path (default: ./bostadcli.config.json)",
    "  --help                          Show this help",
  ].join("\n");
}

function parseNumberFlag(name: string, value: string | undefined): number {
  if (!value) {
    throw new Error(`Missing value for ${name}`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${name}: ${value}`);
  }

  return parsed;
}

export interface CliOptions {
  criteria: SearchCriteria;
  json: boolean;
  help: boolean;
  timeoutMs: number;
  configPath?: string;
  sortProvided: boolean;
  timeoutProvided: boolean;
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    criteria: {
      s: Number.NaN,
      n: Number.NaN,
      w: Number.NaN,
      e: Number.NaN,
      sort: "annonserad-fran-desc",
    },
    json: false,
    help: false,
    timeoutMs: 10_000,
    configPath: undefined,
    sortProvided: false,
    timeoutProvided: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case "--help":
        options.help = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "--vanlig":
        options.criteria.vanlig = true;
        break;
      case "--student":
        options.criteria.student = true;
        break;
      case "--ungdom":
        options.criteria.ungdom = true;
        break;
      case "--senior":
        options.criteria.senior = true;
        break;
      case "--korttid":
        options.criteria.korttid = true;
        break;
      case "--s":
        options.criteria.s = parseNumberFlag(arg, argv[++i]);
        break;
      case "--n":
        options.criteria.n = parseNumberFlag(arg, argv[++i]);
        break;
      case "--w":
        options.criteria.w = parseNumberFlag(arg, argv[++i]);
        break;
      case "--e":
        options.criteria.e = parseNumberFlag(arg, argv[++i]);
        break;
      case "--min-antal-rum":
        options.criteria.minAntalRum = parseNumberFlag(arg, argv[++i]);
        break;
      case "--max-antal-rum":
        options.criteria.maxAntalRum = parseNumberFlag(arg, argv[++i]);
        break;
      case "--max-hyra":
        options.criteria.maxHyra = parseNumberFlag(arg, argv[++i]);
        break;
      case "--timeout-ms":
        options.timeoutMs = parseNumberFlag(arg, argv[++i]);
        options.timeoutProvided = true;
        break;
      case "--config":
        options.configPath = argv[++i];
        if (!options.configPath) {
          throw new Error("Missing value for --config");
        }
        break;
      case "--sort": {
        const sort = argv[++i] as SortOrder | undefined;
        if (!sort || !ALLOWED_SORTS.includes(sort)) {
          throw new Error(`Invalid --sort value. Allowed: ${ALLOWED_SORTS.join(", ")}`);
        }
        options.criteria.sort = sort;
        options.sortProvided = true;
        break;
      }
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

interface ConfigFile {
  s?: number;
  n?: number;
  w?: number;
  e?: number;
  sort?: SortOrder;
  minAntalRum?: number;
  maxAntalRum?: number;
  maxHyra?: number;
  vanlig?: boolean;
  student?: boolean;
  ungdom?: boolean;
  senior?: boolean;
  korttid?: boolean;
  json?: boolean;
  timeoutMs?: number;
}

function isValidSort(sort: unknown): sort is SortOrder {
  return typeof sort === "string" && ALLOWED_SORTS.includes(sort as SortOrder);
}

function pickNumber(config: ConfigFile, key: keyof ConfigFile): number | undefined {
  const value = config[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric value in config for "${key}"`);
  }
  return value;
}

function pickBoolean(config: ConfigFile, key: keyof ConfigFile): boolean | undefined {
  const value = config[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new Error(`Invalid boolean value in config for "${key}"`);
  }
  return value;
}

export async function loadConfig(configPath?: string): Promise<ConfigFile> {
  const explicitPath = configPath ? resolve(configPath) : undefined;
  const defaultPath = resolve(process.cwd(), "bostadcli.config.json");
  const filePath = explicitPath ?? defaultPath;

  try {
    await access(filePath);
  } catch {
    if (explicitPath) {
      throw new Error(`Config file not found: ${filePath}`);
    }
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to parse config file ${filePath}: ${(error as Error).message}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Config file must contain a JSON object: ${filePath}`);
  }

  const config = parsed as ConfigFile;
  if (config.sort !== undefined && !isValidSort(config.sort)) {
    throw new Error(`Invalid sort in config. Allowed: ${ALLOWED_SORTS.join(", ")}`);
  }

  return {
    s: pickNumber(config, "s"),
    n: pickNumber(config, "n"),
    w: pickNumber(config, "w"),
    e: pickNumber(config, "e"),
    sort: config.sort,
    minAntalRum: pickNumber(config, "minAntalRum"),
    maxAntalRum: pickNumber(config, "maxAntalRum"),
    maxHyra: pickNumber(config, "maxHyra"),
    vanlig: pickBoolean(config, "vanlig"),
    student: pickBoolean(config, "student"),
    ungdom: pickBoolean(config, "ungdom"),
    senior: pickBoolean(config, "senior"),
    korttid: pickBoolean(config, "korttid"),
    json: pickBoolean(config, "json"),
    timeoutMs: pickNumber(config, "timeoutMs"),
  };
}

export function mergeOptions(cli: CliOptions, config: ConfigFile): CliOptions {
  const criteria: SearchCriteria = {
    s: Number.isNaN(cli.criteria.s) ? (config.s ?? Number.NaN) : cli.criteria.s,
    n: Number.isNaN(cli.criteria.n) ? (config.n ?? Number.NaN) : cli.criteria.n,
    w: Number.isNaN(cli.criteria.w) ? (config.w ?? Number.NaN) : cli.criteria.w,
    e: Number.isNaN(cli.criteria.e) ? (config.e ?? Number.NaN) : cli.criteria.e,
    sort: cli.sortProvided ? cli.criteria.sort : (config.sort ?? "annonserad-fran-desc"),
    minAntalRum: cli.criteria.minAntalRum ?? config.minAntalRum,
    maxAntalRum: cli.criteria.maxAntalRum ?? config.maxAntalRum,
    maxHyra: cli.criteria.maxHyra ?? config.maxHyra,
    vanlig: cli.criteria.vanlig ?? config.vanlig,
    student: cli.criteria.student ?? config.student,
    ungdom: cli.criteria.ungdom ?? config.ungdom,
    senior: cli.criteria.senior ?? config.senior,
    korttid: cli.criteria.korttid ?? config.korttid,
  };

  return {
    criteria,
    json: cli.json || config.json || false,
    help: cli.help,
    timeoutMs: cli.timeoutProvided ? cli.timeoutMs : (config.timeoutMs ?? 10_000),
    configPath: cli.configPath,
    sortProvided: cli.sortProvided,
    timeoutProvided: cli.timeoutProvided,
  };
}

export async function runCli(
  argv: string[],
  deps?: {
    fetchFn?: typeof fetch;
    stdout?: Pick<typeof process.stdout, "write">;
    stderr?: Pick<typeof process.stderr, "write">;
    loadConfigFn?: (configPath?: string) => Promise<ConfigFile>;
  },
): Promise<number> {
  const stdout = deps?.stdout ?? process.stdout;
  const stderr = deps?.stderr ?? process.stderr;

  try {
    const cliOptions = parseArgs(argv);
    const config = await (deps?.loadConfigFn ?? loadConfig)(cliOptions.configPath);
    const options = mergeOptions(cliOptions, config);

    if (options.help) {
      stdout.write(`${printHelp()}\n`);
      return 0;
    }

    const requiredBounds = [options.criteria.s, options.criteria.n, options.criteria.w, options.criteria.e];
    if (requiredBounds.some((x) => Number.isNaN(x))) {
      throw new Error("Missing required bounds. Provide --s --n --w --e, or set them in config");
    }

    const apartments = await fetchApartments({ timeoutMs: options.timeoutMs, retries: 1, fetchFn: deps?.fetchFn });
    const filtered = applyFilters(apartments, options.criteria);
    const sorted = applySort(filtered, options.criteria.sort);

    if (options.json) {
      stdout.write(`${toJson(sorted)}\n`);
    } else {
      stdout.write(`${toTable(sorted)}\n`);
      stdout.write(`\n${sorted.length} matching apartments\n`);
    }

    return 0;
  } catch (error) {
    stderr.write(`Error: ${(error as Error).message}\n`);
    return 1;
  }
}
