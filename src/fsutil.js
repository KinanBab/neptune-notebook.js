const path = require('path');
const fs = require('fs');

// equivalent to `$ mkdir -p`
// or `fs.mkdirSync(path, {recursive: true});`
// but runs on older versions of node without recursive support!
function mkdirp(dir) {
  if (!fs.existsSync(dir)) {
    mkdirp(path.dirname(dir));
    fs.mkdirSync(dir);
  }
}


module.exports = {
  mkdirp: mkdirp
};
