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
  const neptuneJS = fs.readFileSync(__dirname + '/statics/neptune.js', 'UTF8');
  const codemirrorJS = fs.readFileSync(__dirname + '/statics/codemirror/codemirror.js', 'UTF8');
  const codemirrorCSS = fs.readFileSync(__dirname + '/statics/codemirror/codemirror.css', 'UTF8');
  const codemirrorDarculaCSS = fs.readFileSync(__dirname + '/statics/codemirror/darcula.css', 'UTF8');
  const codemirrorModeJS = fs.readFileSync(__dirname + '/statics/codemirror/javascript.js', 'UTF8');
  const codemirrorModeCSS = fs.readFileSync(__dirname + '/statics/codemirror/css.js', 'UTF8');
  const codemirrorModeXML = fs.readFileSync(__dirname + '/statics/codemirror/xml.js', 'UTF8');
  const codemirrorModeHTML = fs.readFileSync(__dirname + '/statics/codemirror/htmlmixed.js', 'UTF8');
  const filesaverJS = fs.readFileSync(__dirname + '/statics/filesaver/FileSaver.min.js', 'UTF8');

  return nunjucks.render('template.html', {
    title: this.title,
    contentHtml: this.contentHtml,
    isOffline: isOffline,
    // dump CSS and JS dependencies into file
    neptuneCSS: neptuneCSS,
    neptuneJS: neptuneJS,
    codemirrorJS: codemirrorJS,
    codemirrorCSS: codemirrorCSS,
    codemirrorDarculaCSS: codemirrorDarculaCSS,
    codemirrorModeJS: codemirrorModeJS,
    codemirrorModeCSS: codemirrorModeCSS,
    codemirrorModeXML: codemirrorModeXML,
    codemirrorModeHTML: codemirrorModeHTML,
    filesaverJS: filesaverJS,
    // any injected JS/CSS code
    injectedJS: this.injectedJS,
    injectedCSS: this.injectedCSS,
    injectedHTML: this.injectedHTML
  });
};

module.exports = Renderer;
