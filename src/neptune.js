const express = require('express');
const http = require('http');
const nunjucks = require('nunjucks');

const Document = require('./document.js');
const LazyDocument = require('./lazy.js');
const Executor = require('./executor.js');

function Neptune() {
  this.documents = {};
  this.executor = new Executor();

  // configure express
  this.app = express();
  this.app.use(express.json());
  nunjucks.configure(__dirname + '/templates/', {
    autoescape: true,
    express: this.app
  });
}

Neptune.prototype.addDocument = function (name, path, autoRefresh=false, injectedJS=[], injectedCSS=[], injectedHTML=[]) {
  if (autoRefresh) {
    this.documents[name] = new LazyDocument(name, path, injectedJS, injectedCSS, injectedHTML);
  } else {
    this.documents[name] = new Document(name, path, injectedJS, injectedCSS, injectedHTML);
  }
};

Neptune.prototype.writeHTML = function (name, path) {
  this.documents[name].writeHTML(path);
};

Neptune.prototype.start = function (port=80) {
  const that = this;

  // add routes for every document
  console.log('Routes/Documents:');
  for (const [name, document] of Object.entries(this.documents)) {
    console.log('\thttp://localhost:' + port + '/document/' + name);

    // route for rendering
    this.app.get('/document/'+name, (function (document, request, response) {
      response.send(document.render());
    }).bind(this, document));

    // route for server-side execution requests!
    this.app.post('/document/'+name+'/__exec', function (request, response) {
      const code = request.body.code;
      const scopeName = request.body.scopeName;
      response.json(that.executor.execute(code, scopeName));
    });
  }

  // serve static files
  this.app.use('/static', express.static(__dirname + '/statics/'));

  // listen
  this.server = http.createServer(this.app);
  this.server.listen(port, function () {
    console.log('');
    console.log('Started neptune!');
  });
};

Neptune.prototype.stop = function () {
  this.server.close(function () {
    console.log('Stopped neptune!');
  });
};

module.exports = Neptune;
