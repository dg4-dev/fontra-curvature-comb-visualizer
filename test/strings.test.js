import assert from "node:assert/strict";
import { test } from "node:test";
import { currentLanguage, strings, translate } from "../src/strings.js";

// Language codes offered by Fontra (src-js/fontra-core/src/localization.js)
const FONTRA_LANGUAGES = [
  "en",
  "zh-CN",
  "zh-TW",
  "ja",
  "de",
  "nl",
  "fr",
  "it",
  "es-ES",
  "es-419",
  "pt-BR",
  "pt-PT",
  "tl",
  "ru",
];

test("every table uses one of Fontra's language codes", () => {
  for (const language of Object.keys(strings)) {
    assert.ok(FONTRA_LANGUAGES.includes(language), language);
  }
});

test("every table has exactly the English keys", () => {
  const keys = Object.keys(strings.en).sort();
  for (const [language, table] of Object.entries(strings)) {
    assert.deepEqual(Object.keys(table).sort(), keys, language);
  }
});

test("the language comes from Fontra's localStorage key", () => {
  const storage = {
    getItem: (key) => (key === "fontra-language-language" ? "zh-TW" : null),
  };
  assert.equal(currentLanguage(storage), "zh-TW");
  assert.equal(currentLanguage({ getItem: () => null }), "en");
  assert.equal(currentLanguage(undefined), "en");
  const throwing = {
    getItem() {
      throw new Error("denied");
    },
  };
  assert.equal(currentLanguage(throwing), "en");
});

test("the table for the exact language code is used", () => {
  assert.equal(translate("panel.title", "ja"), "曲率コーム");
  assert.equal(translate("setting.density", "zh-CN"), "每段采样数");
  assert.equal(translate("setting.density", "zh-TW"), "每段取樣數");
});

test("unknown languages and keys fall back like Fontra", () => {
  assert.equal(translate("panel.title", "tl"), "Curvature comb");
  assert.equal(translate("panel.title", "xx"), "Curvature comb");
  assert.equal(translate("no.such.key", "ja"), "no.such.key");
});
