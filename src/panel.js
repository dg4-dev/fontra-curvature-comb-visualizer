import { DENSITY_MAX, DENSITY_MIN, SCALE_MAX, SCALE_MIN } from "./settings.js";
import { t } from "./strings.js";

export const PANEL_IDENTIFIER = "curvature-comb";
const ELEMENT_NAME = "fontra-curvature-comb-panel";

const styles = `
  :host {
    display: block;
    height: 100%;
    overflow: hidden auto;
    color: var(--ui-element-foreground-color, inherit);
    font-family: fontra-ui-regular, sans-serif;
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.9em;
    padding: 1em;
  }
  .title {
    font-weight: bold;
  }
  .row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.4em;
    align-items: center;
  }
  .slider-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.3em 0.6em;
    align-items: center;
  }
  .slider-row label {
    grid-column: 1 / span 2;
  }
  .slider-row output {
    min-width: 3.5em;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  input[type="range"] {
    width: 100%;
    margin: 0;
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 0.4em;
  }
  hr {
    width: 100%;
    border: none;
    border-top: 1px solid var(--horizontal-rule-color, #8884);
    margin: 0;
  }
  button {
    justify-self: start;
    align-self: flex-start;
    padding: 0.3em 0.9em;
    border-radius: 0.4em;
    border: none;
    background-color: var(--text-input-background-color, #eee);
    color: var(--text-input-foreground-color, inherit);
    font: inherit;
    cursor: pointer;
  }
  .hint {
    opacity: 0.7;
    font-size: 0.9em;
    line-height: 1.4;
  }
`;

// The slider works on a log scale so both very small and very large combs
// are reachable with reasonable precision.
const SCALE_STEPS = 1000;
const LOG_MIN = Math.log(SCALE_MIN);
const LOG_MAX = Math.log(SCALE_MAX);

function scaleToSlider(scale) {
  return Math.round(((Math.log(scale) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * SCALE_STEPS);
}

function sliderToScale(value) {
  const scale = Math.exp(LOG_MIN + (value / SCALE_STEPS) * (LOG_MAX - LOG_MIN));
  // Snap close to 1 so the default is easy to get back to
  return Math.abs(scale - 1) < 0.02 ? 1 : Number(scale.toPrecision(3));
}

export function definePanelElement() {
  const existing = customElements.get(ELEMENT_NAME);
  if (existing) {
    return existing;
  }

  class CurvatureCombPanel extends HTMLElement {
    constructor(settings, iconPath) {
      super();
      this.identifier = PANEL_IDENTIFIER;
      this.iconPath = iconPath;
      this.settings = settings;
      this.attachShadow({ mode: "open" });
      this._render();
      this._onSettingChanged = () => this._syncFromSettings();
      settings.addListener(this._onSettingChanged);
    }

    // Called by Fontra when the sidebar tab is opened/closed
    async toggle(on, focus) {}

    _render() {
      const root = this.shadowRoot;
      root.innerHTML = "";
      const style = document.createElement("style");
      style.textContent = styles;
      root.appendChild(style);

      const panel = el("div", { class: "panel" });
      panel.append(
        el("div", { class: "title" }, t("panel.title")),
        this._checkbox("visible", t("setting.visible")),
        el("hr"),
        this._slider({
          key: "scale",
          label: t("setting.scale"),
          min: 0,
          max: SCALE_STEPS,
          step: 1,
          toSlider: scaleToSlider,
          fromSlider: sliderToScale,
          format: (v) => `×${v}`,
        }),
        this._slider({
          key: "density",
          label: t("setting.density"),
          min: DENSITY_MIN,
          max: DENSITY_MAX,
          step: 1,
          toSlider: (v) => v,
          fromSlider: (v) => Number(v),
          format: (v) => `${v}`,
        }),
        el("hr"),
        el(
          "div",
          { class: "group" },
          this._checkbox("showTeeth", t("setting.showTeeth")),
          this._checkbox("showOutline", t("setting.showOutline")),
          this._checkbox("showFill", t("setting.showFill"))
        ),
        el("hr"),
        el(
          "div",
          { class: "group" },
          this._checkbox("selectedContoursOnly", t("setting.selectedContoursOnly")),
          this._checkbox("includeComponents", t("setting.includeComponents"))
        ),
        el("hr"),
        el(
          "button",
          { type: "button", onclick: () => this.settings.reset() },
          t("button.reset")
        ),
        el("div", { class: "hint" }, t("panel.hint"))
      );
      root.appendChild(panel);
      this._syncFromSettings();
    }

    _checkbox(key, label) {
      const id = `ccomb-${key}`;
      const input = el("input", {
        "type": "checkbox",
        id,
        "data-key": key,
        "onchange": (event) => this.settings.set(key, event.target.checked),
      });
      return el("div", { class: "row" }, input, el("label", { for: id }, label));
    }

    _slider({ key, label, min, max, step, toSlider, fromSlider, format }) {
      const id = `ccomb-${key}`;
      const output = el("output", { for: id });
      const input = el("input", {
        "type": "range",
        id,
        min,
        max,
        step,
        "data-key": key,
        "oninput": (event) => this.settings.set(key, fromSlider(event.target.value)),
        "ondblclick": () => this.settings.set(key, undefined),
      });
      input._toSlider = toSlider;
      input._format = format;
      input._output = output;
      return el(
        "div",
        { class: "slider-row" },
        el("label", { for: id }, label),
        input,
        output
      );
    }

    _syncFromSettings() {
      for (const input of this.shadowRoot.querySelectorAll("input[data-key]")) {
        const value = this.settings.get(input.dataset.key);
        if (input.type === "checkbox") {
          input.checked = !!value;
        } else {
          const sliderValue = String(input._toSlider(value));
          if (input.value !== sliderValue) {
            input.value = sliderValue;
          }
          input._output.textContent = input._format(value);
        }
      }
    }
  }

  customElements.define(ELEMENT_NAME, CurvatureCombPanel);
  return CurvatureCombPanel;
}

function el(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2), value);
    } else {
      element.setAttribute(key, value);
    }
  }
  element.append(...children);
  return element;
}
