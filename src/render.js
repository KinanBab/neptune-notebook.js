function Renderer(title, contentHtml) {
  this.title = title;
  this.contentHtml = contentHtml;
}

Renderer.prototype.render = function (response) {
  response.render('template.html', {
    title: this.title,
    contentHtml: this.contentHtml
  });
};

module.exports = Renderer;
