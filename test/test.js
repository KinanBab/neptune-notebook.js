var neptune = require('../src/index.js');

var notebook = new neptune();
notebook.renderDocument('test', __dirname + '/test.md');
notebook.start();
