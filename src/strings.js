// UI strings. Follow Fontra's display language the same way Fontra does:
// it keeps the language code in localStorage ("fontra-language-language"),
// uses the table for exactly that code, and falls back to English. Terms
// such as "contour", "component" and "reset to default" follow Fontra's own
// translations (src-js/fontra-core/assets/lang/*.js in the Fontra repo).
//
// Fontra's languages without a table here (currently Tagalog) show English.

const LANGUAGE_STORAGE_KEY = "fontra-language-language";
const DEFAULT_LANGUAGE = "en";

export const strings = {
  "en": {
    "sidebar.tab": "Curvature comb",
    "panel.title": "Curvature comb",
    "setting.visible": "Show curvature comb",
    "setting.scale": "Comb length",
    "setting.density": "Samples per segment",
    "setting.selectedContoursOnly": "Selected contours only",
    "setting.includeComponents": "Include components",
    "button.reset": "Reset to default",
    "panel.hint":
      "The comb is drawn on the glyph being edited and follows edits live. " +
      "Double-click a slider to reset it.",
  },
  "zh-CN": {
    "sidebar.tab": "曲率梳",
    "panel.title": "曲率梳",
    "setting.visible": "显示曲率梳",
    "setting.scale": "梳齿长度",
    "setting.density": "每段采样数",
    "setting.selectedContoursOnly": "仅限选中的轮廓",
    "setting.includeComponents": "包括部件",
    "button.reset": "重置为默认",
    "panel.hint": "曲率梳绘制在正在编辑的字形上,并随编辑实时更新。双击滑块可将其重置。",
  },
  "zh-TW": {
    "sidebar.tab": "曲率梳",
    "panel.title": "曲率梳",
    "setting.visible": "顯示曲率梳",
    "setting.scale": "梳齒長度",
    "setting.density": "每段取樣數",
    "setting.selectedContoursOnly": "僅限選取的輪廓",
    "setting.includeComponents": "包含部件",
    "button.reset": "重設成預設值",
    "panel.hint":
      "曲率梳會繪製在正在編輯的字形上,並隨編輯即時更新。按兩下滑桿可將其重設。",
  },
  "ja": {
    "sidebar.tab": "曲率コーム",
    "panel.title": "曲率コーム",
    "setting.visible": "曲率コームを表示",
    "setting.scale": "コームの長さ",
    "setting.density": "セグメントごとの分割数",
    "setting.selectedContoursOnly": "選択しているパスのみ",
    "setting.includeComponents": "コンポーネントも含める",
    "button.reset": "デフォルトにリセット",
    "panel.hint":
      "編集中のグリフにコームを描き、編集に合わせてその場で更新します。" +
      "スライダーをダブルクリックするとデフォルトに戻ります。",
  },
  "de": {
    "sidebar.tab": "Krümmungskamm",
    "panel.title": "Krümmungskamm",
    "setting.visible": "Krümmungskamm anzeigen",
    "setting.scale": "Kammlänge",
    "setting.density": "Messpunkte pro Segment",
    "setting.selectedContoursOnly": "Nur ausgewählte Konturen",
    "setting.includeComponents": "Komponenten einbeziehen",
    "button.reset": "Auf Standardwerte zurücksetzen",
    "panel.hint":
      "Der Kamm wird auf dem bearbeiteten Glyphen gezeichnet und folgt " +
      "Änderungen sofort. Doppelklick auf einen Schieberegler setzt ihn zurück.",
  },
  "nl": {
    "sidebar.tab": "Krommingskam",
    "panel.title": "Krommingskam",
    "setting.visible": "Krommingskam tonen",
    "setting.scale": "Lengte van de kam",
    "setting.density": "Meetpunten per segment",
    "setting.selectedContoursOnly": "Alleen geselecteerde contouren",
    "setting.includeComponents": "Componenten meenemen",
    "button.reset": "Reset naar default",
    "panel.hint":
      "De kam wordt getekend op de glyph die je bewerkt en volgt wijzigingen " +
      "direct. Dubbelklik op een schuifregelaar om hem te resetten.",
  },
  "fr": {
    "sidebar.tab": "Peigne de courbure",
    "panel.title": "Peigne de courbure",
    "setting.visible": "Afficher le peigne de courbure",
    "setting.scale": "Longueur du peigne",
    "setting.density": "Échantillons par segment",
    "setting.selectedContoursOnly": "Contours sélectionnés uniquement",
    "setting.includeComponents": "Inclure les composants",
    "button.reset": "Réinitialiser par défaut",
    "panel.hint":
      "Le peigne est dessiné sur le glyphe en cours d’édition et suit les " +
      "modifications en direct. Double-cliquez sur un curseur pour le réinitialiser.",
  },
  "it": {
    "sidebar.tab": "Pettine di curvatura",
    "panel.title": "Pettine di curvatura",
    "setting.visible": "Mostra pettine di curvatura",
    "setting.scale": "Lunghezza del pettine",
    "setting.density": "Campioni per segmento",
    "setting.selectedContoursOnly": "Solo contorni selezionati",
    "setting.includeComponents": "Includi componenti",
    "button.reset": "Ripristina predefiniti",
    "panel.hint":
      "Il pettine viene disegnato sul glifo in modifica e segue le modifiche " +
      "in tempo reale. Fai doppio clic su un cursore per ripristinarlo.",
  },
  "es-ES": {
    "sidebar.tab": "Peine de curvatura",
    "panel.title": "Peine de curvatura",
    "setting.visible": "Mostrar peine de curvatura",
    "setting.scale": "Longitud del peine",
    "setting.density": "Muestras por segmento",
    "setting.selectedContoursOnly": "Solo contornos seleccionados",
    "setting.includeComponents": "Incluir componentes",
    "button.reset": "Restablecer predeterminados",
    "panel.hint":
      "El peine se dibuja sobre el glifo que se está editando y sigue los " +
      "cambios en tiempo real. Haz doble clic en un control deslizante para " +
      "restablecerlo.",
  },
  "es-419": {
    "sidebar.tab": "Peine de curvatura",
    "panel.title": "Peine de curvatura",
    "setting.visible": "Mostrar peine de curvatura",
    "setting.scale": "Longitud del peine",
    "setting.density": "Muestras por segmento",
    "setting.selectedContoursOnly": "Solo contornos seleccionados",
    "setting.includeComponents": "Incluir componentes",
    "button.reset": "Restablecer predeterminados",
    "panel.hint":
      "El peine se dibuja sobre el glifo que se está editando y sigue los " +
      "cambios en tiempo real. Haz doble clic en un control deslizante para " +
      "restablecerlo.",
  },
  "pt-BR": {
    "sidebar.tab": "Pente de curvatura",
    "panel.title": "Pente de curvatura",
    "setting.visible": "Mostrar pente de curvatura",
    "setting.scale": "Comprimento do pente",
    "setting.density": "Amostras por segmento",
    "setting.selectedContoursOnly": "Somente contornos selecionados",
    "setting.includeComponents": "Incluir componentes",
    "button.reset": "Redefinir para o padrão",
    "panel.hint":
      "O pente é desenhado no glifo em edição e acompanha as alterações em " +
      "tempo real. Clique duas vezes em um controle deslizante para redefini-lo.",
  },
  "pt-PT": {
    "sidebar.tab": "Pente de curvatura",
    "panel.title": "Pente de curvatura",
    "setting.visible": "Mostrar pente de curvatura",
    "setting.scale": "Comprimento do pente",
    "setting.density": "Amostras por segmento",
    "setting.selectedContoursOnly": "Apenas contornos selecionados",
    "setting.includeComponents": "Incluir componentes",
    "button.reset": "Redefinir para o padrão",
    "panel.hint":
      "O pente é desenhado no glifo em edição e acompanha as alterações em " +
      "tempo real. Faça duplo clique num cursor para o redefinir.",
  },
  "ru": {
    "sidebar.tab": "Гребёнка кривизны",
    "panel.title": "Гребёнка кривизны",
    "setting.visible": "Показывать гребёнку кривизны",
    "setting.scale": "Длина гребёнки",
    "setting.density": "Точек на сегмент",
    "setting.selectedContoursOnly": "Только выбранные контуры",
    "setting.includeComponents": "Включать компоненты",
    "button.reset": "Восстановить по умолчанию",
    "panel.hint":
      "Гребёнка рисуется на редактируемом глифе и обновляется по ходу правки. " +
      "Двойной щелчок по ползунку восстанавливает значение по умолчанию.",
  },
};

export function currentLanguage(storage = safeLocalStorage()) {
  try {
    // Fontra stores string settings as raw (non-JSON) strings
    return storage?.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE;
  } catch (e) {
    // localStorage unavailable
    return DEFAULT_LANGUAGE;
  }
}

export function translate(key, language) {
  const table = strings[language] || strings[DEFAULT_LANGUAGE];
  return table[key] ?? strings[DEFAULT_LANGUAGE][key] ?? key;
}

// Fontra reloads the page when its display language changes, so reading the
// setting on each call is enough to stay in sync.
export function t(key) {
  return translate(key, currentLanguage());
}

function safeLocalStorage() {
  try {
    return globalThis.localStorage;
  } catch (e) {
    return undefined;
  }
}
