const nunjucks = require('nunjucks');
const fs = require('fs');

const neptuneCSS = fs.readFileSync(__dirname + '/statics/neptune.css', 'UTF8');
const prismCSS = fs.readFileSync(__dirname + '/statics/prism.css', 'UTF8');
const neptuneJS = fs.readFileSync(__dirname + '/statics/neptune.js', 'UTF8');
const prismJS = fs.readFileSync(__dirname + '/statics/prism.js', 'UTF8');

function Renderer(title, contentHtml) {
  this.title = title;
  this.contentHtml = contentHtml;
}

Renderer.prototype.render = function (isOffline=undefined) {
  return nunjucks.render('template.html', {
    title: this.title,
    contentHtml: this.contentHtml,
    isOffline: isOffline,
    // dump CSS and JS dependencies into file
    neptuneCSS: neptuneCSS,
    prismCSS: prismCSS,
    neptuneJS: neptuneJS,
    prismJS: prismJS
  });
};

module.exports = Renderer;
