# logicStructure

## Whats this ?

論理構造は構成要素がしばしば入れ子になり, 複数の要素が同一の要素を参照することがある. そのような構造を分かりやすく, メンテナンスしやすく構築するため, 本アプリケーションでは, 論理の構成要素をフラットに並べて記述した後, 構成要素同士の参照関係を構築できるようにした.  
また, 論理の構成要素の詳細情報をmarkdownやasciidoc, html, pdf文書に記録しておくことで, 必要に応じて内容表示することができるようにした.  
論理構造の構築には, reference\_and_logic.jsに定義されたNodeクラスおよび関連するサブクラスを用い, 論理構造をJSONファイルとして出力する.  
論理構造の描画には, ref\_and_logic.htmlに記述されたWeb application上でJSONファイルを読み込む.

``` text
root
  +- css
  |  +- style.css      // style for UI of viewer application
  |  +- markdown.css   // style of graph and node contents
  |
  +- js
  |  +- reference_and_logic.js // create logic graph
  |  +- media.js               // parse and render node contents
  |
  +- node_module
  |
  +- ref_and_logic.html        // graph viewer application

```

## reference_and_logic.js

### 概要

- 論理構造の作成を行うアプリケーション
- 論理構造における自分と引用の主張・データを区別可能
- 誤った論理構造の構築を防止することが可能
- 論理ノードごとに詳細情報を登録可能


### Node Class

- 自分の論理はSelfNode, 引用する論理はRefNode
  - SelfNodeはRefNodeの子ノードになることができない．
- 論理を構成する要素として, SelfNodeとRefNodeはともに, Fact, Inference, Modelに細分される. 
  - Factノードは子ノードを持たず, さらにDataとTheoryに細分される．
  - InferenceノードはInferenceとPremiseからなる.
  - 正しい論理構造において, 全てのInferenceとModelの子孫はFactに行き着くべきである

``` text
Node
 +- SelfNode                        Fact
 |   +- MyData       ---------------+     Model
 |   +- MyModel      -------------- | ----+
 |   +- MyInference  ------+        |     |
 |   +- MyPremise    ------+        |     | 
 +- RefNode                |        |     |
     +- RefData      ----- | -------+     |
     +- Theory       ----- | -------+     |
     +- RefModel     ----- | -------------+
     +- RefInference ------+
     +- RefPremise   ------+
                           Inference
```

### 子ノードとの論理関係

それぞれのクラスには, 子ノード登録メソッドとして以下の様なものがある.
これらの構文を使うことで, 論理的な依存関係を守ることができる.

``` text
Fact: (nothing)

Model:
  assuming(premises)
  basedOn(theorem)
  composedOf(models)
  appliedTo(facts)

Inference:
  becauseOf(nodes)
  consistentWith(facts)
  supportedBy(nodes)
  estimatedBy(models)
  exceptingFor(nodes)
  indicatedBy(nodes)
  assuming(premises)
  extendingOn(references)
```


### Nodeクラスを使用法した論理構造の作成方法

外部ファイルのパス指定について

- 描画applicationであるref\_and_logic.htmlからの相対パスで解決される.
- 外部ファイルがapplicationとsame originの場所になければならない.

``` javascript
Node : {
    type : inference | data | theory | premise | model,
    title : String,
    content : Content,
    author : String,
    parent : String,
    edge : String,
    children : [Node]
    
}

// Nodeインスタンスの生成 markdownリテラルの例
const myInference = new MyInference({
  title: "foo",
  contents : [
    `# コンテンツの種類1
    ## マークダウンリテラル

    - マークダウン文章をリテラルとして渡せる
    - リテラルは文字列の最後が".md|.html|.pdf"では終わらないものとする
    - リテラルはMediaクラスのインスタンスに渡され,HTMLへパースされる`,

    `= コンテンツは配列の形で指定可能

    == 配列要素ごとに適切なパーサでhtmlへと変換される
    
    外部 html ファイルは<iframe>内部で表示されるので, もとの文書中のscriptやcssが適用される.
    `
  ]
});


// ノードの配列を生成 外部ファイルを参照する例
const myData = Node.of(Mydata,[
  {
    title: "data1",
    contents: [
      "./hoge.md",
      "hogehoge.adoc",
      "../something.html"
      ]
  },
  {
    title: "data2",
    contents: "../document/fuga.pdf#page=3"
  }
]);

// 引用ノードインスタンスの作成
const refData = RefData({
  author: "John",
  title: "John's data",
  contents : "brabra.html"
});

// ノードの親子関係の設定
myInference.consistentWith(myData);
myInference.supportedBy(refData);


// グラフの構築と出力
// constructGraph実行により, rootを始点としてノードを探索し,
// 各ノードにIDとrootからの最短深さが与えられる
// このとき, 第二引数("depth" | "width")によって探索方法を深さ優先・幅優先のいずれかに指定可能
// 第三引数で, idの開始値を, 第四引数でdepthの開始値を指定する

const constructedGraph = Node.constructGraph(myInference,"width",0,0)

// Jsonへの変換

const json = Node.stringify(constructedGraph);

const nodes = Node.getNodesFrom(constructedGraph);
const links = Node.getLinksFrom(constructedGraph);

```

## Contents Class

### Media Class

``` text
Media
  |--- Literal
  |          |- markdown literal
  |          +- asciidoc literal
  +--- ExternalFile
             |- markdown (.md) 
             |- asciidoc (.adoc)
             |- html (.html)
             +- pdf (.pdf)
```

