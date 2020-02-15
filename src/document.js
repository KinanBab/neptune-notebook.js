const Renderer = require('./render.js');

const fs = require('fs');
const path = require('path');
const showdown = require('showdown');
const fsutil = require('./fsutil.js');
const decomment = require('decomment');

const converter = new showdown.Converter();

function Document(title, path, injectedJS, injectedCSS, injectedHTML, _decomment) {
  this.title = title;

  const content = fs.readFileSync(path, 'UTF8');
  this.contentHtml = converter.makeHtml(content);

  const readAndConcat = function (array, _decomment=false) {
    return array.map(function (path) {
      const content = fs.readFileSync(path, 'UTF8');
      return _decomment ? decomment(content) : content;
    }).reduce(function (str, fileContent) {
      return str + fileContent + '\n';
    }, '');
  };

  injectedJS = readAndConcat(injectedJS, _decomment);
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
  fsutil.mkdirp(dpath);
  fs.writeFileSync(fpath, this.renderer.render(true));
};

module.exports = Document;
