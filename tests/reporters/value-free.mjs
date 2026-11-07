import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export default async function* report(events) {
  for await (const event of events) {
    if (event.type === "test:fail") {
      const file = typeof event.data.file === "string"
        ? relative(root, event.data.file)
        : "";
      const location = /^tests\/[\w/.-]+\.mjs$/.test(file) && !file.includes("..")
        ? file
        : "test";
      const line = Number.isSafeInteger(event.data.line) ? event.data.line : 0;
      const column = Number.isSafeInteger(event.data.column) ? event.data.column : 0;
      yield "FAIL " + location + ":" + line + ":" + column + "\n";
    }
    if (event.type === "test:summary") {
      const passed = Number.isSafeInteger(event.data.counts?.passed)
        ? event.data.counts.passed
        : 0;
      const failed = Number.isSafeInteger(event.data.counts?.failed)
        ? event.data.counts.failed
        : 0;
      yield "Tests: " + passed + " passed; " + failed + " failed\n";
    }
  }
}
