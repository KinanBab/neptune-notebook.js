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

  const outputIDs = []; // stores all reserved output <div> IDs

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
      env: 'browser',
      language: 'javascript'
    };

    // result
    const options = Object.assign({}, defaultOptions);
    const addOption = function (key, val) {
      options[key] = val;

      if (key === 'env' && options['title'] === defaultOptions['title']) {
        options['title'] = val;
      } else if (key === 'language') {
        options['language'] = options['language'].toLowerCase();
      } else if (key === 'outputID') {
        const id = options['outputID'];
        if (outputIDs.indexOf(id) > -1) {
          throw new Error('Duplicated outputID ' + id);
        }
        outputIDs.push(id);
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
    codeTag.className = 'language-' + options['language'];
    preTag.className = 'language-' + options['language'];
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

function reset(hideOutput) {
  this.dataset.shown = true;
  if (this.dataset.hideOutput !== 'true') {
    this.style.display = 'block';
  }
  if (this.dataset.language === 'javascript') {
    this.children[0].innerHTML = 'Running...';
  }
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

function hide() {
  this.style.display = 'none';
  this.dataset.hideOutput = 'true';
}

function unhide() {
  this.dataset.hideOutput = 'false';
  if (this.dataset.shown) {
    this.style.display = 'block';
  }
}

// mimic console.log / console.time / etc
const Console = {
  // this here is bound to the output panel HTML element
  log: function () {
    console.log.apply(console, arguments);
    this.display(formatter.apply(null, arguments));
  }
};

// Creates a terminal-like area for javascript or an empty div for HTML/CSS
module.exports = function (tabID, options) {
  let outputElement;
  if (options['lanaguage'] === 'javascript') {
    outputElement = document.createElement('pre');

    outputElement.classList.add('command-line');
    outputElement.dataset.user = options['title'].toLowerCase();
    outputElement.dataset.host = options['env'].toLowerCase();

    // create code tag
    const codeElement = document.createElement('code');
    codeElement.className = 'language-bash';
    outputElement.appendChild(codeElement);

    // bind util functions to HTML element
    outputElement.display = display.bind(outputElement);
    outputElement.Console = {};
    for (const attr in Console) {
      outputElement.Console[attr] = Console[attr].bind(outputElement);
    }
  } else {
    outputElement = document.createElement('div');
  }

  // style output area
  outputElement.id = tabID + '-output';
  outputElement.classList.add('output-panel');
  outputElement.dataset.language = options['lanaguage'];

  // bind logging functions to output panel HTML element
  outputElement.reset = reset.bind(outputElement);
  outputElement.hide = hide.bind(outputElement);
  outputElement.unhide = unhide.bind(outputElement);

  return outputElement;
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
    // unminize icon if needed
    const topToolbar = tabsContainer.getElementsByClassName('code-top-toolbar')[0];
    const minimizeIcon = topToolbar.children[topToolbar.children.length - 1].children[0];
    minimizeIcon.classList.remove('fa-arrow-down');
    minimizeIcon.classList.add('fa-arrow-up');
  };

  // style container
  codeTab.id = tabID + '-tab';
  codeTab.classList.add('code-tab');

  codeTab.appendChild(preTag);

  // built-in default ouput panel
  codeTab.appendChild(OutputPanel(tabID, options));

  // create output div if requested
  if (options['outputID']) {
    const outputDiv = document.createElement('div');
    outputDiv.id = options['outputID'];
    outputDiv.classList.add('custom-output-div');
    codeTab.appendChild(outputDiv);
  }

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
    container.appendChild(Toolbar());
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

// handles clicking on a run icon for non-javascript code!
const executeNonJavascript = function (code, language, tabID) {
  if (language === 'css') {
    code = '<style>'+code+'</style>';
  }

  document.getElementById(tabID + '-output').innerHTML = code;
}

// handles clicking on an icon in the code toolbar
const toolbarClick = function () {
  const type = this.children[0].classList[1].split('-').slice(1).join('-');

  const tabID = this.parentNode.parentNode.dataset.selected;
  const tabRadio = document.getElementById(tabID);
  const tabLabel = document.getElementById(tabID + '-label');
  const codeTab = document.getElementById(tabID + '-tab');
  const codeTag = codeTab.getElementsByTagName('code')[0];
  const textAreaTag = codeTab.getElementsByTagName('textarea')[0];
  const outputPanel = document.getElementById(tabID + '-output');

  const options = JSON.parse(codeTag.dataset.options);

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
      if (options['language'] === 'javascript') {
        if (options['env'] === 'server') {
          serverExec(codeTag.textContent, options['scope'], tabID);
        } else {
          scopedEval(codeTag.textContent, options['scope'], tabID);
        }
      } else {
        executeNonJavascript(codeTag.textContent, options['language'], tabID);
      }
      break;

    case 'arrow-up':
      tabRadio.checked = false;
      tabLabel.classList.remove('tab-label-selected');
      this.children[0].classList.remove('fa-arrow-up');
      this.children[0].classList.add('fa-arrow-down');
      break;

    case 'arrow-down':
      tabRadio.checked = true;
      tabLabel.classList.add('tab-label-selected');
      this.children[0].classList.remove('fa-arrow-down');
      this.children[0].classList.add('fa-arrow-up');
      break;

    case 'eye-slash':
      this.children[0].classList.remove('fa-eye-slash');
      this.children[0].classList.add('fa-eye');
      Array.from(this.parentNode.parentNode.getElementsByClassName('output-panel')).map(function (panel) {
        panel.hide();
      });
      break;

    case 'eye':
      this.children[0].classList.remove('fa-eye');
      this.children[0].classList.add('fa-eye-slash');
      Array.from(this.parentNode.parentNode.getElementsByClassName('output-panel')).map(function (panel) {
        panel.unhide();
      });
      break;
  }
};

// creates HTML elements for the toolbar on top of <code> tags
module.exports = function () {
  const element = document.createElement('span');
  element.classList.add('code-top-toolbar');
  element.innerHTML = '<a href="javascript:void(0)"><i class="fa fa-play"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-copy"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-trash"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-eye-slash"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-arrow-up"></i></a>';

  Array.from(element.children).map(function (aTag) {
    aTag.onclick = toolbarClick;
  });

  return element;
};

},{"./eval.js":2,"./serverExec.js":6}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9zdGF0aWNzL2Jyb3dzZXJpZnkvZWRpdG9yLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9ldmFsLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9mb3JtYXR0ZXIuanMiLCJzcmMvc3RhdGljcy9icm93c2VyaWZ5L25lcHR1bmUuanMiLCJzcmMvc3RhdGljcy9icm93c2VyaWZ5L291dHB1dFBhbmVsLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9zZXJ2ZXJFeGVjLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS90YWJzLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS90b29sYmFyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLyogZ2xvYmFsIFByaXNtICovXG5cbi8vIGJpbmQgaW5wdXQgdG8gdGhlIHRleHRhcmVhIHRvIHRoZSBjb2RlIHRhZ1xuY29uc3QgY29kZUlucHV0SGFuZGxlciA9IGZ1bmN0aW9uIChjb2RlVGFnLCB0ZXh0QXJlYVRhZykge1xuICB0ZXh0QXJlYVRhZy5zY3JvbGxUb3AgPSAwO1xuICBsZXQgY29kZSA9IHRleHRBcmVhVGFnLnZhbHVlO1xuXG4gIGNvZGVUYWcuaW5uZXJIVE1MID0gY29kZSArICcgJztcbiAgUHJpc20uaGlnaGxpZ2h0RWxlbWVudChjb2RlVGFnKTtcbn07XG5cbi8vIGNyZWF0ZXMgYSB0cmFuc3BhcmVudCB0ZXh0YXJlYSB0aGF0IHNlcnZlcyBhcyBhbiAnZWRpdG9yJyBmb3IgdGhlIGNvZGUgaW5cbi8vIHRoZSBhc3NvY2lhdGVkIDxjb2RlPiB0YWdcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvZGVUYWcpIHtcbiAgY29kZVRhZy5pbm5lckhUTUwgKz0gJyAnO1xuXG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2NvZGUtZWRpdG9yJyk7XG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdzcGVsbGNoZWNrJywgJ2ZhbHNlJyk7XG5cbiAgLy8gZXhwb3NlIGhhbmRsZXIgZm9yIGlucHV0IGJpbmRpbmdcbiAgZWxlbWVudC5oYW5kbGVyID0gY29kZUlucHV0SGFuZGxlci5iaW5kKG51bGwsIGNvZGVUYWcsIGVsZW1lbnQpO1xuXG4gIC8vIGxpc3RlbiB0byBhbnkgaW5wdXQgY2hhbmdlc1xuICBpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGVsZW1lbnQuaGFuZGxlcik7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC5hdHRhY2hFdmVudCkgeyAvLyBmb3IgSUUxMVxuICAgIGVsZW1lbnQuYXR0YWNoRXZlbnQoJ29ucHJvcGVydHljaGFuZ2UnLCBlbGVtZW50LmhhbmRsZXIpO1xuICB9XG5cbiAgLy8gcHV0IGNvZGUgaW4gdGV4dGFyZWFcbiAgZWxlbWVudC52YWx1ZSA9IGNvZGVUYWcudGV4dENvbnRlbnQ7XG5cbiAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuIiwiLypcbiAqIEhhbmRsZXMgc2NvcGVkIGV2YWx1YXRpb24gb2YgdXNlciBjb2RlLlxuICogVXNlcyBldmFsIHdpdGhpbiBmdW5jdGlvbiBjbG9zdXJlcyB0byBpc29sYXRlIHRoZSBkaWZmZXJlbnQgc2NvcGUgYW5kIHBlcnNpc3QgZXZhbCB2YXJpYWJsZXNcbiAqIGFuZCBzY29wZSBhZnRlciBleGVjdXRpb24gaW4gY2FzZSB0aGUgc2NvcGUgbXVzdCBiZSByZS11c2VkIVxuICpcbiAqIENvZGUgcnVubmluZyBpbnNpZGUgZXZhbCBoYXMgYWNjZXNzIHRvIHRoZSBmb2xsb3dpbmcgZ2xvYmFsIHZhcmlhYmxlczpcbiAqICAgQ29uc3RhbnRzOiAkX19zY29wZXNfXyQsICRfX2xvZ01pZGRsZXdhcmVCcm93c2VyX18kLCAkX19sb2dNaWRkbGV3YXJlU2VydmVyX18kXG4gKiAgIFZhcmlhYmxlczogJF9fZXZhbF9fJCwgJF9fY29kZV9fJCwgQ29uc29sZVxuICogICBCcm93c2VyLW9ubHk6IHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cyBmcm9tIGJyb3dzZXJpZnkuXG4gKiBJdCBpcyB1bnNhZmUgdG8gbW9kaWZ5IGFueSBvZiB0aGVzZSB2YXJpYWJsZXMgaW5zaWRlIHVzZXIgY29kZS4gQ29uc29sZSBzaG91bGQgYmUgdXNlZCB0byBsb2cgb3V0cHV0cyB0byB0aGUgVUkuXG4gKlxuICogVXNlciBjb2RlIHRoYXQgdXNlcyAnbGV0JyBvciAnY29uc3QnIGNhdXNlcyBldmFsIHRvIHVzZSBzdHJpY3QgbW9kZSwgYW5kIHNjb3BlIHRoZSBleGVjdXRlZCBjb2RlIGZ1cnRoZXIgdXNpbmcgY29kZSBibG9ja3NcbiAqIGluIGEgd2F5IHRoYXQgb3VyIGZ1bmN0aW9uLWNsb3N1cmVzIHNjb3BpbmcgbWVjaGFuaXNtIGNhbm5vdCBoYW5kbGUgcHJvcGVybHkuIFN1Y2ggdXNlciBjb2RlIHdpbGwgcnVuIHByb3Blcmx5IGlmIGl0IGlzIGluXG4gKiBhIHN0YW5kLWFsb25lIGNvZGUgYmxvY2ssIGJ1dCB2YXJpYWJsZXMgZGVmaW5lZCBpbiBpdCB3aWxsIG5vdCBiZSB2aXNpYmxlIHRvIG90aGVyIGNvZGUgYmxvY2tzIChvciByZS1ydW5zIG9mIHRoZSBzYW1lIGNvZGVcbiAqIGJsb2NrKSwgZXZlbiBpZiB0aGV5IGFyZSBjb25maWd1cmVkIHRvIGhhdmUgdGhlIHNhbWUgc2NvcGUhXG4gKi9cblxuLy8gU3RvcmUgYWxsIHNjb3Blc1xuY29uc3QgJF9fc2NvcGVzX18kID0ge307XG5cbi8vIGNyZWF0ZXMgdGhlIGZ1bmN0aW9uIHdpdGhvdXQgYSBjbG9zdXJlIChpbiBnbG9iYWwgc2NvcGUpXG4vLyBwcm90ZWN0cyB0aGUgc2NvcGUgb2YgdGhpcyBmaWxlIGFuZCBvdGhlciBuZXB0dW5lIGZpbGVzIGZyb20gaW50ZXJmZXJhbmNlIGZyb20gaW5zaWRlIGV2YWxcbmNvbnN0ICRfX2V2YWxfXyQgPSBmdW5jdGlvbiAkX19ldmFsX18kKENvbnNvbGUsICRfX2NvZGVfXyQpIHtcbiAgLy8gUXVpbmUgZm9yIHNjb3BpbmcgZXZhbHM6IHJlbGllcyBvbiBmdW5jdGlvbiBjbG9zdXJlcyB0byByZXR1cm4gYSBoYW5kbGVyIHRvIHRoZSBzY29wZSBhZnRlciBhbiBldmFsIGlzIGV4ZWN1dGVkIVxuICAvLyBTaW1wbGlmaWVkIGZpZGRsZSB0byBoZWxwIHVuZGVyc3RhbmQgd2h5IHRoaXMgcXVpbmUgaXMgdXNlZnVsOiBodHRwczovL2pzZmlkZGxlLm5ldC9ranZvNmgyeC9cbiAgdHJ5IHtcbiAgICBldmFsKCRfX2NvZGVfXyQpO1xuICAgIGV2YWwoJF9fZXZhbF9fJC50b1N0cmluZygpKTtcbiAgICByZXR1cm4gJF9fZXZhbF9fJDtcbiAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgQ29uc29sZS5sb2coZXhjZXB0aW9uKTtcbiAgICByZXR1cm4gJF9fZXZhbF9fJDtcbiAgfVxufTtcblxuY29uc3QgJF9fbG9nTWlkZGxld2FyZUJyb3dzZXJfXyQgPSBmdW5jdGlvbiAodGFiSUQpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhYklEKyctb3V0cHV0JykuQ29uc29sZTtcbn1cblxuY29uc3QgJF9fbG9nTWlkZGxld2FyZVNlcnZlcl9fJCA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc3QgQ29uc29sZSA9IHt9O1xuICBDb25zb2xlLmxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBnbG9iYWwuJF9fbG9nc19fJC5wdXNoKGFyZ3VtZW50cyk7XG4gIH07XG4gIHJldHVybiBDb25zb2xlO1xufVxuXG4vLyBkZXRlcm1pbmUgc2NvcGUgYW5kIGV2YWwgd2l0aGluIGl0IVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29kZSwgc2NvcGVOYW1lLCB0YWJJRCkge1xuICBjb25zdCBDb25zb2xlID0gdGFiSUQgPyAkX19sb2dNaWRkbGV3YXJlQnJvd3Nlcl9fJCh0YWJJRCkgOiAkX19sb2dNaWRkbGV3YXJlU2VydmVyX18kKCk7XG5cbiAgaWYgKHNjb3BlTmFtZSA9PSBudWxsKSB7XG4gICAgc2NvcGVOYW1lID0gJyRfX0RFRkFVTFRfXyQnO1xuICB9XG5cbiAgLy8gY3JlYXRlIGVtcHR5IHNjb3BlIGlmIGl0IGRvZXMgbm90IGV4aXN0XG4gIGlmICgkX19zY29wZXNfXyRbc2NvcGVOYW1lXSA9PSBudWxsKSB7XG4gICAgJF9fc2NvcGVzX18kW3Njb3BlTmFtZV0gPSAkX19ldmFsX18kO1xuICB9XG5cbiAgLy8gZXZhbCB3aXRoaW4gc2NvcGVcbiAgJF9fc2NvcGVzX18kW3Njb3BlTmFtZV0gPSAkX19zY29wZXNfXyRbc2NvcGVOYW1lXShDb25zb2xlLCBjb2RlKTtcbn07XG4iLCIvLyBmb3JtYXQgYXJndW1lbnRzIGFzIGlmIGNvbnNvbGUubG9nXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1zZyA9ICcnO1xuXG4gIC8vIGxvb3Agb3ZlciBhcmd1bWVudHMgYW5kIGZvcm1hdCBlYWNoXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gYXJndW1lbnQgaXMgYW4gZXJyb3I6IGRpc3BsYXkgZXJyb3IgbmFtZSBhbmQgc3RhY2sgaW5mb3JtYXRpb24gaWYgYXZhaWxhYmxlXG4gICAgaWYgKGFyZ3VtZW50c1tpXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBtc2cgKz0gYXJndW1lbnRzW2ldLnRvU3RyaW5nKCk7XG5cbiAgICAgIC8vIHZlbmRvLXNwZWNpZmljIGVycm9yIEFQSVxuICAgICAgaWYgKGFyZ3VtZW50c1tpXS5saW5lTnVtYmVyKSB7XG4gICAgICAgIG1zZyArPSAnXFx0JyArIGFyZ3VtZW50c1tpXS5saW5lTnVtYmVyO1xuICAgICAgICBpZiAoYXJndW1lbnRzW2ldLmNvbHVtbk51bWJlcikge1xuICAgICAgICAgIG1zZyArPSAnOicgKyBhcmd1bWVudHNbaV0uY29sdW1uTnVtYmVyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoYXJndW1lbnRzW2ldLnN0YWNrKSB7XG4gICAgICAgIHZhciBzdGFja1N0ciA9IGFyZ3VtZW50c1tpXS5zdGFjay50b1N0cmluZygpLnNwbGl0KCdcXG4nKS5qb2luKCdcXG5cXHRcXHQnKTtcbiAgICAgICAgbXNnICs9ICdcXG5TdGFjazpcXHQnICsgc3RhY2tTdHI7XG4gICAgICB9XG5cbiAgICAgIG1zZyArPSAnXFxuJztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZihhcmd1bWVudHNbaV0pID09PSAnb2JqZWN0Jykge1xuICAgICAgLy8gT2JqZWN0LCB1c2UgSlNPTlxuICAgICAgbXNnICs9IEpTT04uc3RyaW5naWZ5KGFyZ3VtZW50c1tpXSkgKyAnICc7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFByaW1pdGl2ZSB0eXBlLCB1c2UgdG9TdHJpbmdcbiAgICAgIG1zZyArPSBhcmd1bWVudHNbaV0udG9TdHJpbmcoKSArICcgJztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbXNnO1xufTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IFRhYnMgPSByZXF1aXJlKCcuL3RhYnMuanMnKTtcblxuICBjb25zdCBvdXRwdXRJRHMgPSBbXTsgLy8gc3RvcmVzIGFsbCByZXNlcnZlZCBvdXRwdXQgPGRpdj4gSURzXG5cbiAgLypcbiAgICogRGV0ZWN0IDxwcmU+IGFuZCA8Y29kZT4gdGFncyBvZiBpbnRlcmVzdFxuICAgKi9cbiAgY29uc3QgcHJlVGFncyA9IEFycmF5LmZyb20oZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3ByZScpKTtcbiAgY29uc3QgY29kZVRhZ3MgPSBwcmVUYWdzLm1hcChmdW5jdGlvbiAocHJlVGFnKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20ocHJlVGFnLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjb2RlJykpO1xuICB9KS5yZWR1Y2UoZnVuY3Rpb24gKGNvZGVUYWdzMSwgY29kZVRhZ3MyKSB7XG4gICAgcmV0dXJuIGNvZGVUYWdzMS5jb25jYXQoY29kZVRhZ3MyKTtcbiAgfSwgW10pLmZpbHRlcihmdW5jdGlvbiAoY29kZVRhZykge1xuICAgIHJldHVybiBjb2RlVGFnLmNsYXNzTmFtZS5pbmRleE9mKCdsYW5ndWFnZS1uZXB0dW5lJykgPiAtMTtcbiAgfSk7XG5cbiAgLypcbiAgICogSGVscGVyIGZ1bmN0aW9uc1xuICAgKi9cbiAgY29uc3QgZ2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICB0aXRsZTogJ0phdmFzY3JpcHQnLFxuICAgICAgZW52OiAnYnJvd3NlcicsXG4gICAgICBsYW5ndWFnZTogJ2phdmFzY3JpcHQnXG4gICAgfTtcblxuICAgIC8vIHJlc3VsdFxuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucyk7XG4gICAgY29uc3QgYWRkT3B0aW9uID0gZnVuY3Rpb24gKGtleSwgdmFsKSB7XG4gICAgICBvcHRpb25zW2tleV0gPSB2YWw7XG5cbiAgICAgIGlmIChrZXkgPT09ICdlbnYnICYmIG9wdGlvbnNbJ3RpdGxlJ10gPT09IGRlZmF1bHRPcHRpb25zWyd0aXRsZSddKSB7XG4gICAgICAgIG9wdGlvbnNbJ3RpdGxlJ10gPSB2YWw7XG4gICAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2xhbmd1YWdlJykge1xuICAgICAgICBvcHRpb25zWydsYW5ndWFnZSddID0gb3B0aW9uc1snbGFuZ3VhZ2UnXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICdvdXRwdXRJRCcpIHtcbiAgICAgICAgY29uc3QgaWQgPSBvcHRpb25zWydvdXRwdXRJRCddO1xuICAgICAgICBpZiAob3V0cHV0SURzLmluZGV4T2YoaWQpID4gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0R1cGxpY2F0ZWQgb3V0cHV0SUQgJyArIGlkKTtcbiAgICAgICAgfVxuICAgICAgICBvdXRwdXRJRHMucHVzaChpZCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIHBhcnNlIG9wdGlvbnNcbiAgICBmb3IgKGxldCBjbGFzc05hbWUgb2YgY29kZVRhZy5jbGFzc0xpc3QpIHtcbiAgICAgIGNsYXNzTmFtZSA9IGNsYXNzTmFtZS50cmltKCk7XG4gICAgICBpZiAoIWNsYXNzTmFtZS5zdGFydHNXaXRoKCduZXB0dW5lJykgfHwgY2xhc3NOYW1lLmluZGV4T2YoJ1snKSA9PT0gLTEpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNsYXNzTmFtZSA9IGNsYXNzTmFtZS5zdWJzdHJpbmcoKCduZXB0dW5lWycpLmxlbmd0aCwgY2xhc3NOYW1lLmxlbmd0aC0xKTtcbiAgICAgIGNsYXNzTmFtZS5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbiAob3B0aW9uKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gb3B0aW9uLmluZGV4T2YoJz0nKTtcbiAgICAgICAgY29uc3Qga2V5ID0gb3B0aW9uLnN1YnN0cmluZygwLCBpbmRleCk7XG4gICAgICAgIGNvbnN0IHZhbCA9IG9wdGlvbi5zdWJzdHJpbmcoaW5kZXggKyAxKTtcbiAgICAgICAgYWRkT3B0aW9uKGtleSwgdmFsKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBvcHRpb25zO1xuICB9O1xuXG4gIGNvbnN0IHN0eWxlQ29kZUJsb2NrID0gZnVuY3Rpb24gKGNvZGVUYWcpIHtcbiAgICBjb25zdCBwcmVUYWcgPSBjb2RlVGFnLnBhcmVudE5vZGU7XG5cbiAgICAvLyBnZXQgbmVwdHVuZSBjb2RlIG9wdGlvbnMgZnJvbSBtYXJrZG93blxuICAgIGNvbnN0IG9wdGlvbnMgPSBnZXRPcHRpb25zKGNvZGVUYWcpO1xuICAgIGNvZGVUYWcuZGF0YXNldC5vcHRpb25zID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucyk7XG5cbiAgICAvLyBNYWtlIHN1cmUgUFJJU00gdW5kZXJzdGFuZHMgdGhhdCB0aGlzIGlzIEpTXG4gICAgY29kZVRhZy5jbGFzc05hbWUgPSAnbGFuZ3VhZ2UtJyArIG9wdGlvbnNbJ2xhbmd1YWdlJ107XG4gICAgcHJlVGFnLmNsYXNzTmFtZSA9ICdsYW5ndWFnZS0nICsgb3B0aW9uc1snbGFuZ3VhZ2UnXTtcbiAgICBwcmVUYWcuY2xhc3NMaXN0LmFkZCgnbGluZS1udW1iZXJzJyk7IC8vIGFkZCBsaW5lIG51bWJlcmluZ1xuXG4gICAgLy8gU3R5bGUgY29kZSBhcyBhIHRhYmJlZCBmcmFtZSB3aXRoIGEgdG9vbGJhciBhbmQgZWRpdG9yIVxuICAgIFRhYnMocHJlVGFnLCBjb2RlVGFnKTtcbiAgfTtcblxuICAvKlxuICAgKiBBcHBseSBzdHlsaW5nIGFuZCBmdW5jdGlvbmFsaXR5XG4gICAqL1xuICBjb2RlVGFncy5tYXAoZnVuY3Rpb24gKGNvZGVUYWcpIHtcbiAgICBzdHlsZUNvZGVCbG9jayhjb2RlVGFnKTtcbiAgfSk7XG59KSgpO1xuIiwiLyogZ2xvYmFsIFByaXNtICovXG5cbmNvbnN0IGZvcm1hdHRlciA9IHJlcXVpcmUoJy4vZm9ybWF0dGVyLmpzJyk7XG5cbmZ1bmN0aW9uIHJlc2V0KGhpZGVPdXRwdXQpIHtcbiAgdGhpcy5kYXRhc2V0LnNob3duID0gdHJ1ZTtcbiAgaWYgKHRoaXMuZGF0YXNldC5oaWRlT3V0cHV0ICE9PSAndHJ1ZScpIHtcbiAgICB0aGlzLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICB9XG4gIGlmICh0aGlzLmRhdGFzZXQubGFuZ3VhZ2UgPT09ICdqYXZhc2NyaXB0Jykge1xuICAgIHRoaXMuY2hpbGRyZW5bMF0uaW5uZXJIVE1MID0gJ1J1bm5pbmcuLi4nO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BsYXkob3V0cHV0KSB7XG4gIGlmICh0aGlzLmNoaWxkcmVuWzBdLnRleHRDb250ZW50ID09PSAnUnVubmluZy4uLicpIHtcbiAgICB0aGlzLmNoaWxkcmVuWzBdLmlubmVySFRNTCA9ICcnO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuY2hpbGRyZW5bMF0uaW5uZXJIVE1MICs9ICdcXG4nO1xuICB9XG5cbiAgdGhpcy5jaGlsZHJlblswXS5pbm5lckhUTUwgKz0gb3V0cHV0O1xuICBQcmlzbS5oaWdobGlnaHRFbGVtZW50KHRoaXMuY2hpbGRyZW5bMF0pO1xufVxuXG5mdW5jdGlvbiBoaWRlKCkge1xuICB0aGlzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIHRoaXMuZGF0YXNldC5oaWRlT3V0cHV0ID0gJ3RydWUnO1xufVxuXG5mdW5jdGlvbiB1bmhpZGUoKSB7XG4gIHRoaXMuZGF0YXNldC5oaWRlT3V0cHV0ID0gJ2ZhbHNlJztcbiAgaWYgKHRoaXMuZGF0YXNldC5zaG93bikge1xuICAgIHRoaXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIH1cbn1cblxuLy8gbWltaWMgY29uc29sZS5sb2cgLyBjb25zb2xlLnRpbWUgLyBldGNcbmNvbnN0IENvbnNvbGUgPSB7XG4gIC8vIHRoaXMgaGVyZSBpcyBib3VuZCB0byB0aGUgb3V0cHV0IHBhbmVsIEhUTUwgZWxlbWVudFxuICBsb2c6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuZGlzcGxheShmb3JtYXR0ZXIuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XG4gIH1cbn07XG5cbi8vIENyZWF0ZXMgYSB0ZXJtaW5hbC1saWtlIGFyZWEgZm9yIGphdmFzY3JpcHQgb3IgYW4gZW1wdHkgZGl2IGZvciBIVE1ML0NTU1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodGFiSUQsIG9wdGlvbnMpIHtcbiAgbGV0IG91dHB1dEVsZW1lbnQ7XG4gIGlmIChvcHRpb25zWydsYW5hZ3VhZ2UnXSA9PT0gJ2phdmFzY3JpcHQnKSB7XG4gICAgb3V0cHV0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuXG4gICAgb3V0cHV0RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjb21tYW5kLWxpbmUnKTtcbiAgICBvdXRwdXRFbGVtZW50LmRhdGFzZXQudXNlciA9IG9wdGlvbnNbJ3RpdGxlJ10udG9Mb3dlckNhc2UoKTtcbiAgICBvdXRwdXRFbGVtZW50LmRhdGFzZXQuaG9zdCA9IG9wdGlvbnNbJ2VudiddLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAvLyBjcmVhdGUgY29kZSB0YWdcbiAgICBjb25zdCBjb2RlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NvZGUnKTtcbiAgICBjb2RlRWxlbWVudC5jbGFzc05hbWUgPSAnbGFuZ3VhZ2UtYmFzaCc7XG4gICAgb3V0cHV0RWxlbWVudC5hcHBlbmRDaGlsZChjb2RlRWxlbWVudCk7XG5cbiAgICAvLyBiaW5kIHV0aWwgZnVuY3Rpb25zIHRvIEhUTUwgZWxlbWVudFxuICAgIG91dHB1dEVsZW1lbnQuZGlzcGxheSA9IGRpc3BsYXkuYmluZChvdXRwdXRFbGVtZW50KTtcbiAgICBvdXRwdXRFbGVtZW50LkNvbnNvbGUgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGF0dHIgaW4gQ29uc29sZSkge1xuICAgICAgb3V0cHV0RWxlbWVudC5Db25zb2xlW2F0dHJdID0gQ29uc29sZVthdHRyXS5iaW5kKG91dHB1dEVsZW1lbnQpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBvdXRwdXRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIH1cblxuICAvLyBzdHlsZSBvdXRwdXQgYXJlYVxuICBvdXRwdXRFbGVtZW50LmlkID0gdGFiSUQgKyAnLW91dHB1dCc7XG4gIG91dHB1dEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnb3V0cHV0LXBhbmVsJyk7XG4gIG91dHB1dEVsZW1lbnQuZGF0YXNldC5sYW5ndWFnZSA9IG9wdGlvbnNbJ2xhbmFndWFnZSddO1xuXG4gIC8vIGJpbmQgbG9nZ2luZyBmdW5jdGlvbnMgdG8gb3V0cHV0IHBhbmVsIEhUTUwgZWxlbWVudFxuICBvdXRwdXRFbGVtZW50LnJlc2V0ID0gcmVzZXQuYmluZChvdXRwdXRFbGVtZW50KTtcbiAgb3V0cHV0RWxlbWVudC5oaWRlID0gaGlkZS5iaW5kKG91dHB1dEVsZW1lbnQpO1xuICBvdXRwdXRFbGVtZW50LnVuaGlkZSA9IHVuaGlkZS5iaW5kKG91dHB1dEVsZW1lbnQpO1xuXG4gIHJldHVybiBvdXRwdXRFbGVtZW50O1xufTtcbiIsIi8vIEV4ZWN1dGUgdGhpcyBjb2RlIHVzaW5nIGluIHRoZSBnaXZlbiBzY29wZSBuYW1lIGluIHRoZSBzZXJ2ZXIgdmlhIG5vZGUsIGFuZCBnZXQgYmFjayByZXN1bHRzIVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29kZSwgc2NvcGVOYW1lLCB0YWJJRCkge1xuICBpZiAod2luZG93LiRfX29mZmxpbmVfXyQpIHtcbiAgICBhbGVydCgnQ2Fubm90IGV4ZWN1dGUgc2VydmVyLXNpZGUgY29kZSB3aGlsZSBvZmZsaW5lIScpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICB4aHIub3BlbignUE9TVCcsIHdpbmRvdy5sb2NhdGlvbi5ocmVmICsgJy9fX2V4ZWMnKTtcbiAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9VVRGLTgnKTtcbiAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0ICYmIHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgY29uc3Qgb3V0cHV0UGFuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWJJRCArICctb3V0cHV0Jyk7XG4gICAgICBmb3IgKGNvbnN0IHJlY29yZCBvZiBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpKSB7XG4gICAgICAgIG91dHB1dFBhbmVsLkNvbnNvbGUubG9nKHJlY29yZCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeSh7c2NvcGVOYW1lOiBzY29wZU5hbWUsIGNvZGU6IGNvZGV9KSk7XG59O1xuIiwiLypcbiAqIGRlcGVuZGVuY2llc1xuICovXG5jb25zdCBUb29sYmFyID0gcmVxdWlyZSgnLi90b29sYmFyLmpzJyk7XG5jb25zdCBFZGl0b3IgPSByZXF1aXJlKCcuL2VkaXRvci5qcycpO1xuY29uc3QgT3V0cHV0UGFuZWwgPSByZXF1aXJlKCcuL291dHB1dFBhbmVsLmpzJyk7XG5cbmxldCBhdXRvQ291bnRlciA9IDA7XG5cbmNvbnN0IGNyZWF0ZVRhYiA9IGZ1bmN0aW9uICh0aXRsZSwgdGFic0NvbnRhaW5lciwgcHJlVGFnLCBvcHRpb25zKSB7XG4gIGNvbnN0IHRhYlJhZGlvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgY29uc3QgdGFiTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICBjb25zdCBjb2RlVGFiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgLy8gY3JlYXRlIElEIGZvciByYWRpb1xuICBjb25zdCBjb3VudCA9IHRhYnNDb250YWluZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0JykubGVuZ3RoO1xuICBjb25zdCB0YWJJRCA9IHRhYnNDb250YWluZXIuaWQgKyAnLXRhYi0nICsgKGNvdW50ICsgMSk7XG5cbiAgLy8gc3R5bGUgbGFibGUgYW5kIHJhZGlvXG4gIHRhYlJhZGlvLmNsYXNzTmFtZSA9ICd0YWItaW5wdXQnO1xuICB0YWJSYWRpby5pZCA9IHRhYklEO1xuICB0YWJSYWRpby5uYW1lID0gdGFic0NvbnRhaW5lci5pZDtcbiAgdGFiUmFkaW8udHlwZSA9ICdyYWRpbyc7XG5cbiAgdGFiTGFiZWwuY2xhc3NOYW1lID0gJ3RhYi1sYWJlbCc7XG4gIHRhYkxhYmVsLmlkID0gdGFiSUQgKyAnLWxhYmVsJztcbiAgdGFiTGFiZWwuc2V0QXR0cmlidXRlKCdmb3InLCB0YWJJRCk7XG4gIHRhYkxhYmVsLmlubmVySFRNTCA9IHRpdGxlO1xuICBpZiAoY291bnQgPT09IDApIHtcbiAgICB0YWJSYWRpby5zZXRBdHRyaWJ1dGUoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgIHRhYkxhYmVsLmNsYXNzTGlzdC5hZGQoJ3RhYi1sYWJlbC1zZWxlY3RlZCcpO1xuICAgIHRhYnNDb250YWluZXIuZGF0YXNldC5zZWxlY3RlZCA9IHRhYklEO1xuICB9XG5cbiAgdGFiUmFkaW8ub25jbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgLy8gcmVtb3ZlIHNlbGVjdGlvbiBmcm9tIHByZXZpb3VzIGxhYmVsXG4gICAgY29uc3QgbGFzdFZhbCA9IHRhYnNDb250YWluZXIuZGF0YXNldC5zZWxlY3RlZDtcbiAgICBjb25zdCBwcmV2TGFiZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChsYXN0VmFsICsgJy1sYWJlbCcpO1xuICAgIHByZXZMYWJlbC5jbGFzc0xpc3QucmVtb3ZlKCd0YWItbGFiZWwtc2VsZWN0ZWQnKTtcbiAgICAvLyBzZWxlY3QgdGhpcyBsYWJlbFxuICAgIHRhYnNDb250YWluZXIuZGF0YXNldC5zZWxlY3RlZCA9IHRhYklEO1xuICAgIHRhYkxhYmVsLmNsYXNzTGlzdC5hZGQoJ3RhYi1sYWJlbC1zZWxlY3RlZCcpO1xuICAgIC8vIHVubWluaXplIGljb24gaWYgbmVlZGVkXG4gICAgY29uc3QgdG9wVG9vbGJhciA9IHRhYnNDb250YWluZXIuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnY29kZS10b3AtdG9vbGJhcicpWzBdO1xuICAgIGNvbnN0IG1pbmltaXplSWNvbiA9IHRvcFRvb2xiYXIuY2hpbGRyZW5bdG9wVG9vbGJhci5jaGlsZHJlbi5sZW5ndGggLSAxXS5jaGlsZHJlblswXTtcbiAgICBtaW5pbWl6ZUljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmEtYXJyb3ctZG93bicpO1xuICAgIG1pbmltaXplSWNvbi5jbGFzc0xpc3QuYWRkKCdmYS1hcnJvdy11cCcpO1xuICB9O1xuXG4gIC8vIHN0eWxlIGNvbnRhaW5lclxuICBjb2RlVGFiLmlkID0gdGFiSUQgKyAnLXRhYic7XG4gIGNvZGVUYWIuY2xhc3NMaXN0LmFkZCgnY29kZS10YWInKTtcblxuICBjb2RlVGFiLmFwcGVuZENoaWxkKHByZVRhZyk7XG5cbiAgLy8gYnVpbHQtaW4gZGVmYXVsdCBvdXB1dCBwYW5lbFxuICBjb2RlVGFiLmFwcGVuZENoaWxkKE91dHB1dFBhbmVsKHRhYklELCBvcHRpb25zKSk7XG5cbiAgLy8gY3JlYXRlIG91dHB1dCBkaXYgaWYgcmVxdWVzdGVkXG4gIGlmIChvcHRpb25zWydvdXRwdXRJRCddKSB7XG4gICAgY29uc3Qgb3V0cHV0RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgb3V0cHV0RGl2LmlkID0gb3B0aW9uc1snb3V0cHV0SUQnXTtcbiAgICBvdXRwdXREaXYuY2xhc3NMaXN0LmFkZCgnY3VzdG9tLW91dHB1dC1kaXYnKTtcbiAgICBjb2RlVGFiLmFwcGVuZENoaWxkKG91dHB1dERpdik7XG4gIH1cblxuICAvLyBhZGQgdGhlIGNvZGUgY29udGFpbmVyIHRvIHRoZSB0YWJzXG4gIHRhYnNDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRhYkxhYmVsLCB0YWJzQ29udGFpbmVyLmNoaWxkcmVuW2NvdW50XSk7XG4gIHRhYnNDb250YWluZXIuYXBwZW5kQ2hpbGQodGFiUmFkaW8pO1xuICB0YWJzQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvZGVUYWIpO1xufTtcblxuY29uc3QgY3JlYXRlVGFic0NvbnRhaW5lciA9IGZ1bmN0aW9uIChmcmFtZUlEKSB7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb250YWluZXIuaWQgPSBmcmFtZUlEO1xuICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCgnY29kZS10YWJzJyk7XG4gIHJldHVybiBjb250YWluZXI7XG59O1xuXG5jb25zdCBnZXRPckNyZWF0ZVRhYnNDb250YWluZXIgPSBmdW5jdGlvbiAoZnJhbWVJRCwgcHJlVGFnKSB7XG4gIGZyYW1lSUQgPSBmcmFtZUlEIHx8ICduZXB0dW5lLWZyYW1lLScgKyAoYXV0b0NvdW50ZXIrKyk7XG4gIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChmcmFtZUlEKTtcblxuICBpZiAoY29udGFpbmVyID09IG51bGwpIHtcbiAgICBjb250YWluZXIgPSBjcmVhdGVUYWJzQ29udGFpbmVyKGZyYW1lSUQpO1xuICAgIHByZVRhZy5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChjb250YWluZXIsIHByZVRhZyk7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKFRvb2xiYXIoKSk7XG4gIH0gZWxzZSB7XG4gICAgcHJlVGFnLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocHJlVGFnKTtcbiAgfVxuXG4gIHJldHVybiBjb250YWluZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwcmVUYWcsIGNvZGVUYWcpIHtcbiAgLy8gUGFyc2Ugb3B0aW9ucyBmcm9tIG1hcmtkb3duXG4gIGNvbnN0IG9wdGlvbnMgPSBKU09OLnBhcnNlKGNvZGVUYWcuZGF0YXNldC5vcHRpb25zKTtcbiAgY29uc3QgZnJhbWVJRCA9IG9wdGlvbnNbJ2ZyYW1lJ107XG4gIGNvbnN0IHRpdGxlID0gb3B0aW9uc1sndGl0bGUnXTtcblxuICAvLyBDcmVhdGUgKG9yIGdldCBpZiBleGlzdHMpIHRoZSB0YWJzIGZyYW1lIGNvbnRhaW5lclxuICBjb25zdCB0YWJzQ29udGFpbmVyID0gZ2V0T3JDcmVhdGVUYWJzQ29udGFpbmVyKGZyYW1lSUQsIHByZVRhZyk7XG5cbiAgLy8gQWRkIHRoaXMgPHByZT48Y29kZT4gdGFncyBhcyBhIHRhYiB0byB0aGUgY29udGFpbmVyXG4gIGNyZWF0ZVRhYih0aXRsZSwgdGFic0NvbnRhaW5lciwgcHJlVGFnLCBvcHRpb25zKTtcblxuICAvLyBhZGQgdHJhbnNwYXJlbnQgdGV4dCBhcmVhIHRoYXQgbWltaWNzIHRoZSBjb2RlIHRhZ1xuICBwcmVUYWcuYXBwZW5kQ2hpbGQoRWRpdG9yKGNvZGVUYWcpKTtcbn07XG4iLCJjb25zdCBzY29wZWRFdmFsID0gcmVxdWlyZSgnLi9ldmFsLmpzJyk7XG5jb25zdCBzZXJ2ZXJFeGVjID0gcmVxdWlyZSgnLi9zZXJ2ZXJFeGVjLmpzJyk7XG5cbi8vIGhhbmRsZXMgY2xpY2tpbmcgb24gYSBydW4gaWNvbiBmb3Igbm9uLWphdmFzY3JpcHQgY29kZSFcbmNvbnN0IGV4ZWN1dGVOb25KYXZhc2NyaXB0ID0gZnVuY3Rpb24gKGNvZGUsIGxhbmd1YWdlLCB0YWJJRCkge1xuICBpZiAobGFuZ3VhZ2UgPT09ICdjc3MnKSB7XG4gICAgY29kZSA9ICc8c3R5bGU+Jytjb2RlKyc8L3N0eWxlPic7XG4gIH1cblxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWJJRCArICctb3V0cHV0JykuaW5uZXJIVE1MID0gY29kZTtcbn1cblxuLy8gaGFuZGxlcyBjbGlja2luZyBvbiBhbiBpY29uIGluIHRoZSBjb2RlIHRvb2xiYXJcbmNvbnN0IHRvb2xiYXJDbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc3QgdHlwZSA9IHRoaXMuY2hpbGRyZW5bMF0uY2xhc3NMaXN0WzFdLnNwbGl0KCctJykuc2xpY2UoMSkuam9pbignLScpO1xuXG4gIGNvbnN0IHRhYklEID0gdGhpcy5wYXJlbnROb2RlLnBhcmVudE5vZGUuZGF0YXNldC5zZWxlY3RlZDtcbiAgY29uc3QgdGFiUmFkaW8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWJJRCk7XG4gIGNvbnN0IHRhYkxhYmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFiSUQgKyAnLWxhYmVsJyk7XG4gIGNvbnN0IGNvZGVUYWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWJJRCArICctdGFiJyk7XG4gIGNvbnN0IGNvZGVUYWcgPSBjb2RlVGFiLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjb2RlJylbMF07XG4gIGNvbnN0IHRleHRBcmVhVGFnID0gY29kZVRhYi5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGV4dGFyZWEnKVswXTtcbiAgY29uc3Qgb3V0cHV0UGFuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWJJRCArICctb3V0cHV0Jyk7XG5cbiAgY29uc3Qgb3B0aW9ucyA9IEpTT04ucGFyc2UoY29kZVRhZy5kYXRhc2V0Lm9wdGlvbnMpO1xuXG4gIGxldCByYW5nZTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAnY29weSc6XG4gICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgICByYW5nZS5zZWxlY3ROb2RlKGNvZGVUYWcpO1xuICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLmFkZFJhbmdlKHJhbmdlKTtcbiAgICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG4gICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ3RyYXNoJzpcbiAgICAgIHRleHRBcmVhVGFnLnZhbHVlID0gJyc7XG4gICAgICB0ZXh0QXJlYVRhZy5oYW5kbGVyKCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ3BsYXknOlxuICAgICAgb3V0cHV0UGFuZWwucmVzZXQoKTtcbiAgICAgIGlmIChvcHRpb25zWydsYW5ndWFnZSddID09PSAnamF2YXNjcmlwdCcpIHtcbiAgICAgICAgaWYgKG9wdGlvbnNbJ2VudiddID09PSAnc2VydmVyJykge1xuICAgICAgICAgIHNlcnZlckV4ZWMoY29kZVRhZy50ZXh0Q29udGVudCwgb3B0aW9uc1snc2NvcGUnXSwgdGFiSUQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNjb3BlZEV2YWwoY29kZVRhZy50ZXh0Q29udGVudCwgb3B0aW9uc1snc2NvcGUnXSwgdGFiSUQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBleGVjdXRlTm9uSmF2YXNjcmlwdChjb2RlVGFnLnRleHRDb250ZW50LCBvcHRpb25zWydsYW5ndWFnZSddLCB0YWJJRCk7XG4gICAgICB9XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ2Fycm93LXVwJzpcbiAgICAgIHRhYlJhZGlvLmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgIHRhYkxhYmVsLmNsYXNzTGlzdC5yZW1vdmUoJ3RhYi1sYWJlbC1zZWxlY3RlZCcpO1xuICAgICAgdGhpcy5jaGlsZHJlblswXS5jbGFzc0xpc3QucmVtb3ZlKCdmYS1hcnJvdy11cCcpO1xuICAgICAgdGhpcy5jaGlsZHJlblswXS5jbGFzc0xpc3QuYWRkKCdmYS1hcnJvdy1kb3duJyk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ2Fycm93LWRvd24nOlxuICAgICAgdGFiUmFkaW8uY2hlY2tlZCA9IHRydWU7XG4gICAgICB0YWJMYWJlbC5jbGFzc0xpc3QuYWRkKCd0YWItbGFiZWwtc2VsZWN0ZWQnKTtcbiAgICAgIHRoaXMuY2hpbGRyZW5bMF0uY2xhc3NMaXN0LnJlbW92ZSgnZmEtYXJyb3ctZG93bicpO1xuICAgICAgdGhpcy5jaGlsZHJlblswXS5jbGFzc0xpc3QuYWRkKCdmYS1hcnJvdy11cCcpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdleWUtc2xhc2gnOlxuICAgICAgdGhpcy5jaGlsZHJlblswXS5jbGFzc0xpc3QucmVtb3ZlKCdmYS1leWUtc2xhc2gnKTtcbiAgICAgIHRoaXMuY2hpbGRyZW5bMF0uY2xhc3NMaXN0LmFkZCgnZmEtZXllJyk7XG4gICAgICBBcnJheS5mcm9tKHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ291dHB1dC1wYW5lbCcpKS5tYXAoZnVuY3Rpb24gKHBhbmVsKSB7XG4gICAgICAgIHBhbmVsLmhpZGUoKTtcbiAgICAgIH0pO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdleWUnOlxuICAgICAgdGhpcy5jaGlsZHJlblswXS5jbGFzc0xpc3QucmVtb3ZlKCdmYS1leWUnKTtcbiAgICAgIHRoaXMuY2hpbGRyZW5bMF0uY2xhc3NMaXN0LmFkZCgnZmEtZXllLXNsYXNoJyk7XG4gICAgICBBcnJheS5mcm9tKHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ291dHB1dC1wYW5lbCcpKS5tYXAoZnVuY3Rpb24gKHBhbmVsKSB7XG4gICAgICAgIHBhbmVsLnVuaGlkZSgpO1xuICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgfVxufTtcblxuLy8gY3JlYXRlcyBIVE1MIGVsZW1lbnRzIGZvciB0aGUgdG9vbGJhciBvbiB0b3Agb2YgPGNvZGU+IHRhZ3Ncbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2NvZGUtdG9wLXRvb2xiYXInKTtcbiAgZWxlbWVudC5pbm5lckhUTUwgPSAnPGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPjxpIGNsYXNzPVwiZmEgZmEtcGxheVwiPjwvaT48L2E+JyArXG4gICAgJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48aSBjbGFzcz1cImZhIGZhLWNvcHlcIj48L2k+PC9hPicgK1xuICAgICc8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaFwiPjwvaT48L2E+JyArXG4gICAgJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48aSBjbGFzcz1cImZhIGZhLWV5ZS1zbGFzaFwiPjwvaT48L2E+JyArXG4gICAgJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48aSBjbGFzcz1cImZhIGZhLWFycm93LXVwXCI+PC9pPjwvYT4nO1xuXG4gIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZHJlbikubWFwKGZ1bmN0aW9uIChhVGFnKSB7XG4gICAgYVRhZy5vbmNsaWNrID0gdG9vbGJhckNsaWNrO1xuICB9KTtcblxuICByZXR1cm4gZWxlbWVudDtcbn07XG4iXX0=
