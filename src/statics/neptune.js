(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* global Prism */

// bind input to the textarea to the code tag
const codeInputHandler = function (codeTag, textAreaTag) {
  textAreaTag.scrollTop = 0;
  let code = textAreaTag.value;

  codeTag.innerHTML = code + ' ';
  Prism.highlightElement(codeTag);
};

// creates a transparent textarea that serves as an 'editor' for the code in
// the associated <code> tag
module.exports = function (codeTag) {
  codeTag.innerHTML += ' ';

  const element = document.createElement('textarea');
  element.classList.add('code-editor');
  element.setAttribute('spellcheck', 'false');

  // expose handler for input binding
  element.handler = codeInputHandler.bind(null, codeTag, element);

  // listen to any input changes
  if (element.addEventListener) {
    element.addEventListener('input', element.handler);
  } else if (element.attachEvent) { // for IE11
    element.attachEvent('onpropertychange', element.handler);
  }

  // put code in textarea
  element.value = codeTag.textContent;

  return element;
};

},{}],2:[function(require,module,exports){
(function (global){
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
(function () {
  const Tabs = require('./tabs.js');

  /*
   * Detect <pre> and <code> tags of interest
   */
  const preTags = Array.from(document.getElementsByTagName('pre'));
  const codeTags = preTags.map(function (preTag) {
    return Array.from(preTag.getElementsByTagName('code'));
  }).reduce(function (codeTags1, codeTags2) {
    return codeTags1.concat(codeTags2);
  }, []).filter(function (codeTag) {
    return codeTag.className.indexOf('language-neptune') > -1;
  });

  /*
   * Helper functions
   */
  const getOptions = function (codeTag) {
    const defaultOptions = {
      title: 'Javascript',
      env: 'browser'
    };

    // result
    const options = Object.assign({}, defaultOptions);
    const addOption = function (key, val) {
      options[key] = val;

      if (key === 'env' && options['title'] === defaultOptions['title']) {
        options['title'] = val;
      }
    };

    // parse options
    for (let className of codeTag.classList) {
      className = className.trim();
      if (!className.startsWith('neptune') || className.indexOf('[') === -1) {
        continue;
      }

      className = className.substring(('neptune[').length, className.length-1);
      className.split(',').map(function (option) {
        const index = option.indexOf('=');
        const key = option.substring(0, index);
        const val = option.substring(index + 1);
        addOption(key, val);
      });
    }

    return options;
  };

  const styleCodeBlock = function (codeTag) {
    const preTag = codeTag.parentNode;

    // get neptune code options from markdown
    const options = getOptions(codeTag);
    codeTag.dataset.options = JSON.stringify(options);

    // Make sure PRISM understands that this is JS
    codeTag.className = 'language-javascript';
    preTag.className = 'language-javascript';
    preTag.classList.add('line-numbers'); // add line numbering

    // Style code as a tabbed frame with a toolbar and editor!
    Tabs(preTag, codeTag);
  };

  /*
   * Apply styling and functionality
   */
  codeTags.map(function (codeTag) {
    styleCodeBlock(codeTag);
  });
})();

},{"./tabs.js":7}],5:[function(require,module,exports){
/* global Prism */

const formatter = require('./formatter.js');

function reset() {
  this.style.display = 'block';
  this.children[0].innerHTML = 'Running...';
}

function display(output) {
  if (this.children[0].textContent === 'Running...') {
    this.children[0].innerHTML = '';
  } else {
    this.children[0].innerHTML += '\n';
  }

  this.children[0].innerHTML += output;
  Prism.highlightElement(this.children[0]);
}

// mimic console.log / console.time / etc
const Console = {
  // this here is bound to the output panel HTML element
  log: function () {
    console.log.apply(console, arguments);
    this.display(formatter.apply(null, arguments));
  }
};

// creates a transparent textarea that serves as an 'editor' for the code in
// the associated <code> tag
module.exports = function (tabID, options) {
  // create pre tag
  const preElement = document.createElement('pre');
  preElement.id = tabID + '-output';
  preElement.classList.add('command-line');
  preElement.classList.add('output-panel');

  preElement.dataset.user = options['title'].toLowerCase();
  preElement.dataset.host = options['env'].toLowerCase();

  // create code tag
  const codeElement = document.createElement('code');
  codeElement.className = 'language-bash';
  preElement.appendChild(codeElement);

  // bind logging functions to output panel HTML element
  preElement.reset = reset.bind(preElement);
  preElement.display = display.bind(preElement);
  preElement.Console = {};
  for (const attr in Console) {
    preElement.Console[attr] = Console[attr].bind(preElement);
  }

  return preElement;
};

},{"./formatter.js":3}],6:[function(require,module,exports){
// Execute this code using in the given scope name in the server via node, and get back results!
module.exports = function (code, scopeName, tabID) {
  if (window.$__offline__$) {
    alert('Cannot execute server-side code while offline!');
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open('POST', window.location.href + '/__exec');
  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const outputPanel = document.getElementById(tabID + '-output');
      for (const record of JSON.parse(xhr.responseText)) {
        outputPanel.Console.log(record);
      }
    }
  };
  xhr.send(JSON.stringify({scopeName: scopeName, code: code}));
};

},{}],7:[function(require,module,exports){
/*
 * dependencies
 */
const Toolbar = require('./toolbar.js');
const Editor = require('./editor.js');
const OutputPanel = require('./outputPanel.js');

let autoCounter = 0;

const createTab = function (title, tabsContainer, preTag, options) {
  const tabRadio = document.createElement('input');
  const tabLabel = document.createElement('label');
  const codeTab = document.createElement('div');

  // create ID for radio
  const count = tabsContainer.getElementsByTagName('input').length;
  const tabID = tabsContainer.id + '-tab-' + (count + 1);

  // style lable and radio
  tabRadio.className = 'tab-input';
  tabRadio.id = tabID;
  tabRadio.name = tabsContainer.id;
  tabRadio.type = 'radio';

  tabLabel.className = 'tab-label';
  tabLabel.id = tabID + '-label';
  tabLabel.setAttribute('for', tabID);
  tabLabel.innerHTML = title;
  if (count === 0) {
    tabRadio.setAttribute('checked', 'checked');
    tabLabel.classList.add('tab-label-selected');
    tabsContainer.dataset.selected = tabID;
  }

  tabRadio.onclick = function (e) {
    // remove selection from previous label
    const lastVal = tabsContainer.dataset.selected;
    const prevLabel = document.getElementById(lastVal + '-label');
    prevLabel.classList.remove('tab-label-selected');
    // select this label
    tabsContainer.dataset.selected = tabID;
    tabLabel.classList.add('tab-label-selected');
  };

  // style container
  codeTab.classList.add('code-tab');

  // add toolbar and <pre> tag and output area
  codeTab.appendChild(Toolbar(tabID));
  codeTab.appendChild(preTag);
  codeTab.appendChild(OutputPanel(tabID, options));

  // add the code container to the tabs
  tabsContainer.insertBefore(tabLabel, tabsContainer.children[count]);
  tabsContainer.appendChild(tabRadio);
  tabsContainer.appendChild(codeTab);
};

const createTabsContainer = function (frameID) {
  const container = document.createElement('div');
  container.id = frameID;
  container.classList.add('code-tabs');
  return container;
};

const getOrCreateTabsContainer = function (frameID, preTag) {
  frameID = frameID || 'neptune-frame-' + (autoCounter++);
  let container = document.getElementById(frameID);

  if (container == null) {
    container = createTabsContainer(frameID);
    preTag.parentNode.replaceChild(container, preTag);
  } else {
    preTag.parentNode.removeChild(preTag);
  }

  return container;
};

module.exports = function (preTag, codeTag) {
  // Parse options from markdown
  const options = JSON.parse(codeTag.dataset.options);
  const frameID = options['frame'];
  const title = options['title'];

  // Create (or get if exists) the tabs frame container
  const tabsContainer = getOrCreateTabsContainer(frameID, preTag);

  // Add this <pre><code> tags as a tab to the container
  createTab(title, tabsContainer, preTag, options);

  // add transparent text area that mimics the code tag
  preTag.appendChild(Editor(codeTag));
};

},{"./editor.js":1,"./outputPanel.js":5,"./toolbar.js":8}],8:[function(require,module,exports){
const scopedEval = require('./eval.js');
const serverExec = require('./serverExec.js');

// handles clicking on an icon in the code toolbar
const toolbarClick = function () {
  const tabID = this.parentNode.dataset.tabID;
  const type = this.children[0].classList[1].split('-')[1];
  const codeTag = this.parentNode.parentNode.getElementsByTagName('code')[0];
  const textAreaTag = this.parentNode.parentNode.getElementsByTagName('textarea')[0];
  const options = JSON.parse(codeTag.dataset.options);
  const outputPanel = document.getElementById(tabID + '-output');

  let range;
  switch (type) {
    case 'copy':
      window.getSelection().removeAllRanges();
      range = document.createRange();
      range.selectNode(codeTag);
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      break;

    case 'trash':
      textAreaTag.value = '';
      textAreaTag.handler();
      break;

    case 'play':
      outputPanel.reset();
      if (options['env'] === 'server') {
        serverExec(codeTag.textContent, options['scope'], tabID);
      } else {
        scopedEval(codeTag.textContent, options['scope'], tabID);
      }
      break;
  }
};

// creates HTML elements for the toolbar on top of <code> tags
module.exports = function (tabID, handler=toolbarClick) {
  const element = document.createElement('div');
  element.classList.add('code-toolbar');
  element.dataset.tabID = tabID;
  element.innerHTML = '<a href="javascript:void(0)"><i class="fa fa-play"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-copy"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-trash"></i></a>';

  Array.from(element.children).map(function (aTag) {
    aTag.onclick = handler;
  });

  return element;
};

},{"./eval.js":2,"./serverExec.js":6}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9zdGF0aWNzL2Jyb3dzZXJpZnkvZWRpdG9yLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9ldmFsLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9mb3JtYXR0ZXIuanMiLCJzcmMvc3RhdGljcy9icm93c2VyaWZ5L25lcHR1bmUuanMiLCJzcmMvc3RhdGljcy9icm93c2VyaWZ5L291dHB1dFBhbmVsLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9zZXJ2ZXJFeGVjLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS90YWJzLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS90b29sYmFyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLyogZ2xvYmFsIFByaXNtICovXG5cbi8vIGJpbmQgaW5wdXQgdG8gdGhlIHRleHRhcmVhIHRvIHRoZSBjb2RlIHRhZ1xuY29uc3QgY29kZUlucHV0SGFuZGxlciA9IGZ1bmN0aW9uIChjb2RlVGFnLCB0ZXh0QXJlYVRhZykge1xuICB0ZXh0QXJlYVRhZy5zY3JvbGxUb3AgPSAwO1xuICBsZXQgY29kZSA9IHRleHRBcmVhVGFnLnZhbHVlO1xuXG4gIGNvZGVUYWcuaW5uZXJIVE1MID0gY29kZSArICcgJztcbiAgUHJpc20uaGlnaGxpZ2h0RWxlbWVudChjb2RlVGFnKTtcbn07XG5cbi8vIGNyZWF0ZXMgYSB0cmFuc3BhcmVudCB0ZXh0YXJlYSB0aGF0IHNlcnZlcyBhcyBhbiAnZWRpdG9yJyBmb3IgdGhlIGNvZGUgaW5cbi8vIHRoZSBhc3NvY2lhdGVkIDxjb2RlPiB0YWdcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvZGVUYWcpIHtcbiAgY29kZVRhZy5pbm5lckhUTUwgKz0gJyAnO1xuXG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2NvZGUtZWRpdG9yJyk7XG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdzcGVsbGNoZWNrJywgJ2ZhbHNlJyk7XG5cbiAgLy8gZXhwb3NlIGhhbmRsZXIgZm9yIGlucHV0IGJpbmRpbmdcbiAgZWxlbWVudC5oYW5kbGVyID0gY29kZUlucHV0SGFuZGxlci5iaW5kKG51bGwsIGNvZGVUYWcsIGVsZW1lbnQpO1xuXG4gIC8vIGxpc3RlbiB0byBhbnkgaW5wdXQgY2hhbmdlc1xuICBpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGVsZW1lbnQuaGFuZGxlcik7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC5hdHRhY2hFdmVudCkgeyAvLyBmb3IgSUUxMVxuICAgIGVsZW1lbnQuYXR0YWNoRXZlbnQoJ29ucHJvcGVydHljaGFuZ2UnLCBlbGVtZW50LmhhbmRsZXIpO1xuICB9XG5cbiAgLy8gcHV0IGNvZGUgaW4gdGV4dGFyZWFcbiAgZWxlbWVudC52YWx1ZSA9IGNvZGVUYWcudGV4dENvbnRlbnQ7XG5cbiAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuIiwiLypcbiAqIEhhbmRsZXMgc2NvcGVkIGV2YWx1YXRpb24gb2YgdXNlciBjb2RlLlxuICogVXNlcyBldmFsIHdpdGhpbiBmdW5jdGlvbiBjbG9zdXJlcyB0byBpc29sYXRlIHRoZSBkaWZmZXJlbnQgc2NvcGUgYW5kIHBlcnNpc3QgZXZhbCB2YXJpYWJsZXNcbiAqIGFuZCBzY29wZSBhZnRlciBleGVjdXRpb24gaW4gY2FzZSB0aGUgc2NvcGUgbXVzdCBiZSByZS11c2VkIVxuICpcbiAqIENvZGUgcnVubmluZyBpbnNpZGUgZXZhbCBoYXMgYWNjZXNzIHRvIHRoZSBmb2xsb3dpbmcgZ2xvYmFsIHZhcmlhYmxlczpcbiAqICAgQ29uc3RhbnRzOiAkX19zY29wZXNfXyQsICRfX2xvZ01pZGRsZXdhcmVCcm93c2VyX18kLCAkX19sb2dNaWRkbGV3YXJlU2VydmVyX18kXG4gKiAgIFZhcmlhYmxlczogJF9fZXZhbF9fJCwgJF9fY29kZV9fJCwgQ29uc29sZVxuICogICBCcm93c2VyLW9ubHk6IHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cyBmcm9tIGJyb3dzZXJpZnkuXG4gKiBJdCBpcyB1bnNhZmUgdG8gbW9kaWZ5IGFueSBvZiB0aGVzZSB2YXJpYWJsZXMgaW5zaWRlIHVzZXIgY29kZS4gQ29uc29sZSBzaG91bGQgYmUgdXNlZCB0byBsb2cgb3V0cHV0cyB0byB0aGUgVUkuXG4gKlxuICogVXNlciBjb2RlIHRoYXQgdXNlcyAnbGV0JyBvciAnY29uc3QnIGNhdXNlcyBldmFsIHRvIHVzZSBzdHJpY3QgbW9kZSwgYW5kIHNjb3BlIHRoZSBleGVjdXRlZCBjb2RlIGZ1cnRoZXIgdXNpbmcgY29kZSBibG9ja3NcbiAqIGluIGEgd2F5IHRoYXQgb3VyIGZ1bmN0aW9uLWNsb3N1cmVzIHNjb3BpbmcgbWVjaGFuaXNtIGNhbm5vdCBoYW5kbGUgcHJvcGVybHkuIFN1Y2ggdXNlciBjb2RlIHdpbGwgcnVuIHByb3Blcmx5IGlmIGl0IGlzIGluXG4gKiBhIHN0YW5kLWFsb25lIGNvZGUgYmxvY2ssIGJ1dCB2YXJpYWJsZXMgZGVmaW5lZCBpbiBpdCB3aWxsIG5vdCBiZSB2aXNpYmxlIHRvIG90aGVyIGNvZGUgYmxvY2tzIChvciByZS1ydW5zIG9mIHRoZSBzYW1lIGNvZGVcbiAqIGJsb2NrKSwgZXZlbiBpZiB0aGV5IGFyZSBjb25maWd1cmVkIHRvIGhhdmUgdGhlIHNhbWUgc2NvcGUhXG4gKi9cblxuLy8gU3RvcmUgYWxsIHNjb3Blc1xuY29uc3QgJF9fc2NvcGVzX18kID0ge307XG5cbi8vIGNyZWF0ZXMgdGhlIGZ1bmN0aW9uIHdpdGhvdXQgYSBjbG9zdXJlIChpbiBnbG9iYWwgc2NvcGUpXG4vLyBwcm90ZWN0cyB0aGUgc2NvcGUgb2YgdGhpcyBmaWxlIGFuZCBvdGhlciBuZXB0dW5lIGZpbGVzIGZyb20gaW50ZXJmZXJhbmNlIGZyb20gaW5zaWRlIGV2YWxcbmNvbnN0ICRfX2V2YWxfXyQgPSBmdW5jdGlvbiAkX19ldmFsX18kKENvbnNvbGUsICRfX2NvZGVfXyQpIHtcbiAgLy8gUXVpbmUgZm9yIHNjb3BpbmcgZXZhbHM6IHJlbGllcyBvbiBmdW5jdGlvbiBjbG9zdXJlcyB0byByZXR1cm4gYSBoYW5kbGVyIHRvIHRoZSBzY29wZSBhZnRlciBhbiBldmFsIGlzIGV4ZWN1dGVkIVxuICAvLyBTaW1wbGlmaWVkIGZpZGRsZSB0byBoZWxwIHVuZGVyc3RhbmQgd2h5IHRoaXMgcXVpbmUgaXMgdXNlZnVsOiBodHRwczovL2pzZmlkZGxlLm5ldC9ranZvNmgyeC9cbiAgdHJ5IHtcbiAgICBldmFsKCRfX2NvZGVfXyQpO1xuICAgIGV2YWwoJF9fZXZhbF9fJC50b1N0cmluZygpKTtcbiAgICByZXR1cm4gJF9fZXZhbF9fJDtcbiAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgQ29uc29sZS5sb2coZXhjZXB0aW9uKTtcbiAgICByZXR1cm4gJF9fZXZhbF9fJDtcbiAgfVxufTtcblxuY29uc3QgJF9fbG9nTWlkZGxld2FyZUJyb3dzZXJfXyQgPSBmdW5jdGlvbiAodGFiSUQpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhYklEKyctb3V0cHV0JykuQ29uc29sZTtcbn1cblxuY29uc3QgJF9fbG9nTWlkZGxld2FyZVNlcnZlcl9fJCA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc3QgQ29uc29sZSA9IHt9O1xuICBDb25zb2xlLmxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBnbG9iYWwuJF9fbG9nc19fJC5wdXNoKGFyZ3VtZW50cyk7XG4gIH07XG4gIHJldHVybiBDb25zb2xlO1xufVxuXG4vLyBkZXRlcm1pbmUgc2NvcGUgYW5kIGV2YWwgd2l0aGluIGl0IVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29kZSwgc2NvcGVOYW1lLCB0YWJJRCkge1xuICBjb25zdCBDb25zb2xlID0gdGFiSUQgPyAkX19sb2dNaWRkbGV3YXJlQnJvd3Nlcl9fJCh0YWJJRCkgOiAkX19sb2dNaWRkbGV3YXJlU2VydmVyX18kKCk7XG5cbiAgaWYgKHNjb3BlTmFtZSA9PSBudWxsKSB7XG4gICAgc2NvcGVOYW1lID0gJyRfX0RFRkFVTFRfXyQnO1xuICB9XG5cbiAgLy8gY3JlYXRlIGVtcHR5IHNjb3BlIGlmIGl0IGRvZXMgbm90IGV4aXN0XG4gIGlmICgkX19zY29wZXNfXyRbc2NvcGVOYW1lXSA9PSBudWxsKSB7XG4gICAgJF9fc2NvcGVzX18kW3Njb3BlTmFtZV0gPSAkX19ldmFsX18kO1xuICB9XG5cbiAgLy8gZXZhbCB3aXRoaW4gc2NvcGVcbiAgJF9fc2NvcGVzX18kW3Njb3BlTmFtZV0gPSAkX19zY29wZXNfXyRbc2NvcGVOYW1lXShDb25zb2xlLCBjb2RlKTtcbn07XG4iLCIvLyBmb3JtYXQgYXJndW1lbnRzIGFzIGlmIGNvbnNvbGUubG9nXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1zZyA9ICcnO1xuXG4gIC8vIGxvb3Agb3ZlciBhcmd1bWVudHMgYW5kIGZvcm1hdCBlYWNoXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gYXJndW1lbnQgaXMgYW4gZXJyb3I6IGRpc3BsYXkgZXJyb3IgbmFtZSBhbmQgc3RhY2sgaW5mb3JtYXRpb24gaWYgYXZhaWxhYmxlXG4gICAgaWYgKGFyZ3VtZW50c1tpXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBtc2cgKz0gYXJndW1lbnRzW2ldLnRvU3RyaW5nKCk7XG5cbiAgICAgIC8vIHZlbmRvLXNwZWNpZmljIGVycm9yIEFQSVxuICAgICAgaWYgKGFyZ3VtZW50c1tpXS5saW5lTnVtYmVyKSB7XG4gICAgICAgIG1zZyArPSAnXFx0JyArIGFyZ3VtZW50c1tpXS5saW5lTnVtYmVyO1xuICAgICAgICBpZiAoYXJndW1lbnRzW2ldLmNvbHVtbk51bWJlcikge1xuICAgICAgICAgIG1zZyArPSAnOicgKyBhcmd1bWVudHNbaV0uY29sdW1uTnVtYmVyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoYXJndW1lbnRzW2ldLnN0YWNrKSB7XG4gICAgICAgIHZhciBzdGFja1N0ciA9IGFyZ3VtZW50c1tpXS5zdGFjay50b1N0cmluZygpLnNwbGl0KCdcXG4nKS5qb2luKCdcXG5cXHRcXHQnKTtcbiAgICAgICAgbXNnICs9ICdcXG5TdGFjazpcXHQnICsgc3RhY2tTdHI7XG4gICAgICB9XG5cbiAgICAgIG1zZyArPSAnXFxuJztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZihhcmd1bWVudHNbaV0pID09PSAnb2JqZWN0Jykge1xuICAgICAgLy8gT2JqZWN0LCB1c2UgSlNPTlxuICAgICAgbXNnICs9IEpTT04uc3RyaW5naWZ5KGFyZ3VtZW50c1tpXSkgKyAnICc7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFByaW1pdGl2ZSB0eXBlLCB1c2UgdG9TdHJpbmdcbiAgICAgIG1zZyArPSBhcmd1bWVudHNbaV0udG9TdHJpbmcoKSArICcgJztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbXNnO1xufTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IFRhYnMgPSByZXF1aXJlKCcuL3RhYnMuanMnKTtcblxuICAvKlxuICAgKiBEZXRlY3QgPHByZT4gYW5kIDxjb2RlPiB0YWdzIG9mIGludGVyZXN0XG4gICAqL1xuICBjb25zdCBwcmVUYWdzID0gQXJyYXkuZnJvbShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgncHJlJykpO1xuICBjb25zdCBjb2RlVGFncyA9IHByZVRhZ3MubWFwKGZ1bmN0aW9uIChwcmVUYWcpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShwcmVUYWcuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvZGUnKSk7XG4gIH0pLnJlZHVjZShmdW5jdGlvbiAoY29kZVRhZ3MxLCBjb2RlVGFnczIpIHtcbiAgICByZXR1cm4gY29kZVRhZ3MxLmNvbmNhdChjb2RlVGFnczIpO1xuICB9LCBbXSkuZmlsdGVyKGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgcmV0dXJuIGNvZGVUYWcuY2xhc3NOYW1lLmluZGV4T2YoJ2xhbmd1YWdlLW5lcHR1bmUnKSA+IC0xO1xuICB9KTtcblxuICAvKlxuICAgKiBIZWxwZXIgZnVuY3Rpb25zXG4gICAqL1xuICBjb25zdCBnZXRPcHRpb25zID0gZnVuY3Rpb24gKGNvZGVUYWcpIHtcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIHRpdGxlOiAnSmF2YXNjcmlwdCcsXG4gICAgICBlbnY6ICdicm93c2VyJ1xuICAgIH07XG5cbiAgICAvLyByZXN1bHRcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMpO1xuICAgIGNvbnN0IGFkZE9wdGlvbiA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICAgICAgb3B0aW9uc1trZXldID0gdmFsO1xuXG4gICAgICBpZiAoa2V5ID09PSAnZW52JyAmJiBvcHRpb25zWyd0aXRsZSddID09PSBkZWZhdWx0T3B0aW9uc1sndGl0bGUnXSkge1xuICAgICAgICBvcHRpb25zWyd0aXRsZSddID0gdmFsO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBwYXJzZSBvcHRpb25zXG4gICAgZm9yIChsZXQgY2xhc3NOYW1lIG9mIGNvZGVUYWcuY2xhc3NMaXN0KSB7XG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUudHJpbSgpO1xuICAgICAgaWYgKCFjbGFzc05hbWUuc3RhcnRzV2l0aCgnbmVwdHVuZScpIHx8IGNsYXNzTmFtZS5pbmRleE9mKCdbJykgPT09IC0xKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUuc3Vic3RyaW5nKCgnbmVwdHVuZVsnKS5sZW5ndGgsIGNsYXNzTmFtZS5sZW5ndGgtMSk7XG4gICAgICBjbGFzc05hbWUuc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKG9wdGlvbikge1xuICAgICAgICBjb25zdCBpbmRleCA9IG9wdGlvbi5pbmRleE9mKCc9Jyk7XG4gICAgICAgIGNvbnN0IGtleSA9IG9wdGlvbi5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICBjb25zdCB2YWwgPSBvcHRpb24uc3Vic3RyaW5nKGluZGV4ICsgMSk7XG4gICAgICAgIGFkZE9wdGlvbihrZXksIHZhbCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfTtcblxuICBjb25zdCBzdHlsZUNvZGVCbG9jayA9IGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgY29uc3QgcHJlVGFnID0gY29kZVRhZy5wYXJlbnROb2RlO1xuXG4gICAgLy8gZ2V0IG5lcHR1bmUgY29kZSBvcHRpb25zIGZyb20gbWFya2Rvd25cbiAgICBjb25zdCBvcHRpb25zID0gZ2V0T3B0aW9ucyhjb2RlVGFnKTtcbiAgICBjb2RlVGFnLmRhdGFzZXQub3B0aW9ucyA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpO1xuXG4gICAgLy8gTWFrZSBzdXJlIFBSSVNNIHVuZGVyc3RhbmRzIHRoYXQgdGhpcyBpcyBKU1xuICAgIGNvZGVUYWcuY2xhc3NOYW1lID0gJ2xhbmd1YWdlLWphdmFzY3JpcHQnO1xuICAgIHByZVRhZy5jbGFzc05hbWUgPSAnbGFuZ3VhZ2UtamF2YXNjcmlwdCc7XG4gICAgcHJlVGFnLmNsYXNzTGlzdC5hZGQoJ2xpbmUtbnVtYmVycycpOyAvLyBhZGQgbGluZSBudW1iZXJpbmdcblxuICAgIC8vIFN0eWxlIGNvZGUgYXMgYSB0YWJiZWQgZnJhbWUgd2l0aCBhIHRvb2xiYXIgYW5kIGVkaXRvciFcbiAgICBUYWJzKHByZVRhZywgY29kZVRhZyk7XG4gIH07XG5cbiAgLypcbiAgICogQXBwbHkgc3R5bGluZyBhbmQgZnVuY3Rpb25hbGl0eVxuICAgKi9cbiAgY29kZVRhZ3MubWFwKGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgc3R5bGVDb2RlQmxvY2soY29kZVRhZyk7XG4gIH0pO1xufSkoKTtcbiIsIi8qIGdsb2JhbCBQcmlzbSAqL1xuXG5jb25zdCBmb3JtYXR0ZXIgPSByZXF1aXJlKCcuL2Zvcm1hdHRlci5qcycpO1xuXG5mdW5jdGlvbiByZXNldCgpIHtcbiAgdGhpcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgdGhpcy5jaGlsZHJlblswXS5pbm5lckhUTUwgPSAnUnVubmluZy4uLic7XG59XG5cbmZ1bmN0aW9uIGRpc3BsYXkob3V0cHV0KSB7XG4gIGlmICh0aGlzLmNoaWxkcmVuWzBdLnRleHRDb250ZW50ID09PSAnUnVubmluZy4uLicpIHtcbiAgICB0aGlzLmNoaWxkcmVuWzBdLmlubmVySFRNTCA9ICcnO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuY2hpbGRyZW5bMF0uaW5uZXJIVE1MICs9ICdcXG4nO1xuICB9XG5cbiAgdGhpcy5jaGlsZHJlblswXS5pbm5lckhUTUwgKz0gb3V0cHV0O1xuICBQcmlzbS5oaWdobGlnaHRFbGVtZW50KHRoaXMuY2hpbGRyZW5bMF0pO1xufVxuXG4vLyBtaW1pYyBjb25zb2xlLmxvZyAvIGNvbnNvbGUudGltZSAvIGV0Y1xuY29uc3QgQ29uc29sZSA9IHtcbiAgLy8gdGhpcyBoZXJlIGlzIGJvdW5kIHRvIHRoZSBvdXRwdXQgcGFuZWwgSFRNTCBlbGVtZW50XG4gIGxvZzogZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XG4gICAgdGhpcy5kaXNwbGF5KGZvcm1hdHRlci5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcbiAgfVxufTtcblxuLy8gY3JlYXRlcyBhIHRyYW5zcGFyZW50IHRleHRhcmVhIHRoYXQgc2VydmVzIGFzIGFuICdlZGl0b3InIGZvciB0aGUgY29kZSBpblxuLy8gdGhlIGFzc29jaWF0ZWQgPGNvZGU+IHRhZ1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodGFiSUQsIG9wdGlvbnMpIHtcbiAgLy8gY3JlYXRlIHByZSB0YWdcbiAgY29uc3QgcHJlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuICBwcmVFbGVtZW50LmlkID0gdGFiSUQgKyAnLW91dHB1dCc7XG4gIHByZUVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnY29tbWFuZC1saW5lJyk7XG4gIHByZUVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnb3V0cHV0LXBhbmVsJyk7XG5cbiAgcHJlRWxlbWVudC5kYXRhc2V0LnVzZXIgPSBvcHRpb25zWyd0aXRsZSddLnRvTG93ZXJDYXNlKCk7XG4gIHByZUVsZW1lbnQuZGF0YXNldC5ob3N0ID0gb3B0aW9uc1snZW52J10udG9Mb3dlckNhc2UoKTtcblxuICAvLyBjcmVhdGUgY29kZSB0YWdcbiAgY29uc3QgY29kZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjb2RlJyk7XG4gIGNvZGVFbGVtZW50LmNsYXNzTmFtZSA9ICdsYW5ndWFnZS1iYXNoJztcbiAgcHJlRWxlbWVudC5hcHBlbmRDaGlsZChjb2RlRWxlbWVudCk7XG5cbiAgLy8gYmluZCBsb2dnaW5nIGZ1bmN0aW9ucyB0byBvdXRwdXQgcGFuZWwgSFRNTCBlbGVtZW50XG4gIHByZUVsZW1lbnQucmVzZXQgPSByZXNldC5iaW5kKHByZUVsZW1lbnQpO1xuICBwcmVFbGVtZW50LmRpc3BsYXkgPSBkaXNwbGF5LmJpbmQocHJlRWxlbWVudCk7XG4gIHByZUVsZW1lbnQuQ29uc29sZSA9IHt9O1xuICBmb3IgKGNvbnN0IGF0dHIgaW4gQ29uc29sZSkge1xuICAgIHByZUVsZW1lbnQuQ29uc29sZVthdHRyXSA9IENvbnNvbGVbYXR0cl0uYmluZChwcmVFbGVtZW50KTtcbiAgfVxuXG4gIHJldHVybiBwcmVFbGVtZW50O1xufTtcbiIsIi8vIEV4ZWN1dGUgdGhpcyBjb2RlIHVzaW5nIGluIHRoZSBnaXZlbiBzY29wZSBuYW1lIGluIHRoZSBzZXJ2ZXIgdmlhIG5vZGUsIGFuZCBnZXQgYmFjayByZXN1bHRzIVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29kZSwgc2NvcGVOYW1lLCB0YWJJRCkge1xuICBpZiAod2luZG93LiRfX29mZmxpbmVfXyQpIHtcbiAgICBhbGVydCgnQ2Fubm90IGV4ZWN1dGUgc2VydmVyLXNpZGUgY29kZSB3aGlsZSBvZmZsaW5lIScpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICB4aHIub3BlbignUE9TVCcsIHdpbmRvdy5sb2NhdGlvbi5ocmVmICsgJy9fX2V4ZWMnKTtcbiAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9VVRGLTgnKTtcbiAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0ICYmIHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgY29uc3Qgb3V0cHV0UGFuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWJJRCArICctb3V0cHV0Jyk7XG4gICAgICBmb3IgKGNvbnN0IHJlY29yZCBvZiBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpKSB7XG4gICAgICAgIG91dHB1dFBhbmVsLkNvbnNvbGUubG9nKHJlY29yZCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeSh7c2NvcGVOYW1lOiBzY29wZU5hbWUsIGNvZGU6IGNvZGV9KSk7XG59O1xuIiwiLypcbiAqIGRlcGVuZGVuY2llc1xuICovXG5jb25zdCBUb29sYmFyID0gcmVxdWlyZSgnLi90b29sYmFyLmpzJyk7XG5jb25zdCBFZGl0b3IgPSByZXF1aXJlKCcuL2VkaXRvci5qcycpO1xuY29uc3QgT3V0cHV0UGFuZWwgPSByZXF1aXJlKCcuL291dHB1dFBhbmVsLmpzJyk7XG5cbmxldCBhdXRvQ291bnRlciA9IDA7XG5cbmNvbnN0IGNyZWF0ZVRhYiA9IGZ1bmN0aW9uICh0aXRsZSwgdGFic0NvbnRhaW5lciwgcHJlVGFnLCBvcHRpb25zKSB7XG4gIGNvbnN0IHRhYlJhZGlvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgY29uc3QgdGFiTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICBjb25zdCBjb2RlVGFiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgLy8gY3JlYXRlIElEIGZvciByYWRpb1xuICBjb25zdCBjb3VudCA9IHRhYnNDb250YWluZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0JykubGVuZ3RoO1xuICBjb25zdCB0YWJJRCA9IHRhYnNDb250YWluZXIuaWQgKyAnLXRhYi0nICsgKGNvdW50ICsgMSk7XG5cbiAgLy8gc3R5bGUgbGFibGUgYW5kIHJhZGlvXG4gIHRhYlJhZGlvLmNsYXNzTmFtZSA9ICd0YWItaW5wdXQnO1xuICB0YWJSYWRpby5pZCA9IHRhYklEO1xuICB0YWJSYWRpby5uYW1lID0gdGFic0NvbnRhaW5lci5pZDtcbiAgdGFiUmFkaW8udHlwZSA9ICdyYWRpbyc7XG5cbiAgdGFiTGFiZWwuY2xhc3NOYW1lID0gJ3RhYi1sYWJlbCc7XG4gIHRhYkxhYmVsLmlkID0gdGFiSUQgKyAnLWxhYmVsJztcbiAgdGFiTGFiZWwuc2V0QXR0cmlidXRlKCdmb3InLCB0YWJJRCk7XG4gIHRhYkxhYmVsLmlubmVySFRNTCA9IHRpdGxlO1xuICBpZiAoY291bnQgPT09IDApIHtcbiAgICB0YWJSYWRpby5zZXRBdHRyaWJ1dGUoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgIHRhYkxhYmVsLmNsYXNzTGlzdC5hZGQoJ3RhYi1sYWJlbC1zZWxlY3RlZCcpO1xuICAgIHRhYnNDb250YWluZXIuZGF0YXNldC5zZWxlY3RlZCA9IHRhYklEO1xuICB9XG5cbiAgdGFiUmFkaW8ub25jbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgLy8gcmVtb3ZlIHNlbGVjdGlvbiBmcm9tIHByZXZpb3VzIGxhYmVsXG4gICAgY29uc3QgbGFzdFZhbCA9IHRhYnNDb250YWluZXIuZGF0YXNldC5zZWxlY3RlZDtcbiAgICBjb25zdCBwcmV2TGFiZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChsYXN0VmFsICsgJy1sYWJlbCcpO1xuICAgIHByZXZMYWJlbC5jbGFzc0xpc3QucmVtb3ZlKCd0YWItbGFiZWwtc2VsZWN0ZWQnKTtcbiAgICAvLyBzZWxlY3QgdGhpcyBsYWJlbFxuICAgIHRhYnNDb250YWluZXIuZGF0YXNldC5zZWxlY3RlZCA9IHRhYklEO1xuICAgIHRhYkxhYmVsLmNsYXNzTGlzdC5hZGQoJ3RhYi1sYWJlbC1zZWxlY3RlZCcpO1xuICB9O1xuXG4gIC8vIHN0eWxlIGNvbnRhaW5lclxuICBjb2RlVGFiLmNsYXNzTGlzdC5hZGQoJ2NvZGUtdGFiJyk7XG5cbiAgLy8gYWRkIHRvb2xiYXIgYW5kIDxwcmU+IHRhZyBhbmQgb3V0cHV0IGFyZWFcbiAgY29kZVRhYi5hcHBlbmRDaGlsZChUb29sYmFyKHRhYklEKSk7XG4gIGNvZGVUYWIuYXBwZW5kQ2hpbGQocHJlVGFnKTtcbiAgY29kZVRhYi5hcHBlbmRDaGlsZChPdXRwdXRQYW5lbCh0YWJJRCwgb3B0aW9ucykpO1xuXG4gIC8vIGFkZCB0aGUgY29kZSBjb250YWluZXIgdG8gdGhlIHRhYnNcbiAgdGFic0NvbnRhaW5lci5pbnNlcnRCZWZvcmUodGFiTGFiZWwsIHRhYnNDb250YWluZXIuY2hpbGRyZW5bY291bnRdKTtcbiAgdGFic0NvbnRhaW5lci5hcHBlbmRDaGlsZCh0YWJSYWRpbyk7XG4gIHRhYnNDb250YWluZXIuYXBwZW5kQ2hpbGQoY29kZVRhYik7XG59O1xuXG5jb25zdCBjcmVhdGVUYWJzQ29udGFpbmVyID0gZnVuY3Rpb24gKGZyYW1lSUQpIHtcbiAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGNvbnRhaW5lci5pZCA9IGZyYW1lSUQ7XG4gIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdjb2RlLXRhYnMnKTtcbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn07XG5cbmNvbnN0IGdldE9yQ3JlYXRlVGFic0NvbnRhaW5lciA9IGZ1bmN0aW9uIChmcmFtZUlELCBwcmVUYWcpIHtcbiAgZnJhbWVJRCA9IGZyYW1lSUQgfHwgJ25lcHR1bmUtZnJhbWUtJyArIChhdXRvQ291bnRlcisrKTtcbiAgbGV0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGZyYW1lSUQpO1xuXG4gIGlmIChjb250YWluZXIgPT0gbnVsbCkge1xuICAgIGNvbnRhaW5lciA9IGNyZWF0ZVRhYnNDb250YWluZXIoZnJhbWVJRCk7XG4gICAgcHJlVGFnLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGNvbnRhaW5lciwgcHJlVGFnKTtcbiAgfSBlbHNlIHtcbiAgICBwcmVUYWcucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwcmVUYWcpO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHByZVRhZywgY29kZVRhZykge1xuICAvLyBQYXJzZSBvcHRpb25zIGZyb20gbWFya2Rvd25cbiAgY29uc3Qgb3B0aW9ucyA9IEpTT04ucGFyc2UoY29kZVRhZy5kYXRhc2V0Lm9wdGlvbnMpO1xuICBjb25zdCBmcmFtZUlEID0gb3B0aW9uc1snZnJhbWUnXTtcbiAgY29uc3QgdGl0bGUgPSBvcHRpb25zWyd0aXRsZSddO1xuXG4gIC8vIENyZWF0ZSAob3IgZ2V0IGlmIGV4aXN0cykgdGhlIHRhYnMgZnJhbWUgY29udGFpbmVyXG4gIGNvbnN0IHRhYnNDb250YWluZXIgPSBnZXRPckNyZWF0ZVRhYnNDb250YWluZXIoZnJhbWVJRCwgcHJlVGFnKTtcblxuICAvLyBBZGQgdGhpcyA8cHJlPjxjb2RlPiB0YWdzIGFzIGEgdGFiIHRvIHRoZSBjb250YWluZXJcbiAgY3JlYXRlVGFiKHRpdGxlLCB0YWJzQ29udGFpbmVyLCBwcmVUYWcsIG9wdGlvbnMpO1xuXG4gIC8vIGFkZCB0cmFuc3BhcmVudCB0ZXh0IGFyZWEgdGhhdCBtaW1pY3MgdGhlIGNvZGUgdGFnXG4gIHByZVRhZy5hcHBlbmRDaGlsZChFZGl0b3IoY29kZVRhZykpO1xufTtcbiIsImNvbnN0IHNjb3BlZEV2YWwgPSByZXF1aXJlKCcuL2V2YWwuanMnKTtcbmNvbnN0IHNlcnZlckV4ZWMgPSByZXF1aXJlKCcuL3NlcnZlckV4ZWMuanMnKTtcblxuLy8gaGFuZGxlcyBjbGlja2luZyBvbiBhbiBpY29uIGluIHRoZSBjb2RlIHRvb2xiYXJcbmNvbnN0IHRvb2xiYXJDbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc3QgdGFiSUQgPSB0aGlzLnBhcmVudE5vZGUuZGF0YXNldC50YWJJRDtcbiAgY29uc3QgdHlwZSA9IHRoaXMuY2hpbGRyZW5bMF0uY2xhc3NMaXN0WzFdLnNwbGl0KCctJylbMV07XG4gIGNvbnN0IGNvZGVUYWcgPSB0aGlzLnBhcmVudE5vZGUucGFyZW50Tm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29kZScpWzBdO1xuICBjb25zdCB0ZXh0QXJlYVRhZyA9IHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0ZXh0YXJlYScpWzBdO1xuICBjb25zdCBvcHRpb25zID0gSlNPTi5wYXJzZShjb2RlVGFnLmRhdGFzZXQub3B0aW9ucyk7XG4gIGNvbnN0IG91dHB1dFBhbmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFiSUQgKyAnLW91dHB1dCcpO1xuXG4gIGxldCByYW5nZTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAnY29weSc6XG4gICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgICByYW5nZS5zZWxlY3ROb2RlKGNvZGVUYWcpO1xuICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLmFkZFJhbmdlKHJhbmdlKTtcbiAgICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG4gICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ3RyYXNoJzpcbiAgICAgIHRleHRBcmVhVGFnLnZhbHVlID0gJyc7XG4gICAgICB0ZXh0QXJlYVRhZy5oYW5kbGVyKCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ3BsYXknOlxuICAgICAgb3V0cHV0UGFuZWwucmVzZXQoKTtcbiAgICAgIGlmIChvcHRpb25zWydlbnYnXSA9PT0gJ3NlcnZlcicpIHtcbiAgICAgICAgc2VydmVyRXhlYyhjb2RlVGFnLnRleHRDb250ZW50LCBvcHRpb25zWydzY29wZSddLCB0YWJJRCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY29wZWRFdmFsKGNvZGVUYWcudGV4dENvbnRlbnQsIG9wdGlvbnNbJ3Njb3BlJ10sIHRhYklEKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICB9XG59O1xuXG4vLyBjcmVhdGVzIEhUTUwgZWxlbWVudHMgZm9yIHRoZSB0b29sYmFyIG9uIHRvcCBvZiA8Y29kZT4gdGFnc1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodGFiSUQsIGhhbmRsZXI9dG9vbGJhckNsaWNrKSB7XG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjb2RlLXRvb2xiYXInKTtcbiAgZWxlbWVudC5kYXRhc2V0LnRhYklEID0gdGFiSUQ7XG4gIGVsZW1lbnQuaW5uZXJIVE1MID0gJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48aSBjbGFzcz1cImZhIGZhLXBsYXlcIj48L2k+PC9hPicgK1xuICAgICc8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+PGkgY2xhc3M9XCJmYSBmYS1jb3B5XCI+PC9pPjwvYT4nICtcbiAgICAnPGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2hcIj48L2k+PC9hPic7XG5cbiAgQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkcmVuKS5tYXAoZnVuY3Rpb24gKGFUYWcpIHtcbiAgICBhVGFnLm9uY2xpY2sgPSBoYW5kbGVyO1xuICB9KTtcblxuICByZXR1cm4gZWxlbWVudDtcbn07XG4iXX0=
