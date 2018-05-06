/** LogicConstructor
 * 
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(["reference_and_logic"], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.LogicConstructor = factory(root.nodes);
  }
}(this, function (_nodes) {

  let nodes;
  if (typeof require === 'undefined' && typeof _nodes === 'object') {
    nodes = _nodes;
  } else {
    nodes = require("./reference_and_logic");
  }

  const Node = nodes.Node;

  /** LC (LogicConstructor)
   * 
   */
  class LC {
    constructor(nodeType) {
      this.id = LC.count();
      this.type = nodeType;

      this.dom = document.createElement("div")
      this.dom.id = "node_" + this.id;
      this.dom.classList.add("node_editor");
      this.dom.innerHTML = this.template();
      document.querySelector("#editor_container").appendChild(this.dom);
      this.addEvent.bind(this)
    }

    nodeClass() {

    }

    template() {
      const self = this;
      const html = `
        <div class="node_container header">
          <div class="node_type ${self.type}">${self.type}</div>
          <div class="node_title">
            <div class="editor node_title_editor" contenteditable="true"></div>
          </div>
          <div class="button node_delete">×</div>
        </div>

        <div class="node_container contents">
            <div class="editor node_contents_editor" contenteditable="true">
            </div>
        </div>

        <div class="node_container edge">
          <div class="node_edge">
            <div><select></select></div>
            <div><select></select></div>
          </div>
          <div class="button node_edge_appender">
            Link + 
          </div>
        </div>
      `
      return html;
    }

    addEvent() {
      const self = this;
      const component = document.querySelector(`#node_${self.id}`);
      component.querySelector(".node_delete")
        .addEventListener('click', self.deleteEditor, false);
      component.querySelector(".node_edge_appender")
        .addEventListener('click', self.addEdgeSelector, false);
    }

    deleteEditor() {

    }

    addEdgeSelector() {
      const html = `
        
      `
    }

    static count() {
      LC.id = LC.id + 1 | 0;
      return LC.id;
    }

    static initialize(domId) {
      LC.createEditorColumn(domId)
        .then(LC.setEditorEvent)
    }

    static render() {
      return new Promise((res, rej) => {
        const html = LC.htmls.reduce((a, b) => a + "\n" + b);
        LC.dom.innerHTML = html;
        res()
      })
    }

    static createEditorColumn(domId) {
      LC.dom = document.querySelector(`#${domId}`);
      return new Promise((res, rej) => {
        LC.dom.innerHTML = `
        <div id="editor_container">
        </div>
        <div id="lc_widget">
          <div class="lc_bar">Select logic type</div>
          <div class="lc_container">
            <div class="button MyFact">My Fact</div>
            <div class="button MyInference">My Inference</div>
            <div class="button RefFact">Reference Fact</div>
            <div class="button RefInference">Reference Inference</div>
          </div>
        </div>
      `;
        res();
      })
    }

    static setEditorEvent() {
      return new Promise((re, rej) => {
        LC.dom.querySelector(".button.MyFact")
          .addEventListener("click", LC.editor("MyFact"), false);
        LC.dom.querySelector(".button.MyInference")
          .addEventListener("click", LC.editor('MyInference'), false);
        LC.dom.querySelector(".button.RefFact")
          .addEventListener("click", LC.editor('RefFact'), false);
        LC.dom.querySelector(".button.RefInference")
          .addEventListener("click", LC.editor('RefInference'), false);
      })
    }

    static editor(type) {

      return function (ev) {
        return new LC(type);
      }
    }

    static storeNode(node) {
      if (typeof LC.nodeList !== "object") {
        LC.nodeList = {
          MyFact: [],
          MyInference: [],
          RefFact: [],
          RefInference: []
        }
      }
      if (node instanceof MyFact) {
        LC.nodeList.MyFact.push(node);
      } else if (node instanceof MyInference) {
        LC.nodeList.MyInference.push(node);
      } else if (node instanceof RefFact) {
        LC.nodeList.RefFact.push(node);
      } else if (node instanceof RefInference) {
        LC.nodeList.RefInference.push(node);
      } else {
        throw new Error("Type error: should be Node instance")
      }
    }

    static removeNode(node) {

    }

    static toJson() {
      /**
       * UI コンポーネントの状態を読み取り, jsonファイルに構造を書き出す
       */
    }

    static toUI() {
      /**
       * jsonファイルの内容からUIコンポーネントの状態を再生する
       */
    }
  }

  return LC;
}))