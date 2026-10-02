# Fontra Curvature Comb Visualizer

[Fontra](https://github.com/fontra/fontra) のグリフ編集画面に、Glyphs 3 / 4 のような**曲率コーム(curvature comb)**をリアルタイムで重ねて表示するプラグインです。

A Fontra plugin that draws live curvature combs on the glyph being edited, similar to Glyphs 3 / 4.

- 編集中のグリフの輪郭(2次・3次ベジェ曲線)にコームを描きます
- 点やハンドルをドラッグしている最中も、コームが追従して更新されます
- コームは曲率の中心と反対側(凸側の外)に伸び、変曲点で反対側へ移ります。曲率がなめらかにつながっていない箇所(G2 不連続)は、コームの段差として見えます
- ライト/ダークテーマに対応します
- UI は Fontra の表示言語に合わせて日本語/英語で表示します

## インストール

Fontra の **Application settings → Plugins** で「+」を押し、プラグインのアドレスを入力します。

### GitHub から

```plaintext
dg4-dev/fontra-curvature-comb-visualizer
```

`owner/repo` 形式のアドレスは、Fontra が jsDelivr 経由(`https://cdn.jsdelivr.net/gh/<owner>/<repo>@latest`)で読み込みます(リポジトリが公開されている必要があります)。`@latest` はタグがあれば最新のリリースタグ、なければ既定のブランチ(`main`)を指します。

開発中のブランチを試すときは、ブランチ名を付けた URL を入力します。

```plaintext
https://cdn.jsdelivr.net/gh/dg4-dev/fontra-curvature-comb-visualizer@develop
```

jsDelivr はブランチの内容をしばらくキャッシュするので、更新がすぐに反映されないことがあります。

### ローカルから(開発用)

手元の作業コピーを CORS ヘッダー付きで配信し、その URL をプラグインのアドレスとして登録します。編集した内容が、エディターを開き直すたびに反映されます。

```plaintext
npx http-server /path/to/fontra-curvature-comb-visualizer -p 8123 --cors -c-1
```

```plaintext
http://localhost:8123
```

登録後、グリフ編集画面を開き直すと読み込まれます。

## 使い方

グリフ編集画面の右サイドバーに、曲率コームのタブ(アーチ形のアイコン)が加わります。

| 設定 | 内容 |
| --- | --- |
| 曲率コームを表示 | 表示/非表示を切り替えます |
| コームの長さ | コームの長さの倍率です(×0.05〜×20、対数目盛)。UPM 1000 で半径 100 の円弧が、×1 のとき長さ 50 になります |
| セグメントごとの分割数 | 1 セグメントあたりの歯の本数です(4〜80) |
| 歯(垂線)/外形線/塗り | コームの描き方を個別に切り替えます |
| 選択中の輪郭のみ | 点を選んでいる輪郭だけにコームを描きます |
| コンポーネントも含める | コンポーネントの輪郭にもコームを描きます |

スライダーはダブルクリックで初期値に戻ります。設定はブラウザの localStorage に保存されます。

## しくみ

各セグメント `B(t)` について、パラメーター `t` を等間隔に区切った点で符号付き曲率

```plaintext
κ = (x′·y″ − y′·x″) / (x′² + y′²)^(3/2)
```

を求め、曲線上の点から法線方向に `κ × 長さ係数` だけ離れた位置に歯の先端を置きます。直線セグメントは曲率が 0 なので描きません。ハンドルがノードに重なっていて `B′(t) = 0` になる端点では、わずかに内側の位置で曲率を求めます。

輪郭の分解(TrueType の連続したオフカーブ点の扱いなど)は、Fontra 本体の `VarPackedPath.iterContourDecomposedSegments()` に任せています。

## 制約

- Fontra の「表示 → グリフエディターの外観」メニューには出ません。このメニューの項目は Fontra 内部の action 登録が必要で、プラグインからは登録できないためです。表示の切り替えはサイドバーのパネルで行います。
- プラグインは Fontra のエディター内部の API(`editor.visualizationLayers`、`editor.addSidebarPanel()` など)に依存します。Fontra 側の変更で動かなくなる可能性があります。

## 開発

```plaintext
src/
  start.js       エントリーポイント(plugin.json の init / function)
  comb-layer.js  Fontra の描画レイヤー定義と描画処理
  curvature.js   曲率とコームの計算(Fontra や DOM に依存しない)
  panel.js       サイドバーのパネル
  settings.js    設定の保持と localStorage への保存
  strings.js     UI の文言(英語/日本語)
test/            node:test による単体テスト
```

テストの実行(Node.js 22 以上、依存パッケージなし):

```plaintext
npm test
```

### ブランチ運用

git-flow に沿って運用します。

- `main`:リリース済みのコード。jsDelivr の `@latest` はタグがなければここを読み込みます
- `develop`:次のリリースに向けた統合ブランチ
- `feature/*`:機能ごとの作業ブランチ。`develop` から切って `develop` へマージします
- `release/*`:リリース準備。`develop` から切って `main` と `develop` へマージし、`main` にタグを付けます
