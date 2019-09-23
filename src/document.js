const Renderer = require('./render.js');

const fs = require('fs');
const path = require('path');
const showdown = require('showdown');

const converter = new showdown.Converter();

function Document(title, path, injectedJS, injectedCSS, injectedHTML) {
  this.title = title;

  const content = fs.readFileSync(path, 'UTF8');
  this.contentHtml = converter.makeHtml(content);

  const readAndConcat = function (array) {
    return array.map(function (path) {
      return fs.readFileSync(path, 'UTF8');
    }).reduce(function (str, fileContent) {
      return str + fileContent + '\n';
    }, '');
  };

  injectedJS = readAndConcat(injectedJS);
  injectedCSS = readAndConcat(injectedCSS);
  injectedHTML = readAndConcat(injectedHTML);

  this.renderer = new Renderer(this.title, this.contentHtml, injectedJS, injectedCSS, injectedHTML);
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
