// format arguments as if console.log
module.exports = function () {
  var msg = '';

  // loop over arguments and format each
  for (var i = 0; i < arguments.length; i++) {
    // argument is an error: display error name and stack information if available
    if (arguments[i] instanceof Error) {
      msg += arguments[i].toString();

      // vendo-specific error API
      if (arguments[i].lineNumber) {
        msg += '\t' + arguments[i].lineNumber;
        if (arguments[i].columnNumber) {
          msg += ':' + arguments[i].columnNumber;
        }
      }
      if (arguments[i].stack) {
        var stackStr = arguments[i].stack.toString().split('\n').join('\n\t\t');
        msg += '\nStack:\t' + stackStr;
      }

      msg += '\n';
    } else if (typeof(arguments[i]) === 'object') {
      // Object, use JSON
      msg += JSON.stringify(arguments[i]) + ' ';
    } else {
      // Primitive type, use toString
      msg += arguments[i].toString() + ' ';
    }
  }

  return msg;
};
