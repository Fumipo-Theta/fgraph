
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(["node", "mixin"], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.logicNodes = factory(root.Node, root.mixinModule);

  }
}(this, function (_Node, _mixinModule) {


  const Node = (typeof require === 'undefined' && typeof _Node === 'function') ?
    _Node
    : require('./node.js');

  const { on, mixin } = (typeof require === 'undefined' && typeof _mixinModule === 'object') ?
    _mixinModule
    : require('./mixin.js');



  const HasSubDomain = {
    composedOf(domain) {
      this.setChildren(domain, "composed of");
      return this;
    },

    using(data) {
      this.setChildren(data, "using");
      return this;
    },

    processedBy(tool) {
      this.setChildren(tool, "processed by");
      return this;
    }
  }


  const DataTransformation = {
    compiledFrom(src) {
      this.setChildren(src, "compiled by");
      return this;
    },

    edittedBy(tool) {
      this.setChildren(tool, "editted by");
      return this;
    },

    managedBy(tool) {
      this.setChildren(tool, "managed by");
      return this;
    },

    composedOf(data) {
      this.setChildren(data, "composed of");
      return this;
    },

    example(data) {
      this.setChildren(data, "example");
      return this;
    }
  }

  const ToolHierarchy = {
    supportedBy(tool) {
      this.setChildren(tool, "supported by");
      return this;
    }

  }

  class Domain extends on(Node) `mixin`(HasSubDomain) {
    constructor(opt) {
      super("domain", opt);
      this.custom.author = "self";
      return this;
    }
  }


  class Data extends on(Node) `mixin`(DataTransformation) {
    constructor(opt) {
      super("data", opt);
      this.custom.author = "self";
      return this;
    }
  }

  class Tool extends on(Node) `mixin`(ToolHierarchy) {
    constructor(opt) {
      super("tool", opt);
      this.custom.author = "self";
      return this;
    }
  }



  return {
    Domain,
    Data,
    Tool
  }

}));

