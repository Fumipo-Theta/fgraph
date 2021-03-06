import Node from "./modules/node.js";
import Media from "./modules/media.js";
import { ToggleElement, ExclusiveStateElement } from "../../../jslib/dom_toggler.js";
import { Publisher, Subscriber } from "../../../jslib/pub_sub.js";
import Viz from "viz.js";
import * as d3 from "d3";

const changeCss = function (s, url) {
  document.querySelector(s).href = url;
};


/* url クエリによってテーマをダイナミックローディング */
(function () {
  const hash = {};
  const query = location.search.substring(1).split("&");
  for (let pair of query) {
    let kv = pair.split("=");
    hash[kv[0]] = kv[1];
  }

  let styleThemeFile = `./css/${(hash["theme"]) ? hash["theme"] : "light_theme"}.css`;
  changeCss("#dynamic_theme", styleThemeFile);

})()

/*
const {
  ToggleElement,
  ExclusiveStateElement
} = Toggle;


const { Publisher, Subscriber } = PubSub;
*/

/* Window onloaded =>  */

window.onload = function () {


  /** expandGraph
   *  Wrapper function to switch the method for expanding graph
   * 
   *  Read state of graph type in top menu
   */
  const media = new Media();

  class DrawGraph {
    constructor(opt) {

    }

    setGraphProperty(opt) {
      this.nodeSize = opt.nodeSize;
      this.edgeStrength = opt.edgeStrength;
      this.author = (opt.hasOwnProperty("authorIs")) ?
        opt.authorIs
        : { default: { fontStyle: "normal", r: 20, fontSize: 16 } };
    }

    nodeType(node) {
      return (this.nodeSize.hasOwnProperty(node.type)) ?
        this.nodeSize[node.type]
        : this.nodeSize["default"];
    }

    edgeType(node) {
      return (this.edgeStrength.hasOwnProperty(node.edge)) ?
        this.edgeStrength[node.edge]
        : this.edgeStrength["default"];
    }

    authorOf(d) {
      return d.custom.author;
    }

    authorIs(author) {
      return (!author) ?
        { fontStyle: "normal", r: 20, fontSize: 16 }
        : (this.author.hasOwnProperty(author)) ?
          this.author[author]
          : this.author["default"];
    }

    readFile(file) {
      const self = this;
      return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (ev) {
          const result = JSON.parse(reader.result)
          self.graph = result.graph;
          self.setGraphProperty(result.setting);
          if (result.hasOwnProperty("frontCover")) {
            self.parseContent(result.frontCover);
          }
          res(result);
        }
      })
    }

    bindGraph(data) {
      this.setGraphProperty(data.setting);
      this.graph = data.graph;
    }

    setFileEvent() {
      const self = this;
      document.querySelector("#inputJsonFile").onchange = function (ev) {
        const file = ev.target.files;
        document.getElementById("graph_file_label").innerHTML = file[0].name;
        self.readFile(file[0])
          .then(self.draw)
      }
    }

    parseContent(d) {
      media.setContents(d.contents)
        .getHTML().then((htmls) => {
          showModalWindow_multiContent(htmls);
        })
        .catch((err) => showModalWindow_multiContent(
          `<span class="error_message">${err}</span>`
        ));
    }

    toggleLeaf(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
    }

    summarizeLeaf(d) {
      let str = `= ${d.title}\n\n.Node children\n[format="csv", options="header"]\n|===\nrelation, node, type\n`;
      for (let leaf of d.children) {
        str += `${leaf.edges[0]},${leaf.title},${leaf.type}\n`
      }
      str += "|==="
      media.setContents(str)
        .getHTML()
        .then(showModalWindow_multiContent)
        .catch((err) => showModalWindow_multiContent(
          `<span class="error_message">${err}</span>`
        ));
    }

    nodeFocus(d, element) {
      // Zoom handling
      if (d.fx && d.fy) {
        this.nodePosition = { x: d.fx, y: d.fy };

      } else {
        this.nodePosition = { x: d.x, y: d.y };
      }
      this.divPosition = { x: this.getX(d), y: this.getY(d) };

      const position = (element == "circle") ? this.nodePosition : this.divPosition;

      d3.select("#viewer")
        .transition()
        .call(
          d3.zoom()
            .scaleExtent([1 / 2, 12])
            .on("zoom", this.zoomed.bind(this))
            .transform,
          d3.zoomIdentity.translate(
            this.geo.width * 0.5 - position.x * this.zoomScale,
            this.geo.height * 0.5 - position.y * this.zoomScale
          ).scale(this.zoomScale)
        )

    }

    nodeClickHandler(d) {


      if (showContentBtn.isActive()) {
        this.parseContent(d)
      } else if (fixNodeBtn.isActive()) {
        //this.toggleLeaf(d);
      } else if (summarizeNodeBtn.isActive()) {
        this.summarizeLeaf(d);
      }
    }

    activateEdge(d) {
      this.line.each(
        function () {
          d3.select(this)
            .classed("active", false)
            .classed("refered", false)
        }
      )
      d3.selectAll(`.link.target${d.id}`).each(
        function () {
          d3.select(this)
            .classed("active", true)
        }
      )
      d3.selectAll(`.link.source${d.id}`).each(
        function () {
          d3.select(this)
            .classed("refered", true)
        }
      )

    }

    activateNode(d) {
      this.circle.each(
        function () {
          d3.select(this)
            .classed("active", false)
            .classed("deactive", true)
            .classed("refered", false)
        }
      );
      this.div.each(
        function () {
          d3.select(this)
            .classed("active", false)
            .classed("deactive", true)
            .classed("refered", false)
        }
      );
      d3.selectAll(`.node${d.id}`).each(
        function () {
          d3.select(this)
            .classed("active", true)
            .classed("deactive", false)
        }
      );
      d.children.forEach((child) => {
        d3.selectAll(`.node${child.id}`)
          .classed("deactive", false)
      });
      d.parents.forEach((parentId) => {
        d3.selectAll(`.node${parentId}`)
          .classed("refered", true)
      })
    }
  }


  /** Treemap
   * 
  */

  class TreeMap extends DrawGraph {
    constructor() {
      super();
      this.linkSvg = {};
      this.nodeSvg = {};
      this.line = {};
      this.edge = {};
      this.circle = {};
      this.text = {};

      this.zoomLayer = {};
      this.simulation = {};

      this.padding = {
        top: 150,
        left: 200,
        right: 200,
        bottom: 100
      }

      this.margin = {
        v: 50,
        h: 25
      }
      this.rectSize = {
        w: 300,
        h: 200
      }
      this.maxColumn = 1;

      this.clickFlag = false;
    }


    zoomed() {
      this.zoomLayer.attr("transform", d3.event.transform);
      this.zoomScale = d3.event.transform.k;

      if (this.zoomScale < 2) {
        this.edge
          .attr("style", "visibility:hidden")
      } else {
        this.edge
          .attr("style", "visibility:visible")
      }

    }

    /** update nodes and edges binded to data
      * 1. graphオブジェクトをもとにノードとエッジを更新
      * 2. データとelementをバインド
      */
    update() {
      const self = this;
      const graph = this.graph;
      const authorOf = self.authorOf;
      let nodes = Node.getNodesFrom(graph);
      let links = Node.getLinksFrom(graph);
      self.nodeLength = nodes.length;


      this.linkSvg = this.zoomLayer.selectAll(".link")
        .data(links, d => d.target)

      this.linkSvg.exit().remove();

      let linkEnter = this.linkSvg.enter()
        .append("g")
        .attr("class", "link")

      this.line = linkEnter.append("line")
        .attr("class", d => `link source${d.source} target${d.target}`)
        .attr("stroke", "gray")
        .attr("stroke-width", 1)
        .attr("marker-end", "url(#arrow)")

      this.edge = linkEnter.append("text")
        .attr("text-anchor", "middle")
        .attr("class", d => d.edge)
        .text(d => d.edge)
        .attr("font-size", 10)
        .attr("font-family", "serif")
      //.attr("transform", transform(d3.zoomIdentity))

      if (this.zoomScale < 2) {
        this.edge.attr("style", "visibility:hidden")
      } else {
        this.edge.attr("style", "visibility:visible")
      }

      this.linkSvg = linkEnter.merge(this.linkSvg)

      this.nodeSvg = this.zoomLayer.selectAll(".node")
        .data(nodes, d => d.id);

      this.nodeSvg.exit().remove();

      let nodeEnter = this.nodeSvg.enter()
        .append("g")
        .attr("class", "node")
        .call(d3.drag()
          .on("start", function (d) {
            d3.select(this).classed("fixed", d.fixed = true);
            self.dragstarted.bind(self)(d)
          })
          .on("drag", self.dragged.bind(self))
          .on("end", function (d) {
            d3.select(this).classed("fixed", d.fixed = false);
            self.dragended.bind(self)(d)
          })
        )


      this.circle = nodeEnter.append("circle")
        .attr("class", d => `node${d.id} ${d.type} ${(authorOf(d) == "self") ? "self" : "reference"} ${(d.parents.length == 0) ? "root" : ""}`)
        .attr("r", d => self.nodeType(d).r)
        .on("click", function (d) {
          // ダブルクリックでノード固定解除
          let thisNode = this;
          if (self.clickFlag) {

            self.doubleClicked.bind(self)(d)
            self.clickFlag = false;
            return
          }
          self.clickFlag = true;

          // タイムアウト内に2回めのクリックがなければシングルクリック
          setTimeout(function () {
            // ダブルクリックによりclickedフラグがリセットされていない
            //     -> シングルクリックだった
            if (self.clickFlag) {
              // ノード内容を表示
              if (d3.select(thisNode).classed("active")) {
                self.nodeFocus.bind(self)(d, "circle");
                self.nodeClickHandler.bind(self)(d);
              }
              self.activateNode.bind(self)(d);
              self.activateEdge.bind(self)(d);


            }

            self.clickFlag = false;
          }, 300);

        })

      this.fo = nodeEnter.append("foreignObject")
        .attr("width", 400)
        .attr("height", 200)

      // gridレイアウト時に表示
      this.div = this.fo.append("xhtml:div")
        .attr("class", d => `node node${d.id} ${d.type} ${(authorOf(d) == "self") ? "self" : "reference"} ${(d.parents.length == 0) ? "root" : ""}`)
        .attr("style", `width:${this.rectSize.w};height:${this.rectSize.h}`)
        .on("click", function (d) {
          // ダブルクリック判定
          let thisNode = this;
          if (self.clickFlag) {

            self.doubleClicked.bind(self)(d)
            self.clickFlag = false;
            return
          }
          self.clickFlag = true;

          // シングルタップ判定
          setTimeout(function () {
            if (self.clickFlag) {
              if (d3.select(thisNode).classed("active")) {
                self.nodeFocus.bind(self)(d, "div");
                self.nodeClickHandler.bind(self)(d);
              }
              self.activateNode.bind(self)(d);
              self.activateEdge.bind(self)(d);

            }
            self.clickFlag = false;
          }, 300);
        })

      this.div.append("div")
        .attr("class", d => (authorOf(d) == "self") ? "self" : "reference")
        .text(d => d.title)


      this.text = nodeEnter.append("text")
        .attr("dy", d => - self.authorIs(authorOf(d)).r - 5)
        .attr("dx", 0)
        .attr("class", d => (authorOf(d) == "self") ? "self" : "reference")
        .text(d => d.title)


      this.nodeSvg = nodeEnter.merge(this.nodeSvg);

      this.simulation
        .nodes(nodes)

      this.simulation.force("link")
        .links(links)
    }

    /** tree, flatten
     * 1. svg要素のサイズを更新
     * 2. ズームの設定: アクティブノードがあればそれをsvgの中心に
     * 3. elementの表示・非表示切り替え
    */

    tree() {

      this.geo = {
        width: document.querySelector("#viewer").parentNode.clientWidth,
        height: document.querySelector("#viewer").parentNode.clientHeight
      }

      d3.select("#viewer")
        .transition()
        .call(
          d3.zoom()
            .scaleExtent([1 / 2, 12])
            .on("zoom", this.zoomed.bind(this))
            .transform,
          d3.zoomIdentity.translate(
            this.geo.width * 0.5 - this.nodePosition.x * this.zoomScale,
            this.geo.height * 0.5 - this.nodePosition.y * this.zoomScale
          ).scale(this.zoomScale)
        )



      this.edge.attr("style", "display:")
      if (this.zoomScale < 2) {
        this.edge.attr("style", "visibility:hidden")
      } else {
        this.edge.attr("style", "visibility:visible")
      }


      this.fo.transition().duration(200).attr("style", "opacity:0")
        .attr("style", "display:none")
      //this.div.transition().duration(200)
      //.attr("style", `width:0;height:0`)

      this.text.attr("style", "display:")
      this.simulation.restart()
    }



    flatten() {
      this.geo = {
        width: document.querySelector("#viewer").parentNode.clientWidth,
        height: document.querySelector("#viewer").parentNode.clientHeight
      }

      d3.select("#viewer")
        .transition()
        .call(
          d3.zoom()
            .scaleExtent([1 / 2, 12])
            .on("zoom", this.zoomed.bind(this))
            .transform,
          d3.zoomIdentity.translate(
            this.geo.width * 0.5 - this.divPosition.x * this.zoomScale,
            this.geo.height * 0.5 - this.divPosition.y * this.zoomScale
          ).scale(this.zoomScale)
        )



      this.fo
        .attr("style", "display:")

      this.fo
        .transition().duration(1000)
        .attr("style", "opacity:1")
      //this.div.transition().duration(1000)
      //.attr("style", `width:${this.rectSize.w};height:${this.rectSize.h}`)
      this.text.attr("style", "display:none")
      this.simulation.restart()
    }

    getX(d) {
      let n = this.nodeLength;
      let maxColumn = parseInt((this.geo.width) / (this.rectSize.w + this.margin.h));
      let i = n - d.id - 1;
      let raw = parseInt(i / maxColumn);
      let column = parseInt(i - maxColumn * raw);

      return this.padding.left + (this.rectSize.w + this.margin.h) * column;
    }

    getY(d) {
      let n = this.nodeLength;
      let maxColumn = parseInt((this.geo.width) / (this.rectSize.w + this.margin.h));
      let i = n - d.id - 1;
      let raw = parseInt(i / maxColumn);
      let column = parseInt(i - maxColumn * raw);

      return this.padding.top + (this.rectSize.h + this.margin.v) * raw;
    }


    tick() {
      if (showTreeMapBtn.isActive()) {
        this.line
          .attr("x1", function (d) { return d.source.x; })
          .attr("y1", function (d) { return d.source.y; })
          .attr("x2", function (d) { return d.target.x; })
          .attr("y2", function (d) { return d.target.y; });

        this.edge
          .attr("x", function (d) { return (d.source.x + d.target.x) * 0.5; })
          .attr("y", function (d) { return (d.source.y + d.target.y) * 0.5; });

        this.circle
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; });

        this.fo
          .attr("x", function (d) { return d.x; })
          .attr("y", function (d) { return d.y; });

        this.text
          .attr("x", function (d) { return d.x; })
          .attr("y", function (d) { return d.y; });

      } else if (showFlatMapBtn.isActive()) {
        this.line
          //.transition()
          //.duration(100)
          .attr("x1", (d) => this.getX.bind(this)(d.source))
          .attr("y1", (d) => this.getY.bind(this)(d.source))
          .attr("x2", (d) => this.getX.bind(this)(d.target))
          .attr("y2", (d) => this.getY.bind(this)(d.target));

        this.edge
          .attr("x", (d) => (this.getX.bind(this)(d.source) + this.getX.bind(this)(d.target)) * 0.5)
          .attr("y", (d) => (this.getY.bind(this)(d.source) + this.getY.bind(this)(d.target)) * 0.5);

        this.circle
          //.transition()
          //.duration(100)
          .attr("cx", this.getX.bind(this))
          .attr("cy", this.getY.bind(this));

        this.fo
          //.transition()
          //.duration(100)
          .attr("x", (d) => this.getX.bind(this)(d) - this.rectSize.w * 0.5)
          .attr("y", (d) => this.getY.bind(this)(d) - this.rectSize.h * 0.5)

        this.text
          //.transition()
          //.duration(100)
          .attr("x", this.getX.bind(this))
          .attr("y", this.getY.bind(this));
        ;
      }
    }

    distribute() {

    }


    dragstarted(d) {
      if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;

    }

    dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    dragended(d) {
      if (!d3.event.active) this.simulation.alphaTarget(0);
      if (!fixNodeBtn.isActive()) {
        d.fx = null;
        d.fy = null;
      }
    }

    // ダブルタップでノード固定解除, アクティブ状態リセット
    doubleClicked(d) {
      d.fx = null;
      d.fy = null;
      this.circle.each(function () {
        d3.select(this)
          .classed("active", false)
          .classed("deactive", false)
          .classed("refered", false)
      });
      this.line.each(function () {
        d3.select(this)
          .classed("active", false)
          .classed("deactive", false)
          .classed("refered", false)
      });
      this.div.each(function () {
        d3.select(this)
          .classed("active", false)
          .classed("deactive", false)
          .classed("refered", false)
      })
    }

    /** set up svg and force simulation
     * 
     */
    draw() {
      const self = this;
      const graph = this.graph;
      return new Promise((res, rej) => {
        let linkSvg, nodeSvg, line, edge, circle, text;
        self.zoomScale = 1;
        //let root = d3.hierarchy(graph);
        //let i = 0;
        /*
           * ノードがクリックされると, 登録されたコンテンツ(markdownテキスト, markdown外ファイル)をhtmlにパースし
           * モーダルウィンドウとして表示する
        */

        d3.select("#viewer_container").select("div").remove()
        d3.select("#viewer_container").select("svg").remove()

        const svg = d3.select("#viewer_container")
          .append("svg")
          .attr("id", "viewer")
          .attr("width", "100%")
          .attr("height", "100%")


        self.geo = {
          width: document.querySelector("#viewer").parentNode.clientWidth,
          height: document.querySelector("#viewer").parentNode.clientHeight
        }

        self.nodePosition = { x: self.geo.width * 0.5, y: self.geo.height * 0.5 };
        self.divPosition = { x: self.geo.width * 0.5, y: self.geo.height * 0.5 };

        svg.selectAll("g").remove();

        svg.append('defs').selectAll('marker')
          .data(['arrow']).enter()
          .append('marker')
          .attr('id', function (d) { return d; })
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 25)
          .attr('refY', 0)
          .attr('markerWidth', 10)
          .attr('markerHeight', 10)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M10,5 L-10,-5 M10,-5 L-10,5 ')
          .style('stroke', '#888888')
          .style("stroke-width", 1)
          .style('opacity', '1')



        svg.append("g")
          .attr("transform", "translate(50,50)")

        self.zoomLayer = svg.append("g");

        self.simulation = d3.forceSimulation()
          //self.simulation = d3.layout.force()
          .force("charge", d3.forceManyBody()
            .strength(d => self.nodeType(d).charge)
            .distanceMax([500]))
          .force("link", d3.forceLink()
            .id(d => d.id)
            .distance(d => self.edgeType(d).distance)
            .strength(d => 0.25)
          )
          .force("center", d3.forceCenter(self.geo.width / 2, self.geo.height / 2))
          .on("tick", self.tick.bind(self));



        //ズーム時の処理を設定
        svg.call(
          d3.zoom()
            .scaleExtent([1 / 2, 12])
            .on("zoom", self.zoomed.bind(self))
        )
          .on("dblclick.zoom", null)

        self.update();


        function transform(t) {
          return function (d) {
            return "translate(" + t.apply(d) + ")";
          };
        }


        function flattenGraph(root) {
          // hierarchical data to flat data for force layout
          const nodes = [];
          function recurse(node) {
            if (node.children) node.children.forEach(recurse);
            if (!node.id) node.id = ++i;
            else ++i;
            nodes.push(node);
          }
          recurse(root);
          return nodes;
        }
        res();
      })
      // drawTreemap
    }
  }



  document.querySelectorAll(".widget .button, .widget .button-like").forEach(el => {
    el.classList.add("active")
  });
  document.querySelector("#inputJsonFile").disabled = false;


  /** グラフの配置パターンを選択する排他的ボタン
   * 
  */
  const exclusiveGraphTypeButton = new ExclusiveStateElement();
  const showTreeMapBtn = exclusiveGraphTypeButton.factory(
    "#btn_tree_map",
    "click",
    function () {

      graphPublisher.publish("changeTree")
    }
  )
  const showFlatMapBtn = exclusiveGraphTypeButton.factory(
    "#btn_flat_map",
    "click",
    function () {
      graphPublisher.publish("changeFlat");
    }
  )

  /** ノード選択時の処理を選択する排他的ボタン
   * 
  */
  const exclusiveFloatButton = new ExclusiveStateElement()
  const expandFloatButton = new ToggleElement()

  const fixNodeBtn = exclusiveFloatButton.factory(
    "#btn_fold_node",
    "click",
  )

  const showContentBtn = exclusiveFloatButton.factory(
    "#btn_show_content",
    "click",
  )

  const summarizeNodeBtn = exclusiveFloatButton.factory(
    "#btn_summarize_node",
    "click"
  )

  /** フロートボタンを展開・折りたたむボタン
   * 
  */
  const expandMenuBtn = expandFloatButton.factory(
    "#btn_expand_menu",
    "click",
    function (self) {
      const floatButtons = document.querySelector("#sub_btn_containor");
      self.button.innerHTML = "×";
      floatButtons.classList.add("active");
    },
    function (self) {
      const floatButtons = document.querySelector("#sub_btn_containor");
      self.button.innerHTML = "+";
      floatButtons.classList.remove("active");
    }
  )

  /** モーダルウィンドウの操作を行うPublisher
   * 
  */
  const modalWindowOrganizer = new Publisher();
  const modalWindow = modalWindowOrganizer.subscriber();

  modalWindow.subscribe("open", function () {
    document.getElementById("modal_container").classList.add("active");
    document.getElementById("modal_window").scrollTo(0, 0);
  });
  modalWindow.subscribe("close", function () {
    document.getElementById("modal_container").classList.remove("active");
  })


  document.getElementById("modal_container").addEventListener("click", (ev) => modalWindowOrganizer.publish("close"), false);

  document.getElementById("modal_window").addEventListener("click", function (ev) {
    ev.stopPropagation();
  }, false)


  /** 文字列パーサ
   * 
  */

  const parseViz = function (domRoot) {
    return new Promise((res, rej) => {

      const block = domRoot.querySelectorAll(".language-graphviz");

      for (let i = 0, l = block.length; i < l; i++) {
        let source = block[i].innerHTML;
        let response;
        try {
          response = Viz(source)
        } catch (e) {
          response = `<p class="error_message">${e}</p>`
        }
        let parent = block[i].parentNode.parentNode;
        parent.classList.add("graphviz");
        parent.innerHTML = response;
      }

      res(domRoot);
    })
  }


  const parseMathJax = function (domRoot) {
    const convert = function (domRoot) {
      return new Promise((res, rej) => {
        res(MathJax.Hub.Typeset(domRoot));
      })
    }

    return new Promise((res, rej) => {
      convert(domRoot)
        .then(() => res(domRoot))
        .catch(rej);

      setTimeout(rej, 5000, "MathJax timed out")
    })
  }

  const wrap = function (element, wrapper) {
    element.before(wrapper);
    wrapper.append(element);
  }

  const insertHtmlDocument = function (htmls) {
    return new Promise((res, rej) => {
      const htmlArray = (Array.isArray(htmls)) ? htmls : [htmls];
      const html = htmlArray.reduce((a, b) => a + "\n" + b);

      const modalWindow = document.getElementById("modal_window")

      modalWindow.innerHTML = html;

      const childTable = document.querySelectorAll("table.tableblock");


      for (let i = 0, l = childTable.length; i < l; i++) {
        let tableWrapper = document.createElement("div");
        tableWrapper.classList.add("table_wrapper");
        wrap(childTable[i], tableWrapper)
      }
      res(modalWindow);
    })
  }

  const highlight = function (dom) {
    return new Promise((res, rej) => {
      const block = dom.querySelectorAll("pre code");
      for (let i = 0, l = block.length; i < l; i++) {
        hljs.highlightBlock(block[i]);
      }
      res(dom);
    })
  }

  /** 処理を遅らせる
   * 
  */
  const wait = function (delay) {
    return new Promise((res, rej) => {
      setTimeout(res, delay);
    })
  }

  /** 読み込んだ文字列をHTMLにパースし, モーダルウィンドウに表示する
   *  パーサは並列に稼働し, パーサが動き出してから早くとも250ms後にモーダルウィンドウを表示する
  */
  const showModalWindow_multiContent = function (htmls) {

    return new Promise((res, rej) => {
      // モーダルウィンドウにhtmlを挿入
      insertHtmlDocument(htmls)
        .then((dom) => {
          Promise.all([
            highlight(dom),
            parseMathJax(dom),
            parseViz(dom),
            wait(250)
          ])
            .then((result) => modalWindowOrganizer.publish("open"))
            .then(res)
        })
    })
  }



  /** グラフ表示イベントPublisher
   * 
  */
  const expandGraph = new DrawGraph();
  const treeMap = new TreeMap();

  const graphPublisher = new Publisher();
  const drawTreeGraph = graphPublisher.subscriber();
  drawTreeGraph.subscribe("setGraph", function (data) {
    treeMap.bindGraph(data);
  })
  drawTreeGraph.subscribe("drawTree", function () {
    treeMap.draw().then(treeMap.tree.bind(treeMap)());
  })
  drawTreeGraph.subscribe("drawFlat", function () {
    treeMap.draw().then(treeMap.flatten.bind(treeMap)());
  })
  drawTreeGraph.subscribe("changeTree", function () {
    treeMap.tree.bind(treeMap)();
  })
  drawTreeGraph.subscribe("changeFlat", function () {
    treeMap.flatten.bind(treeMap)();
  })


  /** Jsonファイルが選択されたらグラフを描く
   *  ボタンの状態によってgraphPablisherに登録された
   *  異なるメソッドが呼び出される
   */
  document.querySelector("#inputJsonFile").onchange = function (ev) {
    const file = ev.target.files;
    document.getElementById("graph_file_label").innerHTML = file[0].name;
    expandGraph.readFile(file[0])
      .then((data) => {
        graphPublisher.publish("setGraph", data)
        if (showTreeMapBtn.isActive()) {
          graphPublisher.publish("drawTree")
        } else if (showFlatMapBtn.isActive()) {
          graphPublisher.publish("drawFlat");
        }
      })

  }

  /** Style change
   *
  */
  document.getElementById("style_changer")
    .addEventListener(
      "change",
      ev => {
        const n = document.getElementById("style_changer").selectedIndex;

        changeCss(
          "#dynamic_theme",
          `./css/${document.getElementById("style_changer").options[n].value}.css`
        )
      },
      false
    )

} // window.onload
