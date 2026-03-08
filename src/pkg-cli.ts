import { runCli } from "./cli-core.js";

runCli(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
});
