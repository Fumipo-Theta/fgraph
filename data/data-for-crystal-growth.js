(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.data_for_crystal_growth = factory(root.nodes);
  }
}(this, function (_nodes) {

  let nodes
  if (typeof require === 'undefined' && typeof _nodes === 'object') {
    nodes = _nodes;
  } else {
    nodes = require("../js/reference_and_logic");
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


  const data_for_crystal_growth = {};


  data_for_crystal_growth.discontinuousProfile = new MyData({
    title: "組成プロファイルの複数の不連続",
    contents: `
# 波動累帯構造における不連続な組成変化

Opx斑晶のCrプロファイルが不連続に変化する

### データソース

data_for_crystal_growth/SVB/mineral/EPMA/opx_zoning_compile.csv#comment=1002-9-1C-1_line1
`
  })

  data_for_crystal_growth.correlationOfComponents = new MyData({
    title: "組成プロファイルの相関",
    contents: "Fe/MgとCr2O3の相関"
  })

  data_for_crystal_growth.sharpnessOfProfiles = new MyData({
    title: "組成プロファイルのシャープネス",
    contents: "Cr2O3のほうがFe/Mgよりシャープ"
  })

  data_for_crystal_growth.euhedralZoning = new MyData({
    title: "自形的な累帯構造",
    contents: "# Cr2O3マッピングは自形的な累帯構造を示す"
  })

  data_for_crystal_growth.combinationOfPhenocrysts = new MyData({
    title: "斑晶組み合わせ",
    contents: `
= Lava flow II の斑晶組み合わせ

== Olivine

. 大きな自形単結晶
** 外縁部がスケルタル
. Opxとの集斑晶の中央部

== Opx

. 自形単結晶
** 波動累帯構造
. Olivineとの集斑晶
** olivineを取り巻くように存在
** 波動累帯構造

`
  })


  return data_for_crystal_growth;
}))