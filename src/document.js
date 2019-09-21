const Renderer = require('./render.js');

const fs = require('fs');
const path = require('path');
const showdown = require('showdown');

const converter = new showdown.Converter();

function Document(title, path) {
  this.title = title;

  const content = fs.readFileSync(path, 'UTF8');
  this.contentHtml = converter.makeHtml(content);

  this.renderer = new Renderer(this.title, this.contentHtml);
  this.HTML = this.renderer.render();
}

Document.prototype.render = function () {
  return this.HTML;
};

Document.prototype.writeHTML = function (fpath) {
  const dpath = path.dirname(fpath);
  fs.mkdirSync(dpath, {recursive: true});
  fs.writeFileSync(fpath, this.renderer.render(true));
};

module.exports = Document;
