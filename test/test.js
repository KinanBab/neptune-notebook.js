var Neptune = require('../src/neptune.js');

var neptune = new Neptune();
neptune.renderDocument('test', __dirname + '/test.md', true);
neptune.start();
