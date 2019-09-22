const scopedEval = require('./statics/browserify/eval.js');
const formatter = require('./statics/browserify/formatter.js');

function Executor() {
  this.eval = scopedEval;
}

Executor.prototype.execute = function (code, scopeName) {
  // store logs
  if (!global.$__logs__$) {
    global.$__logs__$ = [];
  }

  // eval
  this.eval(code, scopeName);

  // return logs for rendering
  let result = global.$__logs__$.map(args => formatter.apply(null, args));
  global.$__logs__$ = [];
  return result;
};

module.exports = Executor;
