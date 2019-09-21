const scopedEval = require('./statics/browserify/eval.js');

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
  let result = global.$__logs__$;
  for (let i = 0; i < result.length; i++) {
    result[i] = Array.from(result[i]);
  }
  global.$__logs__$ = [];
  return result;
};

module.exports = Executor;
