// UI strings. Fontra keeps its UI language in localStorage
// ("fontra-language-language"); follow it, falling back to English.

const strings = {
  en: {
    "sidebar.tab": "Curvature comb",
    "panel.title": "Curvature comb",
    "setting.visible": "Show curvature comb",
    "setting.scale": "Comb length",
    "setting.density": "Samples per segment",
    "setting.selectedContoursOnly": "Selected contours only",
    "setting.includeComponents": "Include components",
    "button.reset": "Reset to defaults",
    "panel.hint":
      "The comb is drawn on the glyph being edited and follows edits live. " +
      "Double-click a slider to reset it.",
  },
  ja: {
    "sidebar.tab": "曲率コーム",
    "panel.title": "曲率コーム",
    "setting.visible": "曲率コームを表示",
    "setting.scale": "コームの長さ",
    "setting.density": "セグメントごとの分割数",
    "setting.selectedContoursOnly": "選択中の輪郭のみ",
    "setting.includeComponents": "コンポーネントも含める",
    "button.reset": "初期値に戻す",
    "panel.hint":
      "編集中のグリフにコームを描き、編集に合わせてその場で更新します。" +
      "スライダーをダブルクリックすると初期値に戻ります。",
  },
};

function currentLanguage() {
  try {
    // Fontra stores string settings as raw (non-JSON) strings
    const stored = localStorage.getItem("fontra-language-language");
    if (stored) {
      return stored;
    }
  } catch (e) {
    // localStorage unavailable
  }
  return "en";
}

export function t(key) {
  const language = currentLanguage();
  const table = strings[language] || strings[language.split("-")[0]] || strings.en;
  return table[key] ?? strings.en[key] ?? key;
}
