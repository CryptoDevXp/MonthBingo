import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_RUNTIME_SETTINGS, isServerModeEnabled, loadRuntimeSettings } from "./runtime-config";

test("server mode is enabled only when appsettings explicitly opts in", () => {
  assert.equal(isServerModeEnabled({ serverMode: true }), true);
  assert.equal(isServerModeEnabled({ serverMode: false }), false);
  assert.equal(isServerModeEnabled({}), false);
  assert.equal(isServerModeEnabled(null), false);
});

test("loads the default runtime settings safely when the config file is missing", () => {
  const settings = loadRuntimeSettings("/tmp/does-not-exist");
  assert.deepEqual(settings, DEFAULT_RUNTIME_SETTINGS);
});
