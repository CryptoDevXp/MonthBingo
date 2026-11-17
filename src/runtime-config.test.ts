import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_RUNTIME_SETTINGS, isPublicDatabaseMode, isServerModeEnabled, loadRuntimeSettings } from "./runtime-config";

test("server mode is enabled only when appsettings explicitly opts in", () => {
  assert.equal(isServerModeEnabled({ serverMode: true }), true);
  assert.equal(isServerModeEnabled({ serverMode: false }), false);
  assert.equal(isServerModeEnabled({}), false);
  assert.equal(isServerModeEnabled(null), false);
});

test("database mode is public only when explicitly configured", () => {
  assert.equal(isPublicDatabaseMode({ databaseMode: "public" }), true);
  assert.equal(isPublicDatabaseMode({ databaseMode: "PRIVATE" }), false);
  assert.equal(isPublicDatabaseMode({ databaseMode: "private" }), false);
  assert.equal(isPublicDatabaseMode({}), false);
  assert.equal(isPublicDatabaseMode(null), false);
});

test("loads the default runtime settings safely when the config file is missing", () => {
  const settings = loadRuntimeSettings("/tmp/does-not-exist");
  assert.deepEqual(settings, DEFAULT_RUNTIME_SETTINGS);
});
