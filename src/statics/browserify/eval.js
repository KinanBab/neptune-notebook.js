// Store all scopes
const scopes = {};

// creates the function without a closure (in global scope)
// protects the scope of this file and other neptune files from interferance from inside eval
new Function(
  'eval("' +
    // Quine for scoping evals
    // Simplified fiddle to help understand why this quine is useful: https://jsfiddle.net/kjvo6h2x/
    'function $__eval__$($__code__$) {' +
      'eval($__code__$);' +
      'eval($__eval__$.toString());' +
      'return $__eval__$;' +
    '}' +
    // Expose Quine to all scripts
    'window.$__eval__$ = $__eval__$;' +
  '");'
)();

// determine scope and eval within it!
module.exports = function (codeTag) {
  const options = JSON.parse(codeTag.dataset.options);

  let scopeName = options['scope'];
  if (scopeName == null) {
    scopeName = '$__DEFAULT__$';
  }

  // create empty scope if it does not exist
  if (scopes[scopeName] == null) {
    scopes[scopeName] = window.$__eval__$;
  }

  // eval within scope
  scopes[scopeName] = scopes[scopeName](codeTag.textContent);
};
