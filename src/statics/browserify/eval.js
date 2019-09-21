// Store all scopes
const scopes = {};

// creates the function without a closure (in global scope)
// protects the scope of this file and other neptune files from interferance from inside eval
const $__eval__$ = new Function(
  'return eval("' +
    // Quine for scoping evals
    // Simplified fiddle to help understand why this quine is useful: https://jsfiddle.net/kjvo6h2x/
    'var $__eval__$;' +
    '$__eval__$ = function $__eval__$($__code__$) {' +
      'eval($__code__$);' +
      'eval($__eval__$.toString());' +
      'return $__eval__$;' +
    '};' + // function is returned by this statement
  '");'
)();

const logMiddlewareBrowser = function (tabID) {
  return 'var Console = document.getElementById(\''+tabID+'-output\').Console;';
}

const logMiddlewareServer = 'var Console = {};' +
  'Console.log = function () {' +
    'global.$__logs__$.push(arguments);' +
  '};';

// determine scope and eval within it!
module.exports = function (code, scopeName, tabID) {
  code = (tabID ? logMiddlewareBrowser(tabID) : logMiddlewareServer) + code;

  if (scopeName == null) {
    scopeName = '$__DEFAULT__$';
  }

  // create empty scope if it does not exist
  if (scopes[scopeName] == null) {
    scopes[scopeName] = $__eval__$;
  }

  // eval within scope
  scopes[scopeName] = scopes[scopeName](code);
};
