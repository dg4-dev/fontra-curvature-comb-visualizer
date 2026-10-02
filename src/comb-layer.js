import { combGain, sampleSegmentComb } from "./curvature.js";

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
    screenParameters: { strokeWidth: 1, outlineWidth: 1.5 },
    colors: {
      toothColor: "rgba(214, 64, 159, 0.55)",
      outlineColor: "rgba(214, 64, 159, 0.9)",
      fillColor: "rgba(214, 64, 159, 0.12)",
    },
    colorsDarkMode: {
      toothColor: "rgba(255, 120, 200, 0.55)",
      outlineColor: "rgba(255, 120, 200, 0.9)",
      fillColor: "rgba(255, 120, 200, 0.14)",
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

  context.lineJoin = "round";
  context.lineCap = "round";

  if (settings.get("showFill")) {
    context.fillStyle = parameters.fillColor;
    for (const samples of combs) {
      context.beginPath();
      context.moveTo(samples[0].x, samples[0].y);
      for (const s of samples) {
        context.lineTo(s.tipX, s.tipY);
      }
      for (let i = samples.length - 1; i >= 0; i--) {
        context.lineTo(samples[i].x, samples[i].y);
      }
      context.closePath();
      context.fill();
    }
  }

  if (settings.get("showTeeth")) {
    context.strokeStyle = parameters.toothColor;
    context.lineWidth = parameters.strokeWidth;
    context.beginPath();
    for (const samples of combs) {
      for (const s of samples) {
        context.moveTo(s.x, s.y);
        context.lineTo(s.tipX, s.tipY);
      }
    }
    context.stroke();
  }

  if (settings.get("showOutline")) {
    context.strokeStyle = parameters.outlineColor;
    context.lineWidth = parameters.outlineWidth;
    context.beginPath();
    for (const samples of combs) {
      context.moveTo(samples[0].tipX, samples[0].tipY);
      for (let i = 1; i < samples.length; i++) {
        context.lineTo(samples[i].tipX, samples[i].tipY);
      }
    }
    context.stroke();
  }
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
