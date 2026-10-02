// Small observable settings store, persisted to localStorage.

const STORAGE_KEY = "fontra-plugin-curvature-comb.settings";

export const DEFAULT_SETTINGS = Object.freeze({
  visible: true,
  scale: 1, // comb length multiplier
  density: 24, // samples per segment
  selectedContoursOnly: false,
  showTeeth: true,
  showOutline: true,
  showFill: true,
  includeComponents: false,
});

export const SCALE_MIN = 0.05;
export const SCALE_MAX = 20;
export const DENSITY_MIN = 4;
export const DENSITY_MAX = 80;

export class CombSettings {
  constructor(storage = safeLocalStorage()) {
    this._storage = storage;
    this._listeners = new Set();
    this._values = { ...DEFAULT_SETTINGS, ...this._load() };
  }

  get(key) {
    return this._values[key];
  }

  get values() {
    return { ...this._values };
  }

  set(key, value) {
    if (!(key in DEFAULT_SETTINGS)) {
      throw new Error(`unknown setting: ${key}`);
    }
    value = sanitize(key, value);
    if (this._values[key] === value) {
      return;
    }
    this._values[key] = value;
    this._save();
    for (const listener of this._listeners) {
      listener(key, value);
    }
  }

  reset() {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      this.set(key, value);
    }
  }

  addListener(listener) {
    this._listeners.add(listener);
  }

  removeListener(listener) {
    this._listeners.delete(listener);
  }

  _load() {
    try {
      const stored = JSON.parse(this._storage?.getItem(STORAGE_KEY) || "{}");
      const result = {};
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        if (key in stored) {
          result[key] = sanitize(key, stored[key]);
        }
      }
      return result;
    } catch (e) {
      return {};
    }
  }

  _save() {
    try {
      this._storage?.setItem(STORAGE_KEY, JSON.stringify(this._values));
    } catch (e) {
      // Storage may be unavailable (private mode, quota); settings stay in memory.
    }
  }
}

function sanitize(key, value) {
  const defaultValue = DEFAULT_SETTINGS[key];
  if (typeof defaultValue === "boolean") {
    return !!value;
  }
  let number = Number(value);
  if (!Number.isFinite(number)) {
    return defaultValue;
  }
  switch (key) {
    case "scale":
      return Math.min(SCALE_MAX, Math.max(SCALE_MIN, number));
    case "density":
      return Math.round(Math.min(DENSITY_MAX, Math.max(DENSITY_MIN, number)));
  }
  return number;
}

function safeLocalStorage() {
  try {
    return globalThis.localStorage;
  } catch (e) {
    return undefined;
  }
}
