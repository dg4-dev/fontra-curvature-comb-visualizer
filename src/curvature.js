// Pure geometry helpers for curvature combs. No Fontra or DOM dependencies,
// so this module can be unit-tested with plain Node.

const EPSILON = 1e-9;

// Small parameter offset used when the first derivative vanishes at a segment
// end point (e.g. an off-curve handle retracted onto its on-curve point).
const DEGENERATE_T_NUDGE = 1e-4;

/**
 * Evaluate position, first and second derivative of a Bézier segment.
 * @param {"line"|"quad"|"cubic"} type
 * @param {{x: number, y: number}[]} pts control points (2, 3 or 4)
 * @param {number} t parameter in [0, 1]
 */
export function evaluateSegment(type, pts, t) {
  const mt = 1 - t;
  switch (type) {
    case "cubic": {
      const [p0, p1, p2, p3] = pts;
      const a = mt * mt * mt;
      const b = 3 * mt * mt * t;
      const c = 3 * mt * t * t;
      const d = t * t * t;
      return {
        x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
        y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
        dx:
          3 *
          (mt * mt * (p1.x - p0.x) +
            2 * mt * t * (p2.x - p1.x) +
            t * t * (p3.x - p2.x)),
        dy:
          3 *
          (mt * mt * (p1.y - p0.y) +
            2 * mt * t * (p2.y - p1.y) +
            t * t * (p3.y - p2.y)),
        ddx: 6 * (mt * (p2.x - 2 * p1.x + p0.x) + t * (p3.x - 2 * p2.x + p1.x)),
        ddy: 6 * (mt * (p2.y - 2 * p1.y + p0.y) + t * (p3.y - 2 * p2.y + p1.y)),
      };
    }
    case "quad": {
      const [p0, p1, p2] = pts;
      return {
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
        dx: 2 * (mt * (p1.x - p0.x) + t * (p2.x - p1.x)),
        dy: 2 * (mt * (p1.y - p0.y) + t * (p2.y - p1.y)),
        ddx: 2 * (p2.x - 2 * p1.x + p0.x),
        ddy: 2 * (p2.y - 2 * p1.y + p0.y),
      };
    }
    case "line": {
      const [p0, p1] = pts;
      return {
        x: mt * p0.x + t * p1.x,
        y: mt * p0.y + t * p1.y,
        dx: p1.x - p0.x,
        dy: p1.y - p0.y,
        ddx: 0,
        ddy: 0,
      };
    }
    default:
      throw new Error(`unknown segment type: ${type}`);
  }
}

/**
 * Signed curvature of a parametric curve from its derivatives.
 * Positive means the curve turns left (counter-clockwise).
 * Returns NaN when the first derivative vanishes.
 */
export function signedCurvature({ dx, dy, ddx, ddy }) {
  const speedSquared = dx * dx + dy * dy;
  if (speedSquared < EPSILON) {
    return NaN;
  }
  return (dx * ddy - dy * ddx) / (speedSquared * Math.sqrt(speedSquared));
}

/**
 * Sample a segment for drawing a curvature comb.
 *
 * Each sample holds the on-curve position (x, y), the signed curvature (k) and
 * the comb tip (tipX, tipY). The tip is placed on the side opposite to the
 * centre of curvature, at distance |k| * gain, so the comb stands outside of
 * convex arcs and flips side at inflections.
 *
 * @param {"line"|"quad"|"cubic"} type
 * @param {{x: number, y: number}[]} pts
 * @param {number} numSamples number of intervals; numSamples + 1 samples are returned
 * @param {number} gain comb length per unit of curvature (font units squared)
 * @param {number} maxLength clamp for the comb length (font units)
 */
export function sampleSegmentComb(type, pts, numSamples, gain, maxLength = Infinity) {
  const samples = [];
  const n = Math.max(1, Math.round(numSamples));
  for (let i = 0; i <= n; i++) {
    let t = i / n;
    let d = evaluateSegment(type, pts, t);
    let k = signedCurvature(d);
    if (Number.isNaN(k)) {
      // Degenerate derivative (retracted handle). Use the limit by evaluating
      // the curvature slightly inside the segment, but keep the exact position.
      const tInner =
        i === 0 ? DEGENERATE_T_NUDGE : i === n ? 1 - DEGENERATE_T_NUDGE : t;
      const dInner = evaluateSegment(type, pts, tInner);
      k = signedCurvature(dInner);
      if (Number.isNaN(k)) {
        // Fully degenerate segment (all points coincide): nothing to show.
        k = 0;
      }
      d = { ...dInner, x: d.x, y: d.y };
    }
    const speed = Math.hypot(d.dx, d.dy);
    let length = k * gain;
    if (length > maxLength) {
      length = maxLength;
    } else if (length < -maxLength) {
      length = -maxLength;
    }
    // Left normal is (-dy, dx) / speed and points toward the centre of
    // curvature when k > 0; move the tip the other way.
    const nx = speed > EPSILON ? -d.dy / speed : 0;
    const ny = speed > EPSILON ? d.dx / speed : 0;
    samples.push({
      t,
      x: d.x,
      y: d.y,
      k,
      tipX: d.x - nx * length,
      tipY: d.y - ny * length,
    });
  }
  return samples;
}

/**
 * Comb length per unit of curvature, so that the visual size scales with the
 * font's units-per-em. With scale = 1 and UPM = 1000, a circular arc with a
 * radius of 100 units gets a 50-unit comb.
 */
export function combGain(unitsPerEm, scale) {
  return unitsPerEm * unitsPerEm * 0.005 * scale;
}

/**
 * Largest |k| among the given comb samples.
 */
export function maxAbsCurvature(samples) {
  let maxK = 0;
  for (const s of samples) {
    maxK = Math.max(maxK, Math.abs(s.k));
  }
  return maxK;
}

/**
 * Curvature strength of each interval between adjacent comb samples, relative
 * to a reference curvature (by default the strongest one in the samples).
 *
 * Returns one value per interval (samples.length - 1), in [0, 1]: the mean |k|
 * of the interval's two samples divided by maxK. A zero maxK yields zeros.
 */
export function intervalCurvatureRatios(samples, maxK = maxAbsCurvature(samples)) {
  const ratios = [];
  for (let i = 0; i < samples.length - 1; i++) {
    if (maxK < EPSILON) {
      ratios.push(0);
      continue;
    }
    const meanK = (Math.abs(samples[i].k) + Math.abs(samples[i + 1].k)) / 2;
    ratios.push(Math.min(1, meanK / maxK));
  }
  return ratios;
}
