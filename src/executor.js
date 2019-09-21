const scopedEval = require('./statics/browserify/eval.js');

function Executor() {
  this.eval = scopedEval;
}

Executor.prototype.execute = function (code, scopeName) {
  this.eval(code, scopeName);
  return {msg: 'OK!'};
};

module.exports = Executor;
