/*
 * Handles scoped evaluation of user code.
 * Uses eval within function closures to isolate the different scope and persist eval variables
 * and scope after execution in case the scope must be re-used!
 *
 * Code running inside eval has access to the following global variables:
 *   Constants: $__scopes__$, $__logMiddlewareBrowser__$, $__logMiddlewareServer__$
 *   Variables: $__eval__$, $__code__$, Console
 *   Browser-only: require, module, exports from browserify.
 * It is unsafe to modify any of these variables inside user code. Console should be used to log outputs to the UI.
 *
 * User code that uses 'let' or 'const' causes eval to use strict mode, and scope the executed code further using code blocks
 * in a way that our function-closures scoping mechanism cannot handle properly. Such user code will run properly if it is in
 * a stand-alone code block, but variables defined in it will not be visible to other code blocks (or re-runs of the same code
 * block), even if they are configured to have the same scope!
 */

// Store all scopes
const $__scopes__$ = {};

// creates the function without a closure (in global scope)
// protects the scope of this file and other neptune files from interferance from inside eval
const $__eval__$ = function $__eval__$(Console, $__code__$) {
  // Quine for scoping evals: relies on function closures to return a handler to the scope after an eval is executed!
  // Simplified fiddle to help understand why this quine is useful: https://jsfiddle.net/kjvo6h2x/
  try {
    eval($__code__$);
    eval($__eval__$.toString());
    return $__eval__$;
  } catch (exception) {
    Console.log(exception);
    return $__eval__$;
  }
};

const $__logMiddlewareBrowser__$ = function (tabID) {
  return document.getElementById(tabID+'-output').Console;
}

const $__logMiddlewareServer__$ = function () {
  const Console = {};
  Console.log = function () {
    global.$__logs__$.push(arguments);
  };
  return Console;
}

// determine scope and eval within it!
module.exports = function (code, scopeName, tabID) {
  const Console = tabID ? $__logMiddlewareBrowser__$(tabID) : $__logMiddlewareServer__$();

  if (scopeName == null) {
    scopeName = '$__DEFAULT__$';
  }

  // create empty scope if it does not exist
  if ($__scopes__$[scopeName] == null) {
    $__scopes__$[scopeName] = $__eval__$;
  }

  // eval within scope
  $__scopes__$[scopeName] = $__scopes__$[scopeName](Console, code);
};
