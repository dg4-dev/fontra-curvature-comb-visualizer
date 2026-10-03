import assert from "node:assert/strict";
import { test } from "node:test";
import { CombSettings, DEFAULT_SETTINGS, SCALE_MAX } from "../src/settings.js";

class MemoryStorage {
  constructor(initial = {}) {
    this.data = { ...initial };
  }
  getItem(key) {
    return key in this.data ? this.data[key] : null;
  }
  setItem(key, value) {
    this.data[key] = String(value);
  }
}

test("defaults are used without stored values", () => {
  const settings = new CombSettings(new MemoryStorage());
  assert.deepEqual(settings.values, DEFAULT_SETTINGS);
});

test("values persist and notify listeners", () => {
  const storage = new MemoryStorage();
  const settings = new CombSettings(storage);
  const events = [];
  settings.addListener((key, value) => events.push([key, value]));
  settings.set("scale", 2.5);
  settings.set("scale", 2.5); // unchanged: no event
  settings.set("visible", false);
  assert.deepEqual(events, [
    ["scale", 2.5],
    ["visible", false],
  ]);
  const reloaded = new CombSettings(storage);
  assert.equal(reloaded.get("scale"), 2.5);
  assert.equal(reloaded.get("visible"), false);
});

test("invalid values are sanitized", () => {
  const settings = new CombSettings(new MemoryStorage());
  settings.set("scale", 1e9);
  assert.equal(settings.get("scale"), SCALE_MAX);
  settings.set("density", "12.6");
  assert.equal(settings.get("density"), 13);
  settings.set("density", undefined);
  assert.equal(settings.get("density"), DEFAULT_SETTINGS.density);
  assert.throws(() => settings.set("nope", 1));
});

test("corrupt storage falls back to defaults", () => {
  const storage = new MemoryStorage({
    "fontra-plugin-curvature-comb.settings": "{not json",
  });
  const settings = new CombSettings(storage);
  assert.deepEqual(settings.values, DEFAULT_SETTINGS);
});

test("reset restores defaults", () => {
  const settings = new CombSettings(new MemoryStorage());
  settings.set("selectedContoursOnly", true);
  settings.set("density", 50);
  settings.reset();
  assert.deepEqual(settings.values, DEFAULT_SETTINGS);
});
