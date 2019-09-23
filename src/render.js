const nunjucks = require('nunjucks');
const fs = require('fs');

function Renderer(title, contentHtml, injectedJS, injectedCSS, injectedHTML) {
  this.title = title;
  this.contentHtml = contentHtml;
  this.injectedJS = injectedJS;
  this.injectedCSS = injectedCSS;
  this.injectedHTML = injectedHTML;
}

Renderer.prototype.render = function (isOffline=undefined) {
  const neptuneCSS = fs.readFileSync(__dirname + '/statics/neptune.css', 'UTF8');
  const prismCSS = fs.readFileSync(__dirname + '/statics/prism.css', 'UTF8');
  const neptuneJS = fs.readFileSync(__dirname + '/statics/neptune.js', 'UTF8');
  const prismJS = fs.readFileSync(__dirname + '/statics/prism.js', 'UTF8');

  return nunjucks.render('template.html', {
    title: this.title,
    contentHtml: this.contentHtml,
    isOffline: isOffline,
    // dump CSS and JS dependencies into file
    neptuneCSS: neptuneCSS,
    prismCSS: prismCSS,
    neptuneJS: neptuneJS,
    prismJS: prismJS,
    // any injected JS/CSS code
    injectedJS: this.injectedJS,
    injectedCSS: this.injectedCSS,
    injectedHTML: this.injectedHTML
  });
};

module.exports = Renderer;
