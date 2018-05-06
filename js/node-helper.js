(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Node_helper = factory(root.Node);
  }
}(this, function (_Node) {

  const Node = (typeof require === 'undefined' && typeof _Node === 'object') ?
    _Node
    : require("./node.js");

  const fs = (typeof require === 'undefined' && typeof _f === 'object') ?
    null
    : require("fs");


  class Node_helper {
    constructor() {
      this.data = {
        setting: {},
        graph: {},
        frontCover: {
          contents: []
        }
      }
    }

    setForceSetting(opt) {
      this.data.setting = opt;
    }

    setRootNode(node, reset, method, count, depth) {
      this.data.graph = Node.constructGraphFrom(node, reset, method, count, depth);
    }

    setFrontCover(contents) {
      this.data.frontCover.contents = contents;
    }

    setSequentialId(nodes) {
      Node.setSequentialId(nodes);
    }

    writeGraphJson(path) {
      fs.writeFileSync(path, JSON.stringify(this.data, null, 2))
    }
  }

  return Node_helper;
}))