import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import report from "./reporters/value-free.mjs";

test("failure reporting emits source locations and counts without payload values", async () => {
  const privateValue = "invented-sensitive-payload";
  const events = [
    { type: "test:stdout", data: { message: privateValue } },
    { type: "test:stderr", data: { message: privateValue } },
    { type: "test:fail", data: {
      file: fileURLToPath(import.meta.url),
      line: 12,
      column: 3,
      name: privateValue,
      details: { error: new Error(privateValue), expected: privateValue },
    } },
    { type: "test:summary", data: { counts: { passed: 4, failed: 1 } } },
  ];
  let output = "";
  for await (const part of report(events)) output += part;
  assert.equal(output.includes(privateValue), false);
  assert.equal(output, "FAIL tests/test_diagnostics_js.mjs:12:3\nTests: 4 passed; 1 failed\n");
});

test("unknown source and malformed metadata use safe placeholders", async () => {
  for (const file of ["/outside/example.mjs", null, { value: "fixture" }]) {
    let output = "";
    for await (const part of report([
      { type: "test:fail", data: { file, line: "fixture", column: null } },
      { type: "test:summary", data: {} },
    ])) output += part;
    assert.equal(output, "FAIL test:0:0\nTests: 0 passed; 0 failed\n");
  }
});
