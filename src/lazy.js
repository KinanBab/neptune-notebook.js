const Document = require('./document.js');

function LazyDocument(name, path) {
  this.name = name;
  this.path = path;
}

// inherit all methods of Document, but preamble every method by creating the document first!
for (const method of Object.keys(Document.prototype)) {
  LazyDocument.prototype[method] = function () {
    const document = new Document(this.name, this.path);
    return Document.prototype[method].apply(document, arguments);
  }
}

module.exports = LazyDocument;


