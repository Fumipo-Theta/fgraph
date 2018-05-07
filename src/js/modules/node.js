(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory)
  } else if (typeof exports === "object") {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.Node = factory();
  }
})(this, function () {
  /** Graph
   *
   * 与えられたNodeをrootとするグラフを構築し, 返す.
   * このとき, 全てのNodeの親ノードのidを評価する.
   */

  class Graph {
    constructor(node) {
      return Graph.getGraphFrom(node);
    }

    static getGraphFrom(node) {
      let graph = {};
      graph.custom = node.custom;
      graph.contents = node.contents;
      graph.edges = node.edges;
      graph.parents = node.parents.map(p => p());
      graph.title = node.title;
      graph.type = node.type;

      graph.depth = node.depth;
      graph.id = node.id;

      let children = node.children;
      if (children.length <= 0) {
        graph.children = [];
      } else {
        graph.children = children.map(child => Graph.getGraphFrom(child));
      }
      return graph;
    }
  }

  /** Node
   *
   * グラフを構成するノード.
   * グラフが構築されるときにユニークなidとrootからのdepthを与えられる.
   * parentsは評価されると親ノードのidを返す関数として登録される.
   */
  class Node {
    constructor(_type, opt = { title: "", contents: "" }) {
      this.custom = {};
      this.children = [];
      this.contents =
        opt instanceof Object && opt.hasOwnProperty("contents")
          ? opt.contents
          : "";
      this.edges = [];
      this.parents = [];
      this.title =
        opt instanceof Object && opt.hasOwnProperty("title") ? opt.title : "";
      this.type = _type;
      //this.id = Node.count();
      return this;
    }

    static setSequentialId(nodes, init = 0) {
      Node.resetCount(init);
      const n = nodes.length - 1;
      nodes.forEach(node => {
        if (!node instanceof Node) throw TypeError("Node only !")
        console.log(node.title)
        node.id = n - Node.count();
      });
    }

    static count() {
      Node.id = Node.id + 1 || 0;
      return Node.id - 1;
    }

    static resetCount(count = 0) {
      Node.id = count;
    }

    setTitle(title) {
      this.title = title;
      return this;
    }

    /** setChildren
     *
     * @param {Node} nodes
     * @param {String} relation
     */
    setChildren(nodes, relation) {
      if (Array.isArray(nodes)) {
        if (!nodes.map(node => node instanceof Node).reduce((a, b) => a && b))
          throw new TypeError("Node only !");
        var childNodes = nodes;
      } else if (nodes instanceof Node) {
        var childNodes = [nodes];
      } else {
        throw new TypeError();
      }

      let childrenIds = this.getChildren().map(child => child.title);

      for (let node of childNodes) {
        // 子が登録されていなければ追加する
        if (childrenIds.indexOf(node.title) < 0) {
          this.children.push(node);
          node.setParent(this, relation);
        } else {
          throw new Error(
            `Node [${node.title}] has already been registered in node [${
            this.title
            }]`
          );
        }
      }

      return this;
    }

    /** setParent
     *
     * 指定したNodoの親ノードのidをクロージャーとして与え, 関係を表す文字列をedgesに加える
     *
     * @param {Node} node
     * @param {String} relation
     */
    setParent(node, relation) {
      this.parents.push(() => node.id);
      this.edges.push(relation);
    }

    getChildren() {
      return this.children;
    }

    setContents(contents) {
      this.contents = contents;
      return this;
    }

    /** toJson
     *
     * Nodeをrootとするグラフ構造をjson形式で返す.
     * 子ノードの探索方法を幅優先・深さ優先で指定可能.
     *
     * @param {Stting} method
     * @param {*} prop
     */
    toJson(method = "width", prop = null) {
      return Node.stringify(this, method, prop);
    }

    static of(Class, opts) {
      return opts.map(opt => new Class(opt));
    }

    /** constructGraphFrom
     *
     * 指定したノードをrootとするグラフを作成し, 返す.
     * 子ノードの探索方法として幅優先, 深さ優先のどちらかを指定可能.
     *
     * @param {Node} node
     * @param {Bool} reset
     * @param {String} method
     * @param {Int} count
     * @param {Int} depth
     * @return {Graph}
     */
    static constructGraphFrom(node, reset = true, method = "width", count = 0, depth = 0) {
      // 予めNodeにidとdepthが割り振られていることを想定し, それらを除去

      if (reset) {
        Node.resetCount(count);
        Node._deleteIdOfNodeFrom(node);
      }

      if (method == "width") {
        return new Graph(Node._setIdToNodeByWidthFirst(node, depth));
      } else if ((method = "depth")) {
        return new Graph(Node._setIdToNodeByDepthFirst(node, depth));
      } else {
        throw new Error(
          "正しいグラフの探索方法を指定してください [ 'width' | 'depth' ]"
        );
      }
    }

    /** _setIdToNodeByDepthFirst
     *
     * @param {Node} node
     * @param {Int} depth
     * @return {Node}
     *
     * 指定したノードをrootとし, 深さ優先探索でノードに1から始まるidと, rootからの深度を付与する.
     */
    static _setIdToNodeByDepthFirst(node, depth = 0) {
      node.id = (node.id == undefined) ? Node.count() : node.id;
      node.depth = (node.depth == undefined) ? depth : node.depth;
      let children = node.children;

      if (children.length > 0)
        children.map(child => Node._setIdToNodeByDepthFirst(child, depth + 1));

      return node;
    }

    /** _setIdtoNodeByWidthFirst
     *
     * @param {Node} node
     * @param {Int} depth
     * @return {Node}
     *
     * 指定したノードをrootとし, 幅優先探索でノードに1から始まるidと, rootからの深度を付与する.
     */
    static _setIdToNodeByWidthFirst(node, depth = 0) {
      node.id = (node.id == undefined) ? Node.count() : node.id;
      node.depth = (node.depth == undefined) ? depth : node.depth;

      let children = node.children;

      let next = children
        .map(child => child.children)
        .reduce((a, b) => a.concat(b), []);

      for (let child of children) {
        child.id = (child.id == undefined) ? Node.count() : child.id;
        child.depth = (child.depth == undefined) ? depth + 1 : child.depth;
      }

      next.map(n => Node._setIdToNodeByWidthFirst(n, depth + 1));

      return node;
    }

    /** _deleteIdOfNodeFrom
     *
     * @param {Node} node
     *
     * 指定したroot node以下に連なるNodeからidとdepthを取り除く
     */
    static _deleteIdOfNodeFrom(node) {
      node.id = null;
      node.depth = null;
      let children = node.children;
      if (children.length > 0)
        children.map(child => Node._deleteIdOfNodeFrom(child));
    }

    /** _flat
     *
     * Nodeの子ノードを再帰的にリストアップし, 1次元配列として返す
     *
     * @param {Array} arr
     * @param {Node} node
     * @return {[Node]}
     */
    static _flat(arr, node) {
      if (Array.isArray(node.children) && node.children.length > 0) {
        return node.children.reduce(Node._flat, arr.concat(node));
      } else {
        return arr.concat(node);
      }
    }

    /** stringify
     *
     * 指定したノードをrootとするグラフをJson形式で返す
     *
     * @param {Node} node
     * @param {String} method
     * @param {String} prop
     * @return {String}
     */
    static stringify(node, method = "width", prop = null) {
      const graph = Node.constructGraphFrom(node, method);

      return JSON.stringify(graph, prop, 2);
    }

    /** getNodesFrom
     *
     * @param {Node} node
     * @return {[Node]}
     *
     * 指定したノードをrootとし, rootの子孫ノードで構成されるユニークな配列を返す
     *
     */
    static getNodesFrom(node) {
      const graph = node instanceof Node ? Node.constructGraphFrom(node) : node;

      if (Array.isArray(graph.children) && graph.children.length > 0) {
        const nodeList = graph.children.reduce(Node._flat, [graph]);
        const ids = nodeList.map(node => node.id).filter(function (x, i, self) {
          return self.indexOf(x) === i;
        });

        var uniqueList = ids.map(id => {
          for (let node of nodeList) {
            if (id === node.id) return node;
          }
        });
      } else {
        uniqueList = [graph];
      }

      return uniqueList;
    }

    /** getLinksFrom
     *
     * @param {Node}
     * @return {[Object]}
     *
     * 指定したノードをrootとし, rootの子孫ノード間のリンクに関するユニークな配列を返す
     */

    static getLinksFrom(node) {
      const graph = node instanceof Node ? Node.constructGraphFrom(node) : node;

      const uniqueList = Node.getNodesFrom(graph);

      return uniqueList
        .map(node => {
          return node.parents.map((p, i) => {
            return {
              source: node.id,
              target: typeof p == "function" ? p() : p,
              edge: node.edges[i]
            };
          });
        })
        .reduce((a, b) => a.concat(b));
    }
  }

  return Node;
});
