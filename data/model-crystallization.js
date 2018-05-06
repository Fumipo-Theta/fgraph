(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.model_crystallization = factory(root.nodes, root.data_for_crystal_growth);
  }
}(this, function (_nodes, _data_for_crystal_growth) {

  let nodes
  if (typeof require === 'undefined' && typeof _nodes === 'object') {
    nodes = _nodes;
  } else {
    nodes = require("../js/reference_and_logic");
  }

  let data_for_crystal_growth
  if (typeof require === 'undefined' && typeof _data_for_crystal_growth === 'object') {
    data_for_crystal_growth = _data_for_crystal_growth;
  } else {
    data_for_crystal_growth = require("./data-for-crystal-growth");
  }

  const documentRoot = "../../..";

  const Node = nodes.Node,
    MyModel = nodes.MyModel,
    MyData = nodes.MyData,
    MyInference = nodes.MyInference,
    MyPremise = nodes.MyPremise,
    RefData = nodes.RefData,
    RefInference = nodes.RefInference,
    RefModel = nodes.RefModel,
    Premise = nodes.Premise,
    Theory = nodes.Theory;


  // Model assumptions

  const modelAssumption = {}

  modelAssumption.assumeMultiMixing = new MyPremise({
    title: "多段階のマグマ混合",
    contents: `
= 多段階のマグマ混合

[simple]
* 組成プロファイルの不連続はメルト組成が短い時間スケールで急に変化したことを示すと解釈可能
`
  }).consistentWith([data_for_crystal_growth.discontinuousProfile])

  modelAssumption.assumeNoCrustalAssimilation = new MyPremise({
    title: "地殻混染は無い",
    contents: `= 地殻混染は考慮しない

= 根拠

[simple]
- 解析対象のホスト溶岩はSiO~2~濃度が低い
- 地殻物質の外来結晶が著しく溶融した様子が見られない
`
  })

  modelAssumption.assumeMultiCrystallization = new MyPremise({
    title: "多段階の結晶成長",
    contents: "多段階の結晶成長"
  }).consistentWith([
    data_for_crystal_growth.correlationOfComponents,
    data_for_crystal_growth.euhedralZoning
  ])

  modelAssumption.assumeMultiDiffusion = new MyPremise({
    title: "multiple lattice diffusion",
    contents: "多段階の斑晶内元素拡散"
  }).consistentWith([data_for_crystal_growth.sharpnessOfProfiles])

  modelAssumption.assumeCrystallizingStoichiometry = new MyPremise({
    title: "Stoichiometry of crystallization",
    contents: "Olivine + Opx + Sp"
  }).consistentWith([data_for_crystal_growth.combinationOfPhenocrysts])

  modelAssumption.assumeSystemComponents = new MyPremise({
    title: "系の組成",
    contents: "SiO2-MgO-FeO-Cr2O3-Other system"
  }).consistentWith([data_for_crystal_growth.combinationOfPhenocrysts])

  modelAssumption.assumeLocalEquilibrium = new MyPremise({
    title: "Local equilibrium",
    contents: `= 固液界面で局所平衡が成立したもとでの結晶成長

== 仮定

[simple]
* 結晶化の間結晶内部の組成は変化しない
* 元素拡散のときも局所平衡
`
  }).consistentWith([data_for_crystal_growth.euhedralZoning])


  // test
  var readme = new MyData({
    title: "Read me",
    contents: [
      "./readme.md",
      `${documentRoot}/toko/fitting_to_tanh.html`,
      `${documentRoot}/Articles/Basalt/Annen et al-2006-The genesis of intermediate and silicic magmas in deep crustal hot zones.pdf`
    ]
  })

  var readmeAdoc = new MyData({
    title: "AsciiDoc",
    contents: [`./readme.adoc`,
      `
# ここから2つめのコンテンツ(markdown literal)

## 複数のタイプのメディアをロードする

最初のコンテンツはasciidoc形式だったが, このコンテンツはmarkdown形式である
`,
      `./image/test_diagram.html`
    ]
  })

  var pdf = new MyData({
    title: "pdf",
    contents: `${documentRoot}/Articles/Basalt/Annen et al-2006-The genesis of intermediate and silicic magmas in deep crustal hot zones.pdf`
  })

  // Model
  const model_crystallization = {};

  model_crystallization.growthModel = new MyModel({
    title: "multiple mixing, crystal growth, and lattice diffusion model",
    contents: `${documentRoot}/thesis/decode_zoning/common_zoning_formation.adoc`
  }).assuming([
    modelAssumption.assumeMultiMixing,
    modelAssumption.assumeNoCrustalAssimilation,
    modelAssumption.assumeMultiCrystallization,
    modelAssumption.assumeMultiDiffusion,
    modelAssumption.assumeCrystallizingStoichiometry,
    modelAssumption.assumeSystemComponents,
    modelAssumption.assumeLocalEquilibrium
  ])
    .basedOn([
      pdf,
      readme,
      readmeAdoc
    ])




  return model_crystallization;
}))