const fs = require('fs');
const showdown = require('showdown');

const Renderer = require('./render.js');

const converter = new showdown.Converter();

function Document(title, path) {
  this.title = title;

  const content = fs.readFileSync(path, 'UTF8');
  this.contentHtml = converter.makeHtml(content);
  this.renderer = new Renderer(this.title, this.contentHtml);
}

Document.prototype.render = function (response) {
  this.renderer.render(response);
};

module.exports = Document;
