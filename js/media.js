/**
 * const media = new Media({
 *  type: "file" | "md",
 *  content: url | markdown string
 * })
 * 
 * const modalWindowContent = media.getHTML()
 */

(function (root, factory) {

  if (typeof define === "function" && define.amd) {
    define(["../../jslib/marked.min", "../../node_modules/asciidoctor.js/dist/asciidoctor"], factory);
  } else if (typeof exports === "object") {

    module.exports = factory();

  } else {
    root.Media = factory(root.marked, root.Asciidoctor);
  }

})(this, function (_marked, _Asciidoctor) {

  let marked;
  if (typeof require === 'undefined' && typeof _marked === 'function') {
    marked = _marked;
  } else {
    marked = require("../../jslib/marked.min.js");
  }

  let asciidoctor;
  if (typeof require === 'undefined' && typeof _Asciidoctor === 'function') {
    asciidoctor = _Asciidoctor(true);
  } else {
    asciidoctor = require("../../node_modules/asciidoctor.js/dist/asciidoctor.js")(true);
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


  class Media {
    constructor() {

    }

    getHTML() {
      const self = this;

      const jobs = this.contents
        .map((c) => c.parse(5000))

      return new Promise((res, rej) => {
        Promise.all(jobs)
          .then((results => res(results)))
          .catch((err) => rej(err))
      })
    }


    parse(timeout) {
      const self = this;
      return new Promise((res, rej) => {
        self.load().then(self.parser).then(res).catch(rej)

        //res(self.load().then(self.parser))

        if (timeout) {
          const e = new Error("Parser timed out");
          setTimeout(res, timeout, e);
        }
      })
    }

    setContents(input) {
      const source = (Array.isArray(input)) ? input : [input];

      const contents = source.map((string) => {
        if (string.match(/^.*\.(md|pdf|html|adoc)(\#page\=\d+)?$/)) {
          return new ExternalFile(string);
        } else {
          return new Literal(string);
        }
      })
      this.contents = contents;
      return this;
    }

    /*
    register(id) {
      Media.registerContents(id, this.url)
    }
  
    static registerContents(id, content) {
      Media.list.push({ id: id, contents: content })
    }
    */

    static parseMarkdown(string) {
      return new Promise((res, rej) => {
        res(marked(string))
      })

    }

    static parseHtml(string) {
      return new Promise((res, rej) => {
        let html = `<iframe src="${string}"></iframe>`
        res(html)
      })
    }

    static parsePdf(string) {
      return new Promise((res, rej) => {
        let html = `<object data="${string}" type="application/pdf">
        
      </object>`
        res(html)
      })
    }

    static parseAsciidoc(string) {

      const opts = {
        "base_dir": "./",
        "safe": 0,
        "doctype": "book",
        "attributes": "showtitle"
      }

      const convert = function (string, opts, timeout) {
        return new Promise((res, rej) => {
          res(asciidoctor.convert(string, opts))
          if (timeout) {
            const e = new Error("Asciidoctor timed out");
            setTimeout(rej, timeout, e);
          }

        })
      }

      /*
      const opts = Opal.hash2(["base_dir", "safe", "doctype", "attributes"], {
        "base_dir": "./",
        "safe": 0,
        "doctype": "book",
        "attributes": "showtitle"
      })
      */

      return new Promise((res, rej) => {
        convert(string, opts, 5000).then(res).catch(rej);
      })
    }

  }

  class Literal extends Media {
    constructor(string) {
      super();
      this.string = string;
      this.url = null;

      if (string.match(/(^=+\s|\n+=+\s)/)) {
        this.load = Literal.loader.bind(this);
        this.parser = Media.parseAsciidoc;
      } else {
        this.load = Literal.loader.bind(this);
        this.parser = Media.parseMarkdown;
      }

      return this;
    }

    static loader() {
      const self = this;
      return new Promise((res, rej) => {
        return res(self.string);
      })
    }


  }


  class ExternalFile extends Media {
    constructor(url) {
      super()
      this.url = url;
      if (url.match(/\.pdf(\#page\=\d+)?$/)) {
        this.parser = Media.parsePdf;
        this.string = url;
        this.load = Literal.loader.bind(this);
      } else if (url.match(/\.md$/)) {
        this.parser = Media.parseMarkdown;
        this.load = ExternalFile.loader.bind(this);
      } else if (url.match(/\.html$/)) {
        this.string = url;
        this.parser = Media.parseHtml;
        this.load = Literal.loader.bind(this);
      } else if (url.match(/\.adoc$/)) {
        this.parser = Media.parseAsciidoc;
        this.load = ExternalFile.loader.bind(this);
      } else {
        throw new Error("File type error. (Only .md, .adoc, .html, .pdf)")
      }
    }

    static loader() {
      const self = this;
      return new Promise((res, rej) => {
        fetchWrapper(self.url, null, 10000)
          .then((response => {
            if (response.ok) {
              res(response.text())
            } else {
              rej(`ERROR: URL [${self.url}] is not found !`)
            }

          }))
          .catch(rej)

      })
    }

  }

  return Media;

})
