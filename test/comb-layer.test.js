import assert from "node:assert/strict";
import { test } from "node:test";
import { drawCombs, mixHsla, parseHsla } from "../src/comb-layer.js";

test("parseHsla reads hsl() and hsla()", () => {
  assert.deepEqual(parseHsla("hsla(120, 70%, 42%, 0.3)"), { h: 120, s: 70, l: 42, a: 0.3 });
  assert.deepEqual(parseHsla("hsl(0,80%,50%)"), { h: 0, s: 80, l: 50, a: 1 });
  assert.throws(() => parseHsla("red"));
});

test("mixHsla goes from green to red through yellow", () => {
  const green = parseHsla("hsla(120, 70%, 40%, 0.3)");
  const red = parseHsla("hsla(0, 80%, 50%, 0.5)");
  assert.equal(mixHsla(green, red, 0), "hsla(120.0, 70.0%, 40.0%, 0.300)");
  assert.equal(mixHsla(green, red, 0.5), "hsla(60.0, 75.0%, 45.0%, 0.400)");
  assert.equal(mixHsla(green, red, 1), "hsla(0.0, 80.0%, 50.0%, 0.500)");
  assert.equal(mixHsla(green, red, 2), mixHsla(green, red, 1));
});

function recordingContext() {
  const fills = [];
  const context = {
    fillStyle: null,
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    stroke() {},
    fill() {
      fills.push(this.fillStyle);
    },
  };
  return { context, fills };
}

function fakeSettings(values) {
  return { get: (key) => values[key] };
}

test("fill is drawn per interval, colored by curvature ratio", () => {
  // A cubic whose curvature grows towards its end.
  const segment = {
    type: "cubic",
    points: [
      { x: 0, y: 0 },
      { x: 300, y: 0 },
      { x: 400, y: 50 },
      { x: 400, y: 150 },
    ],
  };
  const glyph = {
    path: {
      numContours: 1,
      numPoints: 4,
      *iterContourDecomposedSegments() {
        yield segment;
      },
    },
  };
  const settings = fakeSettings({
    visible: true,
    scale: 1,
    density: 8,
    selectedContoursOnly: false,
    includeComponents: false,
  });
  const parameters = {
    fillColorLow: "hsla(120, 70%, 42%, 0.3)",
    fillColorHigh: "hsla(0, 80%, 50%, 0.3)",
  };
  const { context, fills } = recordingContext();
  drawCombs(context, glyph, parameters, null, settings, 1000);

  assert.equal(fills.length, 8);
  const hues = fills.map((color) => parseHsla(color).h);
  assert.ok(hues[0] > hues[hues.length - 1], `hues should fall: ${hues}`);
  // The strongest interval touches the maximum, so it is close to red.
  assert.ok(Math.min(...hues) < 15, `${hues}`);
});
