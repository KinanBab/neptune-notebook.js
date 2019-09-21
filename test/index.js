var Neptune = require('../src/neptune.js');

var neptune = new Neptune();
neptune.addDocument('test', __dirname + '/test.md', true);
neptune.addDocument('tutorial', __dirname + '/tutorial.md', false);
neptune.start(8080);

neptune.writeHTML('test', 'output/test.html');
neptune.writeHTML('tutorial', 'output/tutorial.html');
