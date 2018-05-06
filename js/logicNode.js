
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

  let Node;

  if (typeof require === "undefined" && typeof _Node === "function") {
    Node = _Node;
  } else {
    Node = require('./node.js');

  }

  let mixinModule;

  if (typeof require === "undefined" && typeof _mixinModule === "object") {
    mixinModule = _mixinModule;
  } else {
    mixinModule = require('./mixin.js');

  }

  const on = mixinModule.on;
  const mixin = mixinModule.mixin;


  class LogicProps {
    constructor(author = "", bibtex = "") {
      this.author = author;
      this.bibtex = bibtex;
    }

    setAuthor(author) {
      this.author = author;
    }

    setBibtex(fmt) {
      this.bibtex = fmt;
    }
  }


  const Fact = {
    getChildren() {
      return [];
    },

    setChildren() {
      throw new Error("Fact does not have children !");
    }
  }



  const Model = {
    assuming(premises) {
      this.setChildren(premises, "assuming");
      return this;
    },

    basedOn(theorum) {
      this.setChildren(theorum, "based on");
      return this;
    },

    composedOf(models) {
      this.setChildren(models, "composed of");
      return this;
    },

    appliedTo(facts) {
      this.setChildren(facts, "applied to");
      return this;
    }
  }

  const Inference = {
    becauseOf(nodes) {
      this.setChildren(nodes, "because of");
      return this;
    },

    consistentWith(facts) {
      this.setChildren(facts, "consistent with");
      return this;
    },

    supportedBy(nodes) {
      this.setChildren(nodes, "supported by");
      return this;
    },

    estimatedBy(models) {
      this.setChildren(models, "estimated by");
      return this;
    },

    exceptingFor(nodes) {
      this.setChildren(nodes, "excepting for");
      return this;
    },

    indicatedBy(nodes) {
      this.setChildren(nodes, "indicated by");
      return this;
    },

    assuming(premises) {
      this.setChildren(premises, "assuming");
      return this;
    },

    extendingOn(references) {
      this.setChildren(references, "extending on");
      return this;
    }

  }



  class SelfNode extends Node {
    constructor(_type, opt) {
      super(_type, opt);
      this.custom = new LogicProps("self");
      return this;
    }


  }

  class MyData extends on(SelfNode) `mixin`(Fact) {
    constructor(opt) {
      super("data", opt);
      return this;
    }
  }

  class MyModel extends on(SelfNode) `mixin`(Model) {
    constructor(opt) {
      super("model", opt);
      return this;
    }
  }

  class MyInference extends on(SelfNode) `mixin`(Inference) {
    constructor(opt) {
      super("inference", opt);
      return this;
    }

  }

  class MyPremise extends on(SelfNode) `mixin`(Inference) {
    constructor(opt) {
      super("premise", opt);
      return this;
    }
  }

  class RefNode extends Node {
    constructor(_type, opt) {
      super(_type, opt);
      this.custom = new LogicProps(
        (opt instanceof Object && opt.hasOwnProperty("author")) ? opt.author : "other"

      )
      return this;
    }

    setAuthor(author) {
      this.custom.setAuthor(author);
      return this;
    }

    setChildren(nodes, relation) {

      let children = nodes.filter((node) => (node instanceof (RefNode)));


      if (nodes.length !== children.length) throw new Error("Self node cannot become child of Ref node");

      super.setChildren(children, relation)
    }


    /*
        Referenceのペーパータイトル，ページ，図表番号等
    */
    setBiBTeX(bibtex) {
      this.custom.setBibtex(bibtex);
      return this;
    }
  }

  class RefData extends on(RefNode) `mixin`(Fact) {
    constructor(opt) {
      super("data", opt);
      return this;
    }
  }

  class RefModel extends on(RefNode) `mixin`(Model) {
    constructor(opt) {
      super("model", opt);
      return this;
    }
  }

  class Premise extends on(RefNode) `mixin`(Inference) {
    constructor(opt) {
      super("premise", opt);
      return this;
    }
  }

  class RefInference extends on(RefNode) `mixin`(Inference) {
    constructor(opt) {
      super("inference", opt);
      return this;
    }

  }

  class Theory extends on(RefNode) `mixin`(Fact) {
    constructor(opt) {
      super("theory", opt);
      return this;
    }
  }

  return {
    MyModel: MyModel,
    MyData: MyData,
    MyInference: MyInference,
    MyPremise: MyPremise,
    RefData: RefData,
    RefInference: RefInference,
    RefModel: RefModel,
    Premise: Premise,
    Theory: Theory
  }

}));

