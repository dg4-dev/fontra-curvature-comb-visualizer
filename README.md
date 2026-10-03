# Fontra Curvature Comb Visualizer

A [Fontra](https://github.com/fontra/fontra) plugin that draws live **curvature combs** on the glyph being edited, similar to Glyphs 3 / 4.

- Draws combs on the contours (quadratic and cubic Bézier curves) of the glyph being edited
- The comb follows along while you drag points and handles
- The comb points away from the center of curvature (outside the convex side) and switches sides at inflection points. Places where the curvature does not join smoothly (G2 discontinuities) show up as steps in the comb
- The comb is drawn as a band filled between its teeth. Within each contour (connected path), the band is gray where the curvature is weakest and red where it is strongest, passing through yellow in between
- Supports light and dark themes
- The UI follows Fontra's display language (Application settings → Display Language). Like Fontra itself, it shows English when there is no translation for that language

## Installation

In Fontra, open **Application settings → Plugin Manager**, press "+" and enter the plugin address.

### From GitHub

```plaintext
dg4-dev/fontra-curvature-comb-visualizer
```

Fontra loads `owner/repo` addresses through jsDelivr (`https://cdn.jsdelivr.net/gh/<owner>/<repo>@latest`), so the repository must be public. `@latest` points to the newest release tag, or to the default branch (`main`) when there are no tags.

To try a development branch, enter a URL with the branch name.

```plaintext
https://cdn.jsdelivr.net/gh/dg4-dev/fontra-curvature-comb-visualizer@develop
```

jsDelivr caches branch contents for a while, so updates may not show up right away.

### From a local copy (for development)

Serve your working copy with CORS headers and register its URL as the plugin address. Your edits are picked up each time you reopen the editor.

```plaintext
npx http-server /path/to/fontra-curvature-comb-visualizer -p 8123 --cors -c-1
```

```plaintext
http://localhost:8123
```

After registering, reopen the glyph editor to load the plugin.

## Usage

A curvature comb tab (arch-shaped icon) is added to the right sidebar of the glyph editor.

| Setting | Description |
| --- | --- |
| Show curvature comb | Shows or hides the comb |
| Comb length | Length multiplier for the comb (×0.05–×20, logarithmic). At UPM 1000, an arc with radius 100 gets a comb of length 50 at ×1 |
| Samples per segment | Number of teeth per segment (4–80) |
| Selected contours only | Draws the comb only on contours with selected points |
| Include components | Also draws the comb on component contours |

Double-click a slider to reset it to its default value. Settings are saved in the browser's localStorage.

### Display language

The plugin reads the display language that Fontra stores in localStorage (`fontra-language-language`) and uses the translation for that language code. Languages without a translation show English. Fontra reloads the page when its display language changes, and the plugin switches language at the same time.

| Language | Translated |
| --- | --- |
| English, 简体中文, 繁體中文, 日本語, Deutsch, Nederlands, Français, Italiano, Español (España), Español (Latinoamérica), Português (Brasil), Português (Portugal), Русский | Yes |
| Tagalog | No (shown in English) |

Terms that also appear in Fontra, such as "contour", "component" and "reset to default", follow Fontra's own translations.

## How it works

For each segment `B(t)`, the signed curvature

```plaintext
κ = (x′·y″ − y′·x″) / (x′² + y′²)^(3/2)
```

is computed at evenly spaced values of the parameter `t`, and each tooth tip is placed `κ × length factor` away from the curve along the normal. For each quad between two adjacent teeth, the mean `|κ|` of the two teeth is taken; within the contour, the smallest of these values maps to 0 and the largest to 1, and the quad is filled gray → yellow → red by that position (yellow at 0.5). A contour with nearly constant curvature is drawn all gray. Straight segments have zero curvature and are not drawn. At end points where a handle sits on its node and `B′(t) = 0`, the curvature is taken at a position slightly inside the segment.

Splitting contours into segments (including TrueType runs of consecutive off-curve points) is left to Fontra's `VarPackedPath.iterContourDecomposedSegments()`.

## Limitations

- The comb does not appear in Fontra's "View → Glyph editor appearance" menu. Items in that menu need an internal Fontra action registration that plugins cannot make. Use the sidebar panel to toggle the comb instead.
- The plugin relies on internal APIs of Fontra's editor (`editor.visualizationLayers`, `editor.addSidebarPanel()` and others). Changes in Fontra may break it.

## Development

```plaintext
src/
  start.js       Entry point (init / function in plugin.json)
  comb-layer.js  Fontra visualization layer definition and drawing
  curvature.js   Curvature and comb calculations (no Fontra or DOM dependencies)
  panel.js       Sidebar panel
  settings.js    Settings store, saved to localStorage
  strings.js     UI strings for each of Fontra's display languages
test/            Unit tests with node:test
```

Run the tests (Node.js 22 or later, no dependencies):

```plaintext
npm test
```

### Branching

The repository follows git-flow.

- `main`: released code. jsDelivr's `@latest` loads this branch when there are no tags
- `develop`: integration branch for the next release
- `feature/*`: one branch per feature, branched from `develop` and merged back into `develop`
- `release/*`: release preparation, branched from `develop`, merged into both `main` and `develop`, with a tag on `main`

## License

[GNU General Public License v3.0](LICENSE) (GPL-3.0), the same license as Fontra.
