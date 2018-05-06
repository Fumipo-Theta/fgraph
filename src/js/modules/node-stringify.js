(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.nodeToJson = factory(root.nodes,
      root.fs);
  }
}(this, function (_nodes, _fs) {

  let nodes
  if (typeof require === 'undefined' && typeof _nodes === 'object') {
    nodes = _nodes;
  } else {
    nodes = require("./reference_and_logic");
  }

  const Node = nodes.Node;


  let fs
  if (typeof require === 'undefined' && typeof _fs === 'object') {
    fs = _fs;
  } else {
    fs = require("fs");
  }


  const nodeToJson = function (node, outputPathName) {
    fs.writeFileSync(outputPathName, Node.stringify(node));
  };

  return nodeToJson;
}))