import {
  combGain,
  intervalCurvatureRatios,
  sampleSegmentComb,
} from "./curvature.js";

export const LAYER_IDENTIFIER = "fontra-plugin.curvature-comb";

// Draw above the glyph fill (zIndex 500 layers) but below node labels (600).
const LAYER_Z_INDEX = 550;

export function makeCombLayerDefinition(settings, getUnitsPerEm) {
  return {
    identifier: LAYER_IDENTIFIER,
    name: "Curvature comb",
    selectionFunc: (visContext, layer) =>
      visContext.glyphsBySelectionMode?.editing || [],
    // Not user switchable through Fontra's own menu: that needs an action
    // registry entry, which plugins cannot reach. Visibility is driven by the
    // plugin's sidebar panel instead.
    userSwitchable: false,
    zIndex: LAYER_Z_INDEX,
    screenParameters: {},
    colors: {
      // Each fill cell between adjacent teeth goes from fillColorLow (no
      // curvature) to fillColorHigh (the strongest curvature in the segment).
      fillColorLow: "hsla(120, 70%, 42%, 0.55)",
      fillColorHigh: "hsla(0, 80%, 50%, 0.55)",
    },
    colorsDarkMode: {
      fillColorLow: "hsla(120, 65%, 50%, 0.6)",
      fillColorHigh: "hsla(0, 85%, 60%, 0.6)",
    },
    draw: ({ context, positionedGlyph, parameters, model }) => {
      drawCombs(
        context,
        positionedGlyph.glyph,
        parameters,
        model,
        settings,
        getUnitsPerEm()
      );
    },
  };
}

export function drawCombs(context, glyph, parameters, model, settings, unitsPerEm) {
  if (!settings.get("visible") || !glyph) {
    return;
  }
  const upm = unitsPerEm > 0 ? unitsPerEm : 1000;
  const gain = combGain(upm, settings.get("scale"));
  const density = settings.get("density");
  const maxLength = upm * 2;

  const paths = [];
  if (glyph.path) {
    let contourFilter = null;
    if (settings.get("selectedContoursOnly")) {
      contourFilter = selectedContourIndices(glyph.path, model?.selection);
    }
    paths.push({ path: glyph.path, contourFilter });
  }
  if (settings.get("includeComponents") && glyph.componentsPath) {
    paths.push({ path: glyph.componentsPath, contourFilter: null });
  }

  const combs = [];
  for (const { path, contourFilter } of paths) {
    for (let contourIndex = 0; contourIndex < path.numContours; contourIndex++) {
      if (contourFilter && !contourFilter.has(contourIndex)) {
        continue;
      }
      for (const segment of iterSegments(path, contourIndex)) {
        if (segment.type !== "quad" && segment.type !== "cubic") {
          continue; // straight lines have zero curvature
        }
        combs.push(
          sampleSegmentComb(segment.type, segment.points, density, gain, maxLength)
        );
      }
    }
  }
  if (!combs.length) {
    return;
  }

  const low = parseHsla(parameters.fillColorLow);
  const high = parseHsla(parameters.fillColorHigh);
  for (const samples of combs) {
    const ratios = intervalCurvatureRatios(samples);
    for (let i = 0; i < ratios.length; i++) {
      const a = samples[i];
      const b = samples[i + 1];
      context.fillStyle = mixHsla(low, high, ratios[i]);
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(a.tipX, a.tipY);
      context.lineTo(b.tipX, b.tipY);
      context.lineTo(b.x, b.y);
      context.closePath();
      context.fill();
    }
  }
}

const HSLA_PATTERN =
  /^hsla?\(\s*([-\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/;

export function parseHsla(color) {
  const match = HSLA_PATTERN.exec(String(color).trim());
  if (!match) {
    throw new Error(`not an hsl()/hsla() color: ${color}`);
  }
  const [, h, s, l, a] = match;
  return { h: Number(h), s: Number(s), l: Number(l), a: a === undefined ? 1 : Number(a) };
}

/**
 * Interpolate two HSLA colors. The hue is interpolated linearly (not along the
 * shortest arc), so green (120) to red (0) passes through yellow.
 */
export function mixHsla(from, to, ratio) {
  const r = Math.min(1, Math.max(0, ratio));
  const mix = (key) => from[key] + (to[key] - from[key]) * r;
  return (
    `hsla(${mix("h").toFixed(1)}, ${mix("s").toFixed(1)}%, ` +
    `${mix("l").toFixed(1)}%, ${mix("a").toFixed(3)})`
  );
}

function* iterSegments(path, contourIndex) {
  if (typeof path.iterContourDecomposedSegments === "function") {
    try {
      yield* path.iterContourDecomposedSegments(contourIndex);
    } catch (e) {
      // A contour that is being drawn can be momentarily malformed
      // (e.g. a dangling off-curve point); skip it rather than break drawing.
    }
  }
}

function selectedContourIndices(path, selection) {
  const result = new Set();
  if (!selection) {
    return result;
  }
  for (const item of selection) {
    const [type, index] = String(item).split("/");
    if (type !== "point") {
      continue;
    }
    const pointIndex = parseInt(index, 10);
    if (
      Number.isInteger(pointIndex) &&
      pointIndex >= 0 &&
      pointIndex < path.numPoints
    ) {
      result.add(path.getContourIndex(pointIndex));
    }
  }
  return result;
}
