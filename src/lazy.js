const Document = require('./document.js');

function LazyDocument(name, path, injectedJS, injectedCSS, injectedHTML, decomment) {
  this.name = name;
  this.path = path;
  this.injectedJS = injectedJS;
  this.injectedCSS = injectedCSS;
  this.injectedHTML = injectedHTML;
  this.decomment = decomment;
}

// inherit all methods of Document, but preamble every method by creating the document first!
for (const method of Object.keys(Document.prototype)) {
  LazyDocument.prototype[method] = function () {
    const document = new Document(this.name, this.path, this.injectedJS, this.injectedCSS, this.injectedHTML, this.decomment);
    return Document.prototype[method].apply(document, arguments);
  }
}

module.exports = LazyDocument;


