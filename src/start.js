// Fontra plugin entry point. Fontra imports this module and calls
// start(editor, pluginPath) once the glyph editor has been set up.

import { LAYER_IDENTIFIER, makeCombLayerDefinition } from "./comb-layer.js";
import { PANEL_IDENTIFIER, definePanelElement } from "./panel.js";
import { CombSettings } from "./settings.js";
import { t } from "./strings.js";

export function start(editor, pluginPath) {
  const visualizationLayers = editor.visualizationLayers;
  if (!visualizationLayers?.definitions) {
    console.error("[curvature-comb] editor.visualizationLayers is not available");
    return;
  }

  const settings = new CombSettings();
  const layerDef = makeCombLayerDefinition(
    settings,
    () => editor.fontController?.unitsPerEm
  );
  insertLayerDefinition(visualizationLayers.definitions, layerDef);
  visualizationLayers.toggle(LAYER_IDENTIFIER, settings.get("visible"));

  settings.addListener((key, value) => {
    if (key === "visible") {
      visualizationLayers.toggle(LAYER_IDENTIFIER, value);
    }
    editor.canvasController.requestUpdate();
  });
  editor.canvasController.requestUpdate();

  addPanel(editor, settings, pluginPath);
}

function insertLayerDefinition(definitions, newLayerDef) {
  // Same ordering rule as Fontra's registerVisualizationLayerDefinition()
  const existingIndex = definitions.findIndex(
    (layerDef) => layerDef.identifier === newLayerDef.identifier
  );
  if (existingIndex >= 0) {
    definitions.splice(existingIndex, 1);
  }
  let index = 0;
  for (; index < definitions.length; index++) {
    if (newLayerDef.zIndex < definitions[index].zIndex) {
      break;
    }
  }
  definitions.splice(index, 0, newLayerDef);
}

function addPanel(editor, settings, pluginPath) {
  if (typeof editor.addSidebarPanel !== "function") {
    console.warn("[curvature-comb] sidebar panels are not supported by this Fontra");
    return;
  }
  const PanelElement = definePanelElement();
  const panel = new PanelElement(settings, `${pluginPath}/icon.svg`);
  try {
    editor.addSidebarPanel(panel, "right");
  } catch (e) {
    console.error("[curvature-comb] could not add sidebar panel", e);
    return;
  }
  // Fontra looks up the tab tooltip in its own translation table, which does
  // not know about plugins; set it directly.
  const tab = document.querySelector(
    `.sidebar-tab[data-sidebar-name="${PANEL_IDENTIFIER}"]`
  );
  tab?.setAttribute("title", t("sidebar.tab"));
}
