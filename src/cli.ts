#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { runCli } from "./cli-core.js";

export * from "./cli-core.js";

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
