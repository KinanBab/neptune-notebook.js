var Neptune = require('../src/neptune.js');

// Run a neptune server
var neptune = new Neptune();
neptune.addDocument('test', __dirname + '/test.md', true, ['injected.js'], ['injected.css'], ['injected.html']);
neptune.start(8080);

// Optional: Dump output as HTML
neptune.writeHTML('test', 'output/test.html');
