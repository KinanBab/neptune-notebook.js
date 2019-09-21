const express = require('express');
const http = require('http');
const nunjucks = require('nunjucks');

const Document = require('./document.js');
const LazyDocument = require('./lazy.js');
const Executor = require('./executor.js');

function Neptune() {
  this.documents = {};
  this.executor = new Executor();
}

Neptune.prototype.renderDocument = function (name, path, autoRefresh=false) {
  if (autoRefresh) {
    this.documents[name] = new LazyDocument(name, path);
  } else {
    this.documents[name] = new Document(name, path);
  }
};

Neptune.prototype.start = function (port=80) {
  const that = this;

  // configure express
  const app = express();
  app.use(express.json());
  nunjucks.configure(__dirname + '/templates/', {
    autoescape: true,
    express: app
  });

  // add routes for every document
  console.log('Routes/Documents:');
  for (const [name, document] of Object.entries(this.documents)) {
    console.log('\thttp://localhost:' + port + '/document/' + name);

    // route for rendering
    app.get('/document/'+name, (function (document, request, response) {
      document.render(response);
    }).bind(this, document));

    // route for server-side execution requests!
    app.post('/document/'+name+'/__exec', function (request, response) {
      const code = request.body.code;
      const scopeName = request.body.scopeName;
      response.json(that.executor.execute(code, scopeName));
    });
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
