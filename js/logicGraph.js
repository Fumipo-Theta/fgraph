(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(["../../jslib/d3.v4.min"], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.LogicGraph = factory(
      root.d3,
      root.Media,
      root.LogicGraphExtension);
  }
}(this, function (_d3, _Media, _lgExt) {

  let d3
  if (typeof require === 'undefined' && typeof _d3 === 'object') {
    d3 = _d3;
  } else {
    d3 = require("../../jslib/d3.v4.min");
  }

  let Media
  if (typeof require === 'undefined' && typeof _Media === 'object') {
    Media = _Media;
  } else {
    Media = require("./media");
  }


  let lgExt
  if (typeof require === 'undefined' && typeof _lgExt === 'object') {
    lgExt = _lgExt;
  } else {
    lgExt = require("./logicGraphExtension");
  }

  let fetchFunc;
  if (typeof require === 'undefined') {
    fetchFunc = fetch;
  } else {
    fetchFunc = require("../../node_modules/node-fetch");
  }

  const fetchWrapper = function (url, opts, timeout) {
    return new Promise((res, rej) => {
      fetchFunc(url, opts)
        .then(res)
        .catch(rej);

      if (timeout) {
        const e = new Error("Loading timed out");
        setTimeout(rej, timeout, e);
      }
    })
  }

  logicGraph = new LogicGraph({
    "svg": "#viewer",
    "jsonInput": "#inputJsonFile",
    "jsonLabel": "#graph_file_label",
    "overlay": "#overlay",
    "modalWindow": "#modal_window"
  }, "")


  class LogicGraph {
    constructor(selector, settingUrl) {
      this.geo = { width: 2000, height: 1500 };
      this.svg = d3.select(selector.svg)
        .attr("width", self.geo.width)
        .attr("height", self.geo.height)

      this.jsonInputDom = document.querySelector(selector.jsonInput);
      this.jsonLabelDom = document.querySelector(selector.jsonLabel);
      this.floatButtonDom = document.querySelector(selector.floatButton);
      this.overlayDom = document.querySelector(selector.overlay);
      this.modalWindow = document.querySelector(selector.modalWindow);

      this.setting = settingUrl;
      this.nodeAppearance = {};
      this.initialize();
    }

    initialize() {
      const self = this;
      return new Promise((res, rej) => {
        const jobs = [
          self.createSvg,
          self.readSetting
        ];

        Promise.all(jobs)
          .then(self.setReadFileEvent)
          .then(res)
          .catch((err) => console.log(err))
      })
    }

    createSvg() {
      const self = this;
      return new Promise((res, rej) => {
        self.linkSvg = null
        self.nodeSvg = null
        self.line = null
        self.edge = null
        self.circle = null
        self.text = null


        self.svg.append('defs').selectAll('marker')
          .data(['arrow']).enter()
          .append('marker')
          .attr('id', function (d) { return d; })
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 50)
          .attr('refY', 0)
          .attr('markerWidth', 10)
          .attr('markerHeight', 10)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M10,5 L-10,-5 M10,-5 L-10,5 ')
          .style('stroke', '#888888')
          .style("stroke-width", 2)
          .style('opacity', '1');

      })

    }

    readSetting() {
      const self = this;
      return new Promise((res, rej) => {
        fetchWrapper(self.setting, null, 1000)
          .then((response) => self.nodeAppearance = response.json())
          .then(res)
          .catch((err) => console.log(err))
      })
    }

    setReadFileEvent() {
      const self = this;
      this.jsonInputDom.addEventListener(
        "change",
        function (ev) {
          const file = ev.target.files[0];
          self.jsonLabelDom.innerHTML = file.name;
          LogicGraph.readFile(file)
            .then(self.drawTreeMap.bind(self))
            .then(self.update.bind(self))
        }
      )
    }

    /**
     * 
     * @param {*} btnConfigs
     * [
     *  {
     *    name: show,
     *    function: function(d,i){
     *      
     *    }
     *  },
     *  {
     *    name: fold,
     *    function: function(d,i){
     *    
     *    }
     *  }
     * ]
     *  
     */

    setFloatButtonEvent(btnConfigs, containerSelector) {
      const self = this;
      self.buttons = [];
      self.buttonNames = [];
      self.nodeEvent = {};
      return new Promise((res, rej) => {
        btnConfigs.map((o, i) => {
          const dom = document.createElement("div")
          dom.id = `btn_${o.name}`;
          dom.classList.add(["button", "round"]);
          const container = document.querySelector(containerSelector)
          document.appendChild(dom, container)

          self.buttonNames[i] = o.name;
          self.nodeEvent[o.name] = o.function;
          self.buttons[i] = new ToggleButton(
            `btn_${o.name}`,
            (i === 0) ? true : false,
            function (self) {
              ToggleButton.deactivateBtns(self.buttons.filter((o, j) => j != i));
              if (self.state) {
                self.button.classList.add("active");
              } else {
                self.button.classList.remove("active");
              }
            }
          )

        })
        res();
      })
    }

    setExpandFloatMenu() {
      return
    }

    setOverLayEvent() {

    }

    setModalWindowEvent() {

    }

    drawTreeMap(graph) {
      const self = this;
      return new Promise((res, rej) => {
        self.svg.selectAll("g").remove();

        self.svg.append("g")
          .attr("transform", "translate(50,50)")

        self.zoomLayer = svg.append("g");

        self.simulation =
          d3.forceSimulation()
            .force("charge", d3.forceManyBody()
              .strength(d => nodeType[d.type]().charge)
              .distanceMax([500]))
            .force("link", d3.forceLink()
              .id(d => d.id)
              .distance(d => edgeType(d.edge).distance)
              .strength(d => 0.25)
            )
            .force("center", d3.forceCenter(geo.width / 2, geo.height / 2))
            .on("tick", self.ticked);

        const zoomed = function () {
          self.zoomLayer.attr("transform", d3.event.transform);

        }

        self.svg.call(d3.zoom()
          .scaleExtent([1 / 2, 12])
          .on("zoom", zoomed));

        const transform = function (t) {
          return function (d) {
            return "translate(" + t.apply(d) + ")";
          };
        }

        res(graph);
      })


    }

    update(graph) {
      const self = this;
      return new Promise((res, rej) => {
        let nodes = Node.getNodesFrom(graph);
        let links = Node.getLinksFrom(graph);


        self.linkSvg = self.zoomLayer.selectAll(".link")
          .data(links, d => d.target)

        self.linkSvg.exit().remove();

        let linkEnter = self.linkSvg.enter()
          .append("g")
          .attr("class", "link")

        self.line = linkEnter.append("line")
          .attr("stroke", "gray")
          .attr("stroke-width", 1)
          .attr("marker-end", "url(#arrow)")

        self.edge = linkEnter.append("text")
          .attr("text-anchor", "middle")
          .text(d => d.edge)
          .attr("stroke", "gray")
          .attr("font-size", 10)
          .attr("font-family", "serif")
        //.attr("transform", transform(d3.zoomIdentity))
        self.linkSvg = linkEnter.merge(self.linkSvg)

        self.nodeSvg = self.zoomLayer.selectAll(".node")
          .data(nodes, d => d.id);

        self.nodeSvg.exit().remove();

        let nodeEnter = self.nodeSvg.enter()
          .append("g")
          .attr("class", "node")
          .call(d3.drag()
            .on("start", self.dragstarted)
            .on("drag", self.dragged)
            .on("end", self.dragended));

        self.circle = nodeEnter.append("circle")
          .attr("r", d => authorIs(d.author).r)
          .attr("stroke", d => nodeType[d.type]().stroke)
          .attr("fill", d => nodeType[d.type]().fill)
          .on("click", self.nodeClickHandler)
        //.attr("transform", d3.zoomIdentity)


        //circle.append("title")
        //.text(function (d) { return d.contents; });

        self.text = nodeEnter.append("text")
          .attr("dy", d => - authorIs(d.author).r - 5)
          .attr("dx", 0)
          .attr("text-anchor", "middle")
          .attr("font-size", d => authorIs(d.author).fontSize)
          .attr("font-style", d => authorIs(d.author).fontStyle)
          .text(d => d.title)
          .attr("stroke", "black")

        self.nodeSvg = nodeEnter.merge(self.nodeSvg);

        self.simulation
          .nodes(nodes)

        self.simulation.force("link")
          .links(links);

        res();
      })
    }

    nodeClickHandler(d, i) {
      if (showContentBtn.state == true) {
        parseContent(d)
      } else if (foldNodeBtn.state == true) {
        toggleLeaf(d);
      }
    }



    ticked() {
      line
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

      edge
        .attr("x", function (d) { return (d.source.x + d.target.x) * 0.5; })
        .attr("y", function (d) { return (d.source.y + d.target.y) * 0.5; });

      circle
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });

      text
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; });
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
      d.fx = null;
      d.fy = null;
    }




    static readFile(file) {
      return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (ev) {
          const graph = JSON.parse(reader.result);
          res(graph);
        }
      })
    }
  }

  class ToggleButton {
    constructor(id, state, func) {
      const self = this;
      this.button = document.querySelector(`#${id}`);
      this.button.addEventListener("click", (ev) => self.toggle(), false)
      this.state = state;
      this.func = func;
    }

    toggleState() {
      this.state = !this.state;
      return this;
    }

    toggle() {
      this.toggleState();
      this.func(this);
    }
  }

  const deactivateBtns = function (btns) {
    for (let btn of btns) {
      if (btn.state == true) {
        btn.toggleState();
        btn.button.classList.remove("active")
      }
    }

  }


  return LogicGraph;
}))