import assert from "node:assert/strict";
import { test } from "node:test";
import {
  combGain,
  evaluateSegment,
  intervalCurvatureRatios,
  sampleSegmentComb,
  signedCurvature,
} from "../src/curvature.js";

const near = (a, b, tolerance = 1e-6) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${a} is not within ${tolerance} of ${b}`);

// Standard cubic approximation of a quarter circle (radius r, centred at origin,
// counter-clockwise from (r, 0) to (0, r)).
const KAPPA = 0.5522847498;
function quarterCircle(r) {
  return [
    { x: r, y: 0 },
    { x: r, y: r * KAPPA },
    { x: r * KAPPA, y: r },
    { x: 0, y: r },
  ];
}

test("straight line has zero curvature", () => {
  const d = evaluateSegment(
    "line",
    [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
    ],
    0.3
  );
  assert.equal(signedCurvature(d), 0);
});

test("cubic quarter circle has curvature close to 1/r", () => {
  const r = 250;
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const k = signedCurvature(evaluateSegment("cubic", quarterCircle(r), t));
    // curvature of the cubic approximation deviates up to ~2.2% at the ends
    near(k, 1 / r, (1 / r) * 0.03);
  }
});

test("curvature sign follows turning direction", () => {
  const ccw = quarterCircle(100);
  const cw = [...ccw].reverse();
  assert.ok(signedCurvature(evaluateSegment("cubic", ccw, 0.5)) > 0);
  assert.ok(signedCurvature(evaluateSegment("cubic", cw, 0.5)) < 0);
});

test("quadratic parabola curvature at vertex", () => {
  // y = x^2 / 100 between x = -100 and 100: control point (0, -100)
  const pts = [
    { x: -100, y: 100 },
    { x: 0, y: -100 },
    { x: 100, y: 100 },
  ];
  const d = evaluateSegment("quad", pts, 0.5);
  near(d.x, 0);
  near(d.y, 0);
  near(signedCurvature(d), 2 / 100); // y'' / (1 + y'^2)^1.5 at x = 0
});

test("comb tips point away from the centre of curvature", () => {
  const r = 100;
  const gain = 1000;
  const samples = sampleSegmentComb("cubic", quarterCircle(r), 8, gain);
  assert.equal(samples.length, 9);
  for (const s of samples) {
    const onCurveRadius = Math.hypot(s.x, s.y);
    const tipRadius = Math.hypot(s.tipX, s.tipY);
    // comb length is k * gain ≈ gain / r = 10 units, outward
    near(tipRadius - onCurveRadius, gain / r, (gain / r) * 0.03);
  }
  // Same for the reversed (clockwise) contour: still outside of the arc
  const reversed = sampleSegmentComb("cubic", [...quarterCircle(r)].reverse(), 8, gain);
  for (const s of reversed) {
    assert.ok(Math.hypot(s.tipX, s.tipY) > Math.hypot(s.x, s.y));
  }
});

test("comb flips side at an inflection", () => {
  // S-curve: inflection at t = 0.5
  const pts = [
    { x: 0, y: 0 },
    { x: 100, y: 100 },
    { x: 200, y: -100 },
    { x: 300, y: 0 },
  ];
  const samples = sampleSegmentComb("cubic", pts, 10, 1e5);
  assert.ok(samples[2].k * samples[8].k < 0);
  near(samples[5].k, 0, 1e-9);
  near(samples[5].tipX, samples[5].x);
  near(samples[5].tipY, samples[5].y);
});

test("retracted handle does not produce NaN", () => {
  const pts = [
    { x: 0, y: 0 },
    { x: 0, y: 0 }, // handle on top of its node
    { x: 100, y: 100 },
    { x: 200, y: 100 },
  ];
  const samples = sampleSegmentComb("cubic", pts, 16, 5000, 2000);
  for (const s of samples) {
    for (const value of [s.x, s.y, s.k, s.tipX, s.tipY]) {
      assert.ok(Number.isFinite(value), `non-finite value at t=${s.t}`);
    }
  }
  near(samples[0].x, 0);
  near(samples[0].y, 0);
});

test("fully degenerate segment yields zero-length teeth", () => {
  const p = { x: 5, y: 5 };
  const samples = sampleSegmentComb("cubic", [p, p, p, p], 4, 1000);
  for (const s of samples) {
    assert.equal(s.k, 0);
    assert.equal(s.tipX, 5);
    assert.equal(s.tipY, 5);
  }
});

test("comb length is clamped", () => {
  const samples = sampleSegmentComb("cubic", quarterCircle(1), 4, 1e6, 50);
  for (const s of samples) {
    near(Math.hypot(s.tipX - s.x, s.tipY - s.y), 50, 1e-6);
  }
});

test("combGain scales with UPM squared", () => {
  near(combGain(1000, 1) / 100, 50); // r = 100 at 1000 UPM -> 50 units
  near(combGain(2000, 1), 4 * combGain(1000, 1));
  near(combGain(1000, 2), 2 * combGain(1000, 1));
});

test("interval ratios are relative to the strongest curvature in the segment", () => {
  const ratios = intervalCurvatureRatios([{ k: 0 }, { k: -2 }, { k: 4 }, { k: 4 }]);
  assert.deepEqual(ratios, [0.25, 0.75, 1]);
});

test("interval ratios of a straight segment are zero", () => {
  assert.deepEqual(intervalCurvatureRatios([{ k: 0 }, { k: 0 }, { k: 0 }]), [0, 0]);
});

test("interval ratios of a circular arc are all one", () => {
  const samples = sampleSegmentComb("cubic", quarterCircle(100), 12, 1);
  const ratios = intervalCurvatureRatios(samples);
  assert.equal(ratios.length, 12);
  for (const r of ratios) {
    // The cubic approximation of a circle is not exactly constant-curvature.
    assert.ok(r > 0.97 && r <= 1, `${r}`);
  }
});
