import assert from "node:assert/strict";
import { test } from "node:test";
import { drawCombs, gradientHsla, mixHsla, parseHsla } from "../src/comb-layer.js";

test("parseHsla reads hsl() and hsla()", () => {
  assert.deepEqual(parseHsla("hsla(120, 70%, 42%, 0.3)"), { h: 120, s: 70, l: 42, a: 0.3 });
  assert.deepEqual(parseHsla("hsl(0,80%,50%)"), { h: 0, s: 80, l: 50, a: 1 });
  assert.throws(() => parseHsla("red"));
});

test("mixHsla interpolates each component linearly", () => {
  const green = parseHsla("hsla(120, 70%, 40%, 0.3)");
  const red = parseHsla("hsla(0, 80%, 50%, 0.5)");
  assert.equal(mixHsla(green, red, 0), "hsla(120.0, 70.0%, 40.0%, 0.300)");
  assert.equal(mixHsla(green, red, 0.5), "hsla(60.0, 75.0%, 45.0%, 0.400)");
  assert.equal(mixHsla(green, red, 1), "hsla(0.0, 80.0%, 50.0%, 0.500)");
  assert.equal(mixHsla(green, red, 2), mixHsla(green, red, 1));
});

test("gradientHsla goes from gray to red through yellow", () => {
  const stops = [
    parseHsla("hsla(50, 0%, 60%, 0.5)"),
    parseHsla("hsla(50, 100%, 50%, 0.5)"),
    parseHsla("hsla(0, 80%, 50%, 0.5)"),
  ];
  assert.equal(gradientHsla(stops, 0), "hsla(50.0, 0.0%, 60.0%, 0.500)");
  assert.equal(gradientHsla(stops, 0.25), "hsla(50.0, 50.0%, 55.0%, 0.500)");
  assert.equal(gradientHsla(stops, 0.5), "hsla(50.0, 100.0%, 50.0%, 0.500)");
  assert.equal(gradientHsla(stops, 0.75), "hsla(25.0, 90.0%, 50.0%, 0.500)");
  assert.equal(gradientHsla(stops, 1), "hsla(0.0, 80.0%, 50.0%, 0.500)");
  assert.equal(gradientHsla(stops, -1), gradientHsla(stops, 0));
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
    fillColorLow: "hsla(50, 0%, 62%, 0.3)",
    fillColorMid: "hsla(50, 95%, 50%, 0.3)",
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

function contoursGlyph(contours) {
  return {
    path: {
      numContours: contours.length,
      numPoints: 0,
      *iterContourDecomposedSegments(contourIndex) {
        yield* contours[contourIndex];
      },
    },
  };
}

// Circular arcs: constant curvature 1 / r.
function arc(r, dx = 0) {
  const kappa = 0.5522847498;
  return {
    type: "cubic",
    points: [
      { x: dx + r, y: 0 },
      { x: dx + r, y: r * kappa },
      { x: dx + r * kappa, y: r },
      { x: dx, y: r },
    ],
  };
}

const gradientParameters = {
  fillColorLow: "hsla(50, 0%, 60%, 0.5)",
  fillColorMid: "hsla(50, 100%, 50%, 0.5)",
  fillColorHigh: "hsla(0, 80%, 50%, 0.5)",
};

test("colors are relative to the strongest curvature in the contour", () => {
  // One contour: a tight arc (r = 100) and a loose one (r = 400).
  const glyph = contoursGlyph([[arc(100), arc(400, 1000)]]);
  const settings = fakeSettings({ visible: true, scale: 1, density: 4 });
  const { context, fills } = recordingContext();
  drawCombs(context, glyph, gradientParameters, null, settings, 1000);

  assert.equal(fills.length, 8);
  const tight = fills.slice(0, 4).map(parseHsla);
  const loose = fills.slice(4).map(parseHsla);
  for (const c of tight) {
    assert.ok(c.h < 3, `tight arc should be red: ${c.h}`);
  }
  for (const c of loose) {
    // |k| ratio is about 1/4: halfway from gray to yellow.
    assert.ok(Math.abs(c.h - 50) < 1e-9 && c.s > 40 && c.s < 60, `${JSON.stringify(c)}`);
  }
});

test("each contour is colored on its own scale", () => {
  const glyph = contoursGlyph([[arc(100)], [arc(400, 1000)]]);
  const settings = fakeSettings({ visible: true, scale: 1, density: 4 });
  const { context, fills } = recordingContext();
  drawCombs(context, glyph, gradientParameters, null, settings, 1000);

  assert.equal(fills.length, 8);
  for (const c of fills.map(parseHsla)) {
    assert.ok(c.h < 3, `both arcs are their contour's strongest: ${c.h}`);
  }
});
