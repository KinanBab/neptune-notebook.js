const express = require('express');
const http = require('http');
const nunjucks = require('nunjucks');

const Document = require('./document.js');
const LazyDocument = require('./lazy.js');

function Neptune() {
  this.documents = {};
}

Neptune.prototype.renderDocument = function (name, path, autoRefresh=false) {
  if (autoRefresh) {
    this.documents[name] = new LazyDocument(name, path);
  } else {
    this.documents[name] = new Document(name, path);
  }
};

Neptune.prototype.start = function (port=80) {
  // configure express
  const app = express();
  nunjucks.configure(__dirname + '/templates/', {
    autoescape: true,
    express: app
  });

  // add routes for every document
  console.log('Routes/Documents:');
  for (const [name, document] of Object.entries(this.documents)) {
    console.log('\thttp://localhost:' + port + '/' + name);
    app.get('/'+name, (function (document, request, response) {
      document.render(response);
    }).bind(this, document));
  }

  // serve static files
  app.use('/static', express.static(__dirname + '/statics/'));

  // listen
  const server = http.createServer(app);
  server.listen(port, function () {
    console.log('');
    console.log('Started neptune!');
  });
};

module.exports = Neptune;