- Nodeインスタンスと一対一に対応し, モーダルウィンドウの表示を担う.
- Mediaインスタンスは, Nodeにおけるモーダルウィンドウ表示イベントに反応する.
- 表示イベントは, Nodeをドラッグせずクリックしたときに発火する.
- Mediaは文字列リテラルや外部ファイルをhtmlへと変換する.
  - Markdown・Asciidoc文書リテラルはLiteralサブクラスに渡され, Nodeクリック時にHTMLへとパースされる.
  - 外部ファイルであれば, ExternalFileサブクラスによりクリック時にfetchされたのち, HTMLへとパースされる.
    - 外部ファイルは".md", ".adoc, ".html", ".pdf"に対応
    - 外部htmlは `<iframe>` 内に表示され, pdfは `<object>` として表示される
- asciidoc形式では外部ファイルのcsvなどを `include` できる
- Nodeのcontentsは配列として複数の形式の文書,外部ファイルを登録可能. それらは直列に連結されたHTML文書へと変換される
- パースされたHTMLはモーダルウィンドウとして表示される.
- Latex形式の数式はMathJaxでレンダリングされる
- `<pre>` 要素内はhighlight.jsでハイライト表示される

### Usage

1. インポート

htmlの場合

``` javascript
<script src = "marked.js"></script>
<script src = "asciidoctor.js"></script>
<script src = "media.js"></script>
```

node.jsの場合

``` javascript
const Media = require("media");
```

2. 文字列・外部ファイルパスからhtml文書への変換

``` javascript
const mediaHandler = new Media()
mediaHandler.setContents(string_or_path)
            .getHTML().then((htmlTextArray) => {
              somethingSpecialFunction(htmlTextArray);
            })
            .catch(errorHandler);
```

## Viewer について

- 作成した論理グラフを有向グラフとして可視化する.

- ノードのコンテンツを表示し, プレゼンテーションを行うことが可能.

![](./image/graph_viewer.png)

![](./image/modal_window_viewer.png)

### Basis function

- ノード間の論理的な依存関係の表示
- ノードの詳細情報の表示
  - Markdown・Asciidoc形式の文書をHTMLとして表示
  - TeX表記された数式を表示
  - dot言語で記述されたダイアグラムの表示
  - コードのハイライト表示
  - 外部ファイル(.md, .adoc, .html, .pdf)の読み込み


### Graph arrangement modes

1. Force layout mode
  ![force layout](./image/force_layout_md.png)
  - 論理ノード同士の位置が相互作用する
1. Grid layout mode
  ![grid layout](./image/grid_layout_md.png)
  - 論理ノードをグリッドに沿って配置し, 固定する

### Node event

基本イベント

- クリックしたノードを画面の中央に移動させる
- クリックしたノードとその子ノード, ノード間リンクを強調表示する

また, フロートボタンにより, ノードをクリック/タップした時の処理を切り替えることができる

1. Show node detail mode
  - あらかじめノードに設定した詳細情報を表示する
1. Fix node position mode (Force layout modeのみ)
  - ノードをドラッグしたとき, ノードの位置を固定する
  - 固定されたノードはダブルクリック/ダブルタップで解放される
1. List up edge type mode
  - 論理的に依存するノードの名前とエッジのタイプ一覧を表示する


### Asciidocにおけるカスタムスタイル

1. `<ul>`, `<ol>` 要素
  - dense-layout 行間を詰めたスタイル
  - simple-style 箇条書きや連番を廃した表示
    - 1x, 2x, 3x : 1列, 2列, 3列表示

```
[simple]
* list item
* list item

[simple]
* list item
  ** sub item
  ** sub item
* list item
  ** sub item
  ** sub item
```

### カラーテーマ選択

URL末尾にセレクターを指定することで, node viewer とcontents viewerのカラーテーマ(cssに記述)を指定可能.
スタイルシートは, `/css` フォルダに置かれたものから選択可能.

```
/root
   +- ref_and_logic.html
   +- /css
   |    +- light_theme.css
   |    +- dark_theme.css
   |    +- your_custom.css
   +- /js


```


- デフォルト (light\_theme.css) `logicStructure/ref_and_logic.html`
- Light theme (light\_theme.css) `logicStructure/ref_and_logic.html?style=light_theme`
- Dark theme (dark\_theme.css) `logicStructure/ref_and_logic.html?style=dark_theme`
- カスタムテーマ　(例: your\_custom.css) `logicStructure/ref_and_logic.html?style=your_custom`


## To do

- ノードのモジュールを定義し, 再利用可能にする
- fumiposAPI などを用いたグラフ表示機能を加える
  - ploty.jsを用いる?
- クラス図などを描けるようにする

## 使用技術

- ライブラリ
  - d3
  - MathJax
  - marked.js
  - asciidoctor.js
  - highlight.js
  - viz.js

> [MathJaxの使い方](http://genkuroki.web.fc2.com/)
>
> [MathJaxを動的に使う - bl.ocks.org](https://bl.ocks.org/habari2011dunia/1e2ae90171e855fa5c76)
>
> [MathJax Documentation — MathJax 2.7 documentation](http://docs.mathjax.org/en/latest/index.html)
>
> [How to use highlight.js](https://highlightjs.org/usage/)
>
> [asciidoctor.js/manual.adoc at master · asciidoctor/asciidoctor.js · GitHub](https://github.com/asciidoctor/asciidoctor.js/blob/master/manual.adoc)
>
> [AsciiDoc入門 - Qiita](https://qiita.com/xmeta/items/de667a8b8a0f982e123a)
>
> [AsciiDoc cheatsheet](http://powerman.name/doc/asciidoc)
>
> [GitHub - mdaines/viz.js: A hack to put Graphviz on the web.](https://github.com/mdaines/viz.js)
>
> [Graphvizとdot言語でグラフを描く方法のまとめ - Qiita](https://qiita.com/rubytomato@github/items/51779135bc4b77c8c20d)