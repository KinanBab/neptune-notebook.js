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
module.exports = function (preTag, codeTag) {
  // Parse options from markdown
  const options = JSON.parse(codeTag.dataset.options);

  // create placeholder span element and put code inside it!
  let element;
  if (options['language'] === 'javascript') {
    element = document.createElement('script');
    element.type = 'text/javascript';
    element.innerHTML = codeTag.textContent;
  } else if(options['language'] === 'css') {
    element = document.createElement('style');
    element.innerHTML = codeTag.textContent;
  } else {
    element = document.createElement('span');
    element.innerHTML = codeTag.textContent;
  }

  // replace <pre> with this
  preTag.parentNode.replaceChild(element, preTag);
};

},{}],5:[function(require,module,exports){
(function () {
  const Tabs = require('./tabs.js');
  const Inject = require('./inject.js');

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

    // If inject property is true, then inject code into page at this point without displaying it
    if (options['inject']) {
      Inject(preTag, codeTag);
    } else {
      // Style code as a tabbed frame with a toolbar and editor!
      Tabs(preTag, codeTag);
    }
  };

  /*
   * Apply styling and functionality
   */
  codeTags.map(function (codeTag) {
    styleCodeBlock(codeTag);
  });
})();

},{"./inject.js":4,"./tabs.js":8}],6:[function(require,module,exports){
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

},{"./formatter.js":3}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{"./editor.js":1,"./outputPanel.js":6,"./toolbar.js":9}],9:[function(require,module,exports){
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

},{"./eval.js":2,"./serverExec.js":7}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9zdGF0aWNzL2Jyb3dzZXJpZnkvZWRpdG9yLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9ldmFsLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9mb3JtYXR0ZXIuanMiLCJzcmMvc3RhdGljcy9icm93c2VyaWZ5L2luamVjdC5qcyIsInNyYy9zdGF0aWNzL2Jyb3dzZXJpZnkvbmVwdHVuZS5qcyIsInNyYy9zdGF0aWNzL2Jyb3dzZXJpZnkvb3V0cHV0UGFuZWwuanMiLCJzcmMvc3RhdGljcy9icm93c2VyaWZ5L3NlcnZlckV4ZWMuanMiLCJzcmMvc3RhdGljcy9icm93c2VyaWZ5L3RhYnMuanMiLCJzcmMvc3RhdGljcy9icm93c2VyaWZ5L3Rvb2xiYXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLyogZ2xvYmFsIFByaXNtICovXG5cbi8vIGJpbmQgaW5wdXQgdG8gdGhlIHRleHRhcmVhIHRvIHRoZSBjb2RlIHRhZ1xuY29uc3QgY29kZUlucHV0SGFuZGxlciA9IGZ1bmN0aW9uIChjb2RlVGFnLCB0ZXh0QXJlYVRhZykge1xuICB0ZXh0QXJlYVRhZy5zY3JvbGxUb3AgPSAwO1xuICBsZXQgY29kZSA9IHRleHRBcmVhVGFnLnZhbHVlO1xuXG4gIGNvZGVUYWcuaW5uZXJIVE1MID0gY29kZSArICcgJztcbiAgUHJpc20uaGlnaGxpZ2h0RWxlbWVudChjb2RlVGFnKTtcbn07XG5cbi8vIGNyZWF0ZXMgYSB0cmFuc3BhcmVudCB0ZXh0YXJlYSB0aGF0IHNlcnZlcyBhcyBhbiAnZWRpdG9yJyBmb3IgdGhlIGNvZGUgaW5cbi8vIHRoZSBhc3NvY2lhdGVkIDxjb2RlPiB0YWdcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvZGVUYWcpIHtcbiAgY29kZVRhZy5pbm5lckhUTUwgKz0gJyAnO1xuXG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2NvZGUtZWRpdG9yJyk7XG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdzcGVsbGNoZWNrJywgJ2ZhbHNlJyk7XG5cbiAgLy8gZXhwb3NlIGhhbmRsZXIgZm9yIGlucHV0IGJpbmRpbmdcbiAgZWxlbWVudC5oYW5kbGVyID0gY29kZUlucHV0SGFuZGxlci5iaW5kKG51bGwsIGNvZGVUYWcsIGVsZW1lbnQpO1xuXG4gIC8vIGxpc3RlbiB0byBhbnkgaW5wdXQgY2hhbmdlc1xuICBpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGVsZW1lbnQuaGFuZGxlcik7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC5hdHRhY2hFdmVudCkgeyAvLyBmb3IgSUUxMVxuICAgIGVsZW1lbnQuYXR0YWNoRXZlbnQoJ29ucHJvcGVydHljaGFuZ2UnLCBlbGVtZW50LmhhbmRsZXIpO1xuICB9XG5cbiAgLy8gcHV0IGNvZGUgaW4gdGV4dGFyZWFcbiAgZWxlbWVudC52YWx1ZSA9IGNvZGVUYWcudGV4dENvbnRlbnQ7XG5cbiAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuIiwiLypcbiAqIEhhbmRsZXMgc2NvcGVkIGV2YWx1YXRpb24gb2YgdXNlciBjb2RlLlxuICogVXNlcyBldmFsIHdpdGhpbiBmdW5jdGlvbiBjbG9zdXJlcyB0byBpc29sYXRlIHRoZSBkaWZmZXJlbnQgc2NvcGUgYW5kIHBlcnNpc3QgZXZhbCB2YXJpYWJsZXNcbiAqIGFuZCBzY29wZSBhZnRlciBleGVjdXRpb24gaW4gY2FzZSB0aGUgc2NvcGUgbXVzdCBiZSByZS11c2VkIVxuICpcbiAqIENvZGUgcnVubmluZyBpbnNpZGUgZXZhbCBoYXMgYWNjZXNzIHRvIHRoZSBmb2xsb3dpbmcgZ2xvYmFsIHZhcmlhYmxlczpcbiAqICAgQ29uc3RhbnRzOiAkX19zY29wZXNfXyQsICRfX2xvZ01pZGRsZXdhcmVCcm93c2VyX18kLCAkX19sb2dNaWRkbGV3YXJlU2VydmVyX18kXG4gKiAgIFZhcmlhYmxlczogJF9fZXZhbF9fJCwgJF9fY29kZV9fJCwgQ29uc29sZVxuICogICBCcm93c2VyLW9ubHk6IHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cyBmcm9tIGJyb3dzZXJpZnkuXG4gKiBJdCBpcyB1bnNhZmUgdG8gbW9kaWZ5IGFueSBvZiB0aGVzZSB2YXJpYWJsZXMgaW5zaWRlIHVzZXIgY29kZS4gQ29uc29sZSBzaG91bGQgYmUgdXNlZCB0byBsb2cgb3V0cHV0cyB0byB0aGUgVUkuXG4gKlxuICogVXNlciBjb2RlIHRoYXQgdXNlcyAnbGV0JyBvciAnY29uc3QnIGNhdXNlcyBldmFsIHRvIHVzZSBzdHJpY3QgbW9kZSwgYW5kIHNjb3BlIHRoZSBleGVjdXRlZCBjb2RlIGZ1cnRoZXIgdXNpbmcgY29kZSBibG9ja3NcbiAqIGluIGEgd2F5IHRoYXQgb3VyIGZ1bmN0aW9uLWNsb3N1cmVzIHNjb3BpbmcgbWVjaGFuaXNtIGNhbm5vdCBoYW5kbGUgcHJvcGVybHkuIFN1Y2ggdXNlciBjb2RlIHdpbGwgcnVuIHByb3Blcmx5IGlmIGl0IGlzIGluXG4gKiBhIHN0YW5kLWFsb25lIGNvZGUgYmxvY2ssIGJ1dCB2YXJpYWJsZXMgZGVmaW5lZCBpbiBpdCB3aWxsIG5vdCBiZSB2aXNpYmxlIHRvIG90aGVyIGNvZGUgYmxvY2tzIChvciByZS1ydW5zIG9mIHRoZSBzYW1lIGNvZGVcbiAqIGJsb2NrKSwgZXZlbiBpZiB0aGV5IGFyZSBjb25maWd1cmVkIHRvIGhhdmUgdGhlIHNhbWUgc2NvcGUhXG4gKi9cblxuLy8gU3RvcmUgYWxsIHNjb3Blc1xuY29uc3QgJF9fc2NvcGVzX18kID0ge307XG5cbi8vIGNyZWF0ZXMgdGhlIGZ1bmN0aW9uIHdpdGhvdXQgYSBjbG9zdXJlIChpbiBnbG9iYWwgc2NvcGUpXG4vLyBwcm90ZWN0cyB0aGUgc2NvcGUgb2YgdGhpcyBmaWxlIGFuZCBvdGhlciBuZXB0dW5lIGZpbGVzIGZyb20gaW50ZXJmZXJhbmNlIGZyb20gaW5zaWRlIGV2YWxcbmNvbnN0ICRfX2V2YWxfXyQgPSBmdW5jdGlvbiAkX19ldmFsX18kKENvbnNvbGUsICRfX2NvZGVfXyQpIHtcbiAgLy8gUXVpbmUgZm9yIHNjb3BpbmcgZXZhbHM6IHJlbGllcyBvbiBmdW5jdGlvbiBjbG9zdXJlcyB0byByZXR1cm4gYSBoYW5kbGVyIHRvIHRoZSBzY29wZSBhZnRlciBhbiBldmFsIGlzIGV4ZWN1dGVkIVxuICAvLyBTaW1wbGlmaWVkIGZpZGRsZSB0byBoZWxwIHVuZGVyc3RhbmQgd2h5IHRoaXMgcXVpbmUgaXMgdXNlZnVsOiBodHRwczovL2pzZmlkZGxlLm5ldC9ranZvNmgyeC9cbiAgdHJ5IHtcbiAgICBldmFsKCRfX2NvZGVfXyQpO1xuICAgIGV2YWwoJF9fZXZhbF9fJC50b1N0cmluZygpKTtcbiAgICByZXR1cm4gJF9fZXZhbF9fJDtcbiAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgQ29uc29sZS5sb2coZXhjZXB0aW9uKTtcbiAgICByZXR1cm4gJF9fZXZhbF9fJDtcbiAgfVxufTtcblxuY29uc3QgJF9fbG9nTWlkZGxld2FyZUJyb3dzZXJfXyQgPSBmdW5jdGlvbiAodGFiSUQpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhYklEKyctb3V0cHV0JykuQ29uc29sZTtcbn1cblxuY29uc3QgJF9fbG9nTWlkZGxld2FyZVNlcnZlcl9fJCA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc3QgQ29uc29sZSA9IHt9O1xuICBDb25zb2xlLmxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBnbG9iYWwuJF9fbG9nc19fJC5wdXNoKGFyZ3VtZW50cyk7XG4gIH07XG4gIHJldHVybiBDb25zb2xlO1xufVxuXG4vLyBkZXRlcm1pbmUgc2NvcGUgYW5kIGV2YWwgd2l0aGluIGl0IVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29kZSwgc2NvcGVOYW1lLCB0YWJJRCkge1xuICBjb25zdCBDb25zb2xlID0gdGFiSUQgPyAkX19sb2dNaWRkbGV3YXJlQnJvd3Nlcl9fJCh0YWJJRCkgOiAkX19sb2dNaWRkbGV3YXJlU2VydmVyX18kKCk7XG5cbiAgaWYgKHNjb3BlTmFtZSA9PSBudWxsKSB7XG4gICAgc2NvcGVOYW1lID0gJyRfX0RFRkFVTFRfXyQnO1xuICB9XG5cbiAgLy8gY3JlYXRlIGVtcHR5IHNjb3BlIGlmIGl0IGRvZXMgbm90IGV4aXN0XG4gIGlmICgkX19zY29wZXNfXyRbc2NvcGVOYW1lXSA9PSBudWxsKSB7XG4gICAgJF9fc2NvcGVzX18kW3Njb3BlTmFtZV0gPSAkX19ldmFsX18kO1xuICB9XG5cbiAgLy8gZXZhbCB3aXRoaW4gc2NvcGVcbiAgJF9fc2NvcGVzX18kW3Njb3BlTmFtZV0gPSAkX19zY29wZXNfXyRbc2NvcGVOYW1lXShDb25zb2xlLCBjb2RlKTtcbn07XG4iLCIvLyBmb3JtYXQgYXJndW1lbnRzIGFzIGlmIGNvbnNvbGUubG9nXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1zZyA9ICcnO1xuXG4gIC8vIGxvb3Agb3ZlciBhcmd1bWVudHMgYW5kIGZvcm1hdCBlYWNoXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gYXJndW1lbnQgaXMgYW4gZXJyb3I6IGRpc3BsYXkgZXJyb3IgbmFtZSBhbmQgc3RhY2sgaW5mb3JtYXRpb24gaWYgYXZhaWxhYmxlXG4gICAgaWYgKGFyZ3VtZW50c1tpXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBtc2cgKz0gYXJndW1lbnRzW2ldLnRvU3RyaW5nKCk7XG5cbiAgICAgIC8vIHZlbmRvLXNwZWNpZmljIGVycm9yIEFQSVxuICAgICAgaWYgKGFyZ3VtZW50c1tpXS5saW5lTnVtYmVyKSB7XG4gICAgICAgIG1zZyArPSAnXFx0JyArIGFyZ3VtZW50c1tpXS5saW5lTnVtYmVyO1xuICAgICAgICBpZiAoYXJndW1lbnRzW2ldLmNvbHVtbk51bWJlcikge1xuICAgICAgICAgIG1zZyArPSAnOicgKyBhcmd1bWVudHNbaV0uY29sdW1uTnVtYmVyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoYXJndW1lbnRzW2ldLnN0YWNrKSB7XG4gICAgICAgIHZhciBzdGFja1N0ciA9IGFyZ3VtZW50c1tpXS5zdGFjay50b1N0cmluZygpLnNwbGl0KCdcXG4nKS5qb2luKCdcXG5cXHRcXHQnKTtcbiAgICAgICAgbXNnICs9ICdcXG5TdGFjazpcXHQnICsgc3RhY2tTdHI7XG4gICAgICB9XG5cbiAgICAgIG1zZyArPSAnXFxuJztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZihhcmd1bWVudHNbaV0pID09PSAnb2JqZWN0Jykge1xuICAgICAgLy8gT2JqZWN0LCB1c2UgSlNPTlxuICAgICAgbXNnICs9IEpTT04uc3RyaW5naWZ5KGFyZ3VtZW50c1tpXSkgKyAnICc7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFByaW1pdGl2ZSB0eXBlLCB1c2UgdG9TdHJpbmdcbiAgICAgIG1zZyArPSBhcmd1bWVudHNbaV0udG9TdHJpbmcoKSArICcgJztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbXNnO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHByZVRhZywgY29kZVRhZykge1xuICAvLyBQYXJzZSBvcHRpb25zIGZyb20gbWFya2Rvd25cbiAgY29uc3Qgb3B0aW9ucyA9IEpTT04ucGFyc2UoY29kZVRhZy5kYXRhc2V0Lm9wdGlvbnMpO1xuXG4gIC8vIGNyZWF0ZSBwbGFjZWhvbGRlciBzcGFuIGVsZW1lbnQgYW5kIHB1dCBjb2RlIGluc2lkZSBpdCFcbiAgbGV0IGVsZW1lbnQ7XG4gIGlmIChvcHRpb25zWydsYW5ndWFnZSddID09PSAnamF2YXNjcmlwdCcpIHtcbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgZWxlbWVudC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPSBjb2RlVGFnLnRleHRDb250ZW50O1xuICB9IGVsc2UgaWYob3B0aW9uc1snbGFuZ3VhZ2UnXSA9PT0gJ2NzcycpIHtcbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBlbGVtZW50LmlubmVySFRNTCA9IGNvZGVUYWcudGV4dENvbnRlbnQ7XG4gIH0gZWxzZSB7XG4gICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBlbGVtZW50LmlubmVySFRNTCA9IGNvZGVUYWcudGV4dENvbnRlbnQ7XG4gIH1cblxuICAvLyByZXBsYWNlIDxwcmU+IHdpdGggdGhpc1xuICBwcmVUYWcucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoZWxlbWVudCwgcHJlVGFnKTtcbn07XG4iLCIoZnVuY3Rpb24gKCkge1xuICBjb25zdCBUYWJzID0gcmVxdWlyZSgnLi90YWJzLmpzJyk7XG4gIGNvbnN0IEluamVjdCA9IHJlcXVpcmUoJy4vaW5qZWN0LmpzJyk7XG5cbiAgY29uc3Qgb3V0cHV0SURzID0gW107IC8vIHN0b3JlcyBhbGwgcmVzZXJ2ZWQgb3V0cHV0IDxkaXY+IElEc1xuXG4gIC8qXG4gICAqIERldGVjdCA8cHJlPiBhbmQgPGNvZGU+IHRhZ3Mgb2YgaW50ZXJlc3RcbiAgICovXG4gIGNvbnN0IHByZVRhZ3MgPSBBcnJheS5mcm9tKGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwcmUnKSk7XG4gIGNvbnN0IGNvZGVUYWdzID0gcHJlVGFncy5tYXAoZnVuY3Rpb24gKHByZVRhZykge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHByZVRhZy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29kZScpKTtcbiAgfSkucmVkdWNlKGZ1bmN0aW9uIChjb2RlVGFnczEsIGNvZGVUYWdzMikge1xuICAgIHJldHVybiBjb2RlVGFnczEuY29uY2F0KGNvZGVUYWdzMik7XG4gIH0sIFtdKS5maWx0ZXIoZnVuY3Rpb24gKGNvZGVUYWcpIHtcbiAgICByZXR1cm4gY29kZVRhZy5jbGFzc05hbWUuaW5kZXhPZignbGFuZ3VhZ2UtbmVwdHVuZScpID4gLTE7XG4gIH0pO1xuXG4gIC8qXG4gICAqIEhlbHBlciBmdW5jdGlvbnNcbiAgICovXG4gIGNvbnN0IGdldE9wdGlvbnMgPSBmdW5jdGlvbiAoY29kZVRhZykge1xuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgdGl0bGU6ICdKYXZhc2NyaXB0JyxcbiAgICAgIGVudjogJ2Jyb3dzZXInLFxuICAgICAgbGFuZ3VhZ2U6ICdqYXZhc2NyaXB0J1xuICAgIH07XG5cbiAgICAvLyByZXN1bHRcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMpO1xuICAgIGNvbnN0IGFkZE9wdGlvbiA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICAgICAgb3B0aW9uc1trZXldID0gdmFsO1xuXG4gICAgICBpZiAoa2V5ID09PSAnZW52JyAmJiBvcHRpb25zWyd0aXRsZSddID09PSBkZWZhdWx0T3B0aW9uc1sndGl0bGUnXSkge1xuICAgICAgICBvcHRpb25zWyd0aXRsZSddID0gdmFsO1xuICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICdsYW5ndWFnZScpIHtcbiAgICAgICAgb3B0aW9uc1snbGFuZ3VhZ2UnXSA9IG9wdGlvbnNbJ2xhbmd1YWdlJ10udG9Mb3dlckNhc2UoKTtcbiAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnb3V0cHV0SUQnKSB7XG4gICAgICAgIGNvbnN0IGlkID0gb3B0aW9uc1snb3V0cHV0SUQnXTtcbiAgICAgICAgaWYgKG91dHB1dElEcy5pbmRleE9mKGlkKSA+IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEdXBsaWNhdGVkIG91dHB1dElEICcgKyBpZCk7XG4gICAgICAgIH1cbiAgICAgICAgb3V0cHV0SURzLnB1c2goaWQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBwYXJzZSBvcHRpb25zXG4gICAgZm9yIChsZXQgY2xhc3NOYW1lIG9mIGNvZGVUYWcuY2xhc3NMaXN0KSB7XG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUudHJpbSgpO1xuICAgICAgaWYgKCFjbGFzc05hbWUuc3RhcnRzV2l0aCgnbmVwdHVuZScpIHx8IGNsYXNzTmFtZS5pbmRleE9mKCdbJykgPT09IC0xKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUuc3Vic3RyaW5nKCgnbmVwdHVuZVsnKS5sZW5ndGgsIGNsYXNzTmFtZS5sZW5ndGgtMSk7XG4gICAgICBjbGFzc05hbWUuc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKG9wdGlvbikge1xuICAgICAgICBjb25zdCBpbmRleCA9IG9wdGlvbi5pbmRleE9mKCc9Jyk7XG4gICAgICAgIGNvbnN0IGtleSA9IG9wdGlvbi5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICBjb25zdCB2YWwgPSBvcHRpb24uc3Vic3RyaW5nKGluZGV4ICsgMSk7XG4gICAgICAgIGFkZE9wdGlvbihrZXksIHZhbCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfTtcblxuICBjb25zdCBzdHlsZUNvZGVCbG9jayA9IGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgY29uc3QgcHJlVGFnID0gY29kZVRhZy5wYXJlbnROb2RlO1xuXG4gICAgLy8gZ2V0IG5lcHR1bmUgY29kZSBvcHRpb25zIGZyb20gbWFya2Rvd25cbiAgICBjb25zdCBvcHRpb25zID0gZ2V0T3B0aW9ucyhjb2RlVGFnKTtcbiAgICBjb2RlVGFnLmRhdGFzZXQub3B0aW9ucyA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpO1xuXG4gICAgLy8gTWFrZSBzdXJlIFBSSVNNIHVuZGVyc3RhbmRzIHRoYXQgdGhpcyBpcyBKU1xuICAgIGNvZGVUYWcuY2xhc3NOYW1lID0gJ2xhbmd1YWdlLScgKyBvcHRpb25zWydsYW5ndWFnZSddO1xuICAgIHByZVRhZy5jbGFzc05hbWUgPSAnbGFuZ3VhZ2UtJyArIG9wdGlvbnNbJ2xhbmd1YWdlJ107XG4gICAgcHJlVGFnLmNsYXNzTGlzdC5hZGQoJ2xpbmUtbnVtYmVycycpOyAvLyBhZGQgbGluZSBudW1iZXJpbmdcblxuICAgIC8vIElmIGluamVjdCBwcm9wZXJ0eSBpcyB0cnVlLCB0aGVuIGluamVjdCBjb2RlIGludG8gcGFnZSBhdCB0aGlzIHBvaW50IHdpdGhvdXQgZGlzcGxheWluZyBpdFxuICAgIGlmIChvcHRpb25zWydpbmplY3QnXSkge1xuICAgICAgSW5qZWN0KHByZVRhZywgY29kZVRhZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFN0eWxlIGNvZGUgYXMgYSB0YWJiZWQgZnJhbWUgd2l0aCBhIHRvb2xiYXIgYW5kIGVkaXRvciFcbiAgICAgIFRhYnMocHJlVGFnLCBjb2RlVGFnKTtcbiAgICB9XG4gIH07XG5cbiAgLypcbiAgICogQXBwbHkgc3R5bGluZyBhbmQgZnVuY3Rpb25hbGl0eVxuICAgKi9cbiAgY29kZVRhZ3MubWFwKGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgc3R5bGVDb2RlQmxvY2soY29kZVRhZyk7XG4gIH0pO1xufSkoKTtcbiIsIi8qIGdsb2JhbCBQcmlzbSAqL1xuXG5jb25zdCBmb3JtYXR0ZXIgPSByZXF1aXJlKCcuL2Zvcm1hdHRlci5qcycpO1xuXG5mdW5jdGlvbiByZXNldChoaWRlT3V0cHV0KSB7XG4gIHRoaXMuZGF0YXNldC5zaG93biA9IHRydWU7XG4gIGlmICh0aGlzLmRhdGFzZXQuaGlkZU91dHB1dCAhPT0gJ3RydWUnKSB7XG4gICAgdGhpcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgfVxuICBpZiAodGhpcy5kYXRhc2V0Lmxhbmd1YWdlID09PSAnamF2YXNjcmlwdCcpIHtcbiAgICB0aGlzLmNoaWxkcmVuWzBdLmlubmVySFRNTCA9ICdSdW5uaW5nLi4uJztcbiAgfVxufVxuXG5mdW5jdGlvbiBkaXNwbGF5KG91dHB1dCkge1xuICBpZiAodGhpcy5jaGlsZHJlblswXS50ZXh0Q29udGVudCA9PT0gJ1J1bm5pbmcuLi4nKSB7XG4gICAgdGhpcy5jaGlsZHJlblswXS5pbm5lckhUTUwgPSAnJztcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmNoaWxkcmVuWzBdLmlubmVySFRNTCArPSAnXFxuJztcbiAgfVxuXG4gIHRoaXMuY2hpbGRyZW5bMF0uaW5uZXJIVE1MICs9IG91dHB1dDtcbiAgUHJpc20uaGlnaGxpZ2h0RWxlbWVudCh0aGlzLmNoaWxkcmVuWzBdKTtcbn1cblxuZnVuY3Rpb24gaGlkZSgpIHtcbiAgdGhpcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICB0aGlzLmRhdGFzZXQuaGlkZU91dHB1dCA9ICd0cnVlJztcbn1cblxuZnVuY3Rpb24gdW5oaWRlKCkge1xuICB0aGlzLmRhdGFzZXQuaGlkZU91dHB1dCA9ICdmYWxzZSc7XG4gIGlmICh0aGlzLmRhdGFzZXQuc2hvd24pIHtcbiAgICB0aGlzLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICB9XG59XG5cbi8vIG1pbWljIGNvbnNvbGUubG9nIC8gY29uc29sZS50aW1lIC8gZXRjXG5jb25zdCBDb25zb2xlID0ge1xuICAvLyB0aGlzIGhlcmUgaXMgYm91bmQgdG8gdGhlIG91dHB1dCBwYW5lbCBIVE1MIGVsZW1lbnRcbiAgbG9nOiBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgICB0aGlzLmRpc3BsYXkoZm9ybWF0dGVyLmFwcGx5KG51bGwsIGFyZ3VtZW50cykpO1xuICB9XG59O1xuXG4vLyBDcmVhdGVzIGEgdGVybWluYWwtbGlrZSBhcmVhIGZvciBqYXZhc2NyaXB0IG9yIGFuIGVtcHR5IGRpdiBmb3IgSFRNTC9DU1Ncbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHRhYklELCBvcHRpb25zKSB7XG4gIGxldCBvdXRwdXRFbGVtZW50O1xuICBpZiAob3B0aW9uc1snbGFuYWd1YWdlJ10gPT09ICdqYXZhc2NyaXB0Jykge1xuICAgIG91dHB1dEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwcmUnKTtcblxuICAgIG91dHB1dEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnY29tbWFuZC1saW5lJyk7XG4gICAgb3V0cHV0RWxlbWVudC5kYXRhc2V0LnVzZXIgPSBvcHRpb25zWyd0aXRsZSddLnRvTG93ZXJDYXNlKCk7XG4gICAgb3V0cHV0RWxlbWVudC5kYXRhc2V0Lmhvc3QgPSBvcHRpb25zWydlbnYnXS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgLy8gY3JlYXRlIGNvZGUgdGFnXG4gICAgY29uc3QgY29kZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjb2RlJyk7XG4gICAgY29kZUVsZW1lbnQuY2xhc3NOYW1lID0gJ2xhbmd1YWdlLWJhc2gnO1xuICAgIG91dHB1dEVsZW1lbnQuYXBwZW5kQ2hpbGQoY29kZUVsZW1lbnQpO1xuXG4gICAgLy8gYmluZCB1dGlsIGZ1bmN0aW9ucyB0byBIVE1MIGVsZW1lbnRcbiAgICBvdXRwdXRFbGVtZW50LmRpc3BsYXkgPSBkaXNwbGF5LmJpbmQob3V0cHV0RWxlbWVudCk7XG4gICAgb3V0cHV0RWxlbWVudC5Db25zb2xlID0ge307XG4gICAgZm9yIChjb25zdCBhdHRyIGluIENvbnNvbGUpIHtcbiAgICAgIG91dHB1dEVsZW1lbnQuQ29uc29sZVthdHRyXSA9IENvbnNvbGVbYXR0cl0uYmluZChvdXRwdXRFbGVtZW50KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB9XG5cbiAgLy8gc3R5bGUgb3V0cHV0IGFyZWFcbiAgb3V0cHV0RWxlbWVudC5pZCA9IHRhYklEICsgJy1vdXRwdXQnO1xuICBvdXRwdXRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ291dHB1dC1wYW5lbCcpO1xuICBvdXRwdXRFbGVtZW50LmRhdGFzZXQubGFuZ3VhZ2UgPSBvcHRpb25zWydsYW5hZ3VhZ2UnXTtcblxuICAvLyBiaW5kIGxvZ2dpbmcgZnVuY3Rpb25zIHRvIG91dHB1dCBwYW5lbCBIVE1MIGVsZW1lbnRcbiAgb3V0cHV0RWxlbWVudC5yZXNldCA9IHJlc2V0LmJpbmQob3V0cHV0RWxlbWVudCk7XG4gIG91dHB1dEVsZW1lbnQuaGlkZSA9IGhpZGUuYmluZChvdXRwdXRFbGVtZW50KTtcbiAgb3V0cHV0RWxlbWVudC51bmhpZGUgPSB1bmhpZGUuYmluZChvdXRwdXRFbGVtZW50KTtcblxuICByZXR1cm4gb3V0cHV0RWxlbWVudDtcbn07XG4iLCIvLyBFeGVjdXRlIHRoaXMgY29kZSB1c2luZyBpbiB0aGUgZ2l2ZW4gc2NvcGUgbmFtZSBpbiB0aGUgc2VydmVyIHZpYSBub2RlLCBhbmQgZ2V0IGJhY2sgcmVzdWx0cyFcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvZGUsIHNjb3BlTmFtZSwgdGFiSUQpIHtcbiAgaWYgKHdpbmRvdy4kX19vZmZsaW5lX18kKSB7XG4gICAgYWxlcnQoJ0Nhbm5vdCBleGVjdXRlIHNlcnZlci1zaWRlIGNvZGUgd2hpbGUgb2ZmbGluZSEnKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgeGhyLm9wZW4oJ1BPU1QnLCB3aW5kb3cubG9jYXRpb24uaHJlZiArICcvX19leGVjJyk7XG4gIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PVVURi04Jyk7XG4gIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCAmJiB4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgIGNvbnN0IG91dHB1dFBhbmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFiSUQgKyAnLW91dHB1dCcpO1xuICAgICAgZm9yIChjb25zdCByZWNvcmQgb2YgSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KSkge1xuICAgICAgICBvdXRwdXRQYW5lbC5Db25zb2xlLmxvZyhyZWNvcmQpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoe3Njb3BlTmFtZTogc2NvcGVOYW1lLCBjb2RlOiBjb2RlfSkpO1xufTtcbiIsIi8qXG4gKiBkZXBlbmRlbmNpZXNcbiAqL1xuY29uc3QgVG9vbGJhciA9IHJlcXVpcmUoJy4vdG9vbGJhci5qcycpO1xuY29uc3QgRWRpdG9yID0gcmVxdWlyZSgnLi9lZGl0b3IuanMnKTtcbmNvbnN0IE91dHB1dFBhbmVsID0gcmVxdWlyZSgnLi9vdXRwdXRQYW5lbC5qcycpO1xuXG5sZXQgYXV0b0NvdW50ZXIgPSAwO1xuXG5jb25zdCBjcmVhdGVUYWIgPSBmdW5jdGlvbiAodGl0bGUsIHRhYnNDb250YWluZXIsIHByZVRhZywgb3B0aW9ucykge1xuICBjb25zdCB0YWJSYWRpbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGNvbnN0IHRhYkxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgY29uc3QgY29kZVRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIC8vIGNyZWF0ZSBJRCBmb3IgcmFkaW9cbiAgY29uc3QgY291bnQgPSB0YWJzQ29udGFpbmVyLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpLmxlbmd0aDtcbiAgY29uc3QgdGFiSUQgPSB0YWJzQ29udGFpbmVyLmlkICsgJy10YWItJyArIChjb3VudCArIDEpO1xuXG4gIC8vIHN0eWxlIGxhYmxlIGFuZCByYWRpb1xuICB0YWJSYWRpby5jbGFzc05hbWUgPSAndGFiLWlucHV0JztcbiAgdGFiUmFkaW8uaWQgPSB0YWJJRDtcbiAgdGFiUmFkaW8ubmFtZSA9IHRhYnNDb250YWluZXIuaWQ7XG4gIHRhYlJhZGlvLnR5cGUgPSAncmFkaW8nO1xuXG4gIHRhYkxhYmVsLmNsYXNzTmFtZSA9ICd0YWItbGFiZWwnO1xuICB0YWJMYWJlbC5pZCA9IHRhYklEICsgJy1sYWJlbCc7XG4gIHRhYkxhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgdGFiSUQpO1xuICB0YWJMYWJlbC5pbm5lckhUTUwgPSB0aXRsZTtcbiAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgdGFiUmFkaW8uc2V0QXR0cmlidXRlKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICB0YWJMYWJlbC5jbGFzc0xpc3QuYWRkKCd0YWItbGFiZWwtc2VsZWN0ZWQnKTtcbiAgICB0YWJzQ29udGFpbmVyLmRhdGFzZXQuc2VsZWN0ZWQgPSB0YWJJRDtcbiAgfVxuXG4gIHRhYlJhZGlvLm9uY2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgIC8vIHJlbW92ZSBzZWxlY3Rpb24gZnJvbSBwcmV2aW91cyBsYWJlbFxuICAgIGNvbnN0IGxhc3RWYWwgPSB0YWJzQ29udGFpbmVyLmRhdGFzZXQuc2VsZWN0ZWQ7XG4gICAgY29uc3QgcHJldkxhYmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobGFzdFZhbCArICctbGFiZWwnKTtcbiAgICBwcmV2TGFiZWwuY2xhc3NMaXN0LnJlbW92ZSgndGFiLWxhYmVsLXNlbGVjdGVkJyk7XG4gICAgLy8gc2VsZWN0IHRoaXMgbGFiZWxcbiAgICB0YWJzQ29udGFpbmVyLmRhdGFzZXQuc2VsZWN0ZWQgPSB0YWJJRDtcbiAgICB0YWJMYWJlbC5jbGFzc0xpc3QuYWRkKCd0YWItbGFiZWwtc2VsZWN0ZWQnKTtcbiAgICAvLyB1bm1pbml6ZSBpY29uIGlmIG5lZWRlZFxuICAgIGNvbnN0IHRvcFRvb2xiYXIgPSB0YWJzQ29udGFpbmVyLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2NvZGUtdG9wLXRvb2xiYXInKVswXTtcbiAgICBjb25zdCBtaW5pbWl6ZUljb24gPSB0b3BUb29sYmFyLmNoaWxkcmVuW3RvcFRvb2xiYXIuY2hpbGRyZW4ubGVuZ3RoIC0gMV0uY2hpbGRyZW5bMF07XG4gICAgbWluaW1pemVJY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhLWFycm93LWRvd24nKTtcbiAgICBtaW5pbWl6ZUljb24uY2xhc3NMaXN0LmFkZCgnZmEtYXJyb3ctdXAnKTtcbiAgfTtcblxuICAvLyBzdHlsZSBjb250YWluZXJcbiAgY29kZVRhYi5pZCA9IHRhYklEICsgJy10YWInO1xuICBjb2RlVGFiLmNsYXNzTGlzdC5hZGQoJ2NvZGUtdGFiJyk7XG5cbiAgY29kZVRhYi5hcHBlbmRDaGlsZChwcmVUYWcpO1xuXG4gIC8vIGJ1aWx0LWluIGRlZmF1bHQgb3VwdXQgcGFuZWxcbiAgY29kZVRhYi5hcHBlbmRDaGlsZChPdXRwdXRQYW5lbCh0YWJJRCwgb3B0aW9ucykpO1xuXG4gIC8vIGNyZWF0ZSBvdXRwdXQgZGl2IGlmIHJlcXVlc3RlZFxuICBpZiAob3B0aW9uc1snb3V0cHV0SUQnXSkge1xuICAgIGNvbnN0IG91dHB1dERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG91dHB1dERpdi5pZCA9IG9wdGlvbnNbJ291dHB1dElEJ107XG4gICAgb3V0cHV0RGl2LmNsYXNzTGlzdC5hZGQoJ2N1c3RvbS1vdXRwdXQtZGl2Jyk7XG4gICAgY29kZVRhYi5hcHBlbmRDaGlsZChvdXRwdXREaXYpO1xuICB9XG5cbiAgLy8gYWRkIHRoZSBjb2RlIGNvbnRhaW5lciB0byB0aGUgdGFic1xuICB0YWJzQ29udGFpbmVyLmluc2VydEJlZm9yZSh0YWJMYWJlbCwgdGFic0NvbnRhaW5lci5jaGlsZHJlbltjb3VudF0pO1xuICB0YWJzQ29udGFpbmVyLmFwcGVuZENoaWxkKHRhYlJhZGlvKTtcbiAgdGFic0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2RlVGFiKTtcbn07XG5cbmNvbnN0IGNyZWF0ZVRhYnNDb250YWluZXIgPSBmdW5jdGlvbiAoZnJhbWVJRCkge1xuICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgY29udGFpbmVyLmlkID0gZnJhbWVJRDtcbiAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ2NvZGUtdGFicycpO1xuICByZXR1cm4gY29udGFpbmVyO1xufTtcblxuY29uc3QgZ2V0T3JDcmVhdGVUYWJzQ29udGFpbmVyID0gZnVuY3Rpb24gKGZyYW1lSUQsIHByZVRhZykge1xuICBmcmFtZUlEID0gZnJhbWVJRCB8fCAnbmVwdHVuZS1mcmFtZS0nICsgKGF1dG9Db3VudGVyKyspO1xuICBsZXQgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZnJhbWVJRCk7XG5cbiAgaWYgKGNvbnRhaW5lciA9PSBudWxsKSB7XG4gICAgY29udGFpbmVyID0gY3JlYXRlVGFic0NvbnRhaW5lcihmcmFtZUlEKTtcbiAgICBwcmVUYWcucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY29udGFpbmVyLCBwcmVUYWcpO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChUb29sYmFyKCkpO1xuICB9IGVsc2Uge1xuICAgIHByZVRhZy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHByZVRhZyk7XG4gIH1cblxuICByZXR1cm4gY29udGFpbmVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocHJlVGFnLCBjb2RlVGFnKSB7XG4gIC8vIFBhcnNlIG9wdGlvbnMgZnJvbSBtYXJrZG93blxuICBjb25zdCBvcHRpb25zID0gSlNPTi5wYXJzZShjb2RlVGFnLmRhdGFzZXQub3B0aW9ucyk7XG4gIGNvbnN0IGZyYW1lSUQgPSBvcHRpb25zWydmcmFtZSddO1xuICBjb25zdCB0aXRsZSA9IG9wdGlvbnNbJ3RpdGxlJ107XG5cbiAgLy8gQ3JlYXRlIChvciBnZXQgaWYgZXhpc3RzKSB0aGUgdGFicyBmcmFtZSBjb250YWluZXJcbiAgY29uc3QgdGFic0NvbnRhaW5lciA9IGdldE9yQ3JlYXRlVGFic0NvbnRhaW5lcihmcmFtZUlELCBwcmVUYWcpO1xuXG4gIC8vIEFkZCB0aGlzIDxwcmU+PGNvZGU+IHRhZ3MgYXMgYSB0YWIgdG8gdGhlIGNvbnRhaW5lclxuICBjcmVhdGVUYWIodGl0bGUsIHRhYnNDb250YWluZXIsIHByZVRhZywgb3B0aW9ucyk7XG5cbiAgLy8gYWRkIHRyYW5zcGFyZW50IHRleHQgYXJlYSB0aGF0IG1pbWljcyB0aGUgY29kZSB0YWdcbiAgcHJlVGFnLmFwcGVuZENoaWxkKEVkaXRvcihjb2RlVGFnKSk7XG59O1xuIiwiY29uc3Qgc2NvcGVkRXZhbCA9IHJlcXVpcmUoJy4vZXZhbC5qcycpO1xuY29uc3Qgc2VydmVyRXhlYyA9IHJlcXVpcmUoJy4vc2VydmVyRXhlYy5qcycpO1xuXG4vLyBoYW5kbGVzIGNsaWNraW5nIG9uIGEgcnVuIGljb24gZm9yIG5vbi1qYXZhc2NyaXB0IGNvZGUhXG5jb25zdCBleGVjdXRlTm9uSmF2YXNjcmlwdCA9IGZ1bmN0aW9uIChjb2RlLCBsYW5ndWFnZSwgdGFiSUQpIHtcbiAgaWYgKGxhbmd1YWdlID09PSAnY3NzJykge1xuICAgIGNvZGUgPSAnPHN0eWxlPicrY29kZSsnPC9zdHlsZT4nO1xuICB9XG5cbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFiSUQgKyAnLW91dHB1dCcpLmlubmVySFRNTCA9IGNvZGU7XG59XG5cbi8vIGhhbmRsZXMgY2xpY2tpbmcgb24gYW4gaWNvbiBpbiB0aGUgY29kZSB0b29sYmFyXG5jb25zdCB0b29sYmFyQ2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IHR5cGUgPSB0aGlzLmNoaWxkcmVuWzBdLmNsYXNzTGlzdFsxXS5zcGxpdCgnLScpLnNsaWNlKDEpLmpvaW4oJy0nKTtcblxuICBjb25zdCB0YWJJRCA9IHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlLmRhdGFzZXQuc2VsZWN0ZWQ7XG4gIGNvbnN0IHRhYlJhZGlvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFiSUQpO1xuICBjb25zdCB0YWJMYWJlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhYklEICsgJy1sYWJlbCcpO1xuICBjb25zdCBjb2RlVGFiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFiSUQgKyAnLXRhYicpO1xuICBjb25zdCBjb2RlVGFnID0gY29kZVRhYi5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29kZScpWzBdO1xuICBjb25zdCB0ZXh0QXJlYVRhZyA9IGNvZGVUYWIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RleHRhcmVhJylbMF07XG4gIGNvbnN0IG91dHB1dFBhbmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFiSUQgKyAnLW91dHB1dCcpO1xuXG4gIGNvbnN0IG9wdGlvbnMgPSBKU09OLnBhcnNlKGNvZGVUYWcuZGF0YXNldC5vcHRpb25zKTtcblxuICBsZXQgcmFuZ2U7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ2NvcHknOlxuICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZShjb2RlVGFnKTtcbiAgICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5hZGRSYW5nZShyYW5nZSk7XG4gICAgICBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xuICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICd0cmFzaCc6XG4gICAgICB0ZXh0QXJlYVRhZy52YWx1ZSA9ICcnO1xuICAgICAgdGV4dEFyZWFUYWcuaGFuZGxlcigpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdwbGF5JzpcbiAgICAgIG91dHB1dFBhbmVsLnJlc2V0KCk7XG4gICAgICBpZiAob3B0aW9uc1snbGFuZ3VhZ2UnXSA9PT0gJ2phdmFzY3JpcHQnKSB7XG4gICAgICAgIGlmIChvcHRpb25zWydlbnYnXSA9PT0gJ3NlcnZlcicpIHtcbiAgICAgICAgICBzZXJ2ZXJFeGVjKGNvZGVUYWcudGV4dENvbnRlbnQsIG9wdGlvbnNbJ3Njb3BlJ10sIHRhYklEKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzY29wZWRFdmFsKGNvZGVUYWcudGV4dENvbnRlbnQsIG9wdGlvbnNbJ3Njb3BlJ10sIHRhYklEKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXhlY3V0ZU5vbkphdmFzY3JpcHQoY29kZVRhZy50ZXh0Q29udGVudCwgb3B0aW9uc1snbGFuZ3VhZ2UnXSwgdGFiSUQpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdhcnJvdy11cCc6XG4gICAgICB0YWJSYWRpby5jaGVja2VkID0gZmFsc2U7XG4gICAgICB0YWJMYWJlbC5jbGFzc0xpc3QucmVtb3ZlKCd0YWItbGFiZWwtc2VsZWN0ZWQnKTtcbiAgICAgIHRoaXMuY2hpbGRyZW5bMF0uY2xhc3NMaXN0LnJlbW92ZSgnZmEtYXJyb3ctdXAnKTtcbiAgICAgIHRoaXMuY2hpbGRyZW5bMF0uY2xhc3NMaXN0LmFkZCgnZmEtYXJyb3ctZG93bicpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdhcnJvdy1kb3duJzpcbiAgICAgIHRhYlJhZGlvLmNoZWNrZWQgPSB0cnVlO1xuICAgICAgdGFiTGFiZWwuY2xhc3NMaXN0LmFkZCgndGFiLWxhYmVsLXNlbGVjdGVkJyk7XG4gICAgICB0aGlzLmNoaWxkcmVuWzBdLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhLWFycm93LWRvd24nKTtcbiAgICAgIHRoaXMuY2hpbGRyZW5bMF0uY2xhc3NMaXN0LmFkZCgnZmEtYXJyb3ctdXAnKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnZXllLXNsYXNoJzpcbiAgICAgIHRoaXMuY2hpbGRyZW5bMF0uY2xhc3NMaXN0LnJlbW92ZSgnZmEtZXllLXNsYXNoJyk7XG4gICAgICB0aGlzLmNoaWxkcmVuWzBdLmNsYXNzTGlzdC5hZGQoJ2ZhLWV5ZScpO1xuICAgICAgQXJyYXkuZnJvbSh0aGlzLnBhcmVudE5vZGUucGFyZW50Tm9kZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdvdXRwdXQtcGFuZWwnKSkubWFwKGZ1bmN0aW9uIChwYW5lbCkge1xuICAgICAgICBwYW5lbC5oaWRlKCk7XG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnZXllJzpcbiAgICAgIHRoaXMuY2hpbGRyZW5bMF0uY2xhc3NMaXN0LnJlbW92ZSgnZmEtZXllJyk7XG4gICAgICB0aGlzLmNoaWxkcmVuWzBdLmNsYXNzTGlzdC5hZGQoJ2ZhLWV5ZS1zbGFzaCcpO1xuICAgICAgQXJyYXkuZnJvbSh0aGlzLnBhcmVudE5vZGUucGFyZW50Tm9kZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdvdXRwdXQtcGFuZWwnKSkubWFwKGZ1bmN0aW9uIChwYW5lbCkge1xuICAgICAgICBwYW5lbC51bmhpZGUoKTtcbiAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gIH1cbn07XG5cbi8vIGNyZWF0ZXMgSFRNTCBlbGVtZW50cyBmb3IgdGhlIHRvb2xiYXIgb24gdG9wIG9mIDxjb2RlPiB0YWdzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjb2RlLXRvcC10b29sYmFyJyk7XG4gIGVsZW1lbnQuaW5uZXJIVE1MID0gJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48aSBjbGFzcz1cImZhIGZhLXBsYXlcIj48L2k+PC9hPicgK1xuICAgICc8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+PGkgY2xhc3M9XCJmYSBmYS1jb3B5XCI+PC9pPjwvYT4nICtcbiAgICAnPGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2hcIj48L2k+PC9hPicgK1xuICAgICc8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+PGkgY2xhc3M9XCJmYSBmYS1leWUtc2xhc2hcIj48L2k+PC9hPicgK1xuICAgICc8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+PGkgY2xhc3M9XCJmYSBmYS1hcnJvdy11cFwiPjwvaT48L2E+JztcblxuICBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGRyZW4pLm1hcChmdW5jdGlvbiAoYVRhZykge1xuICAgIGFUYWcub25jbGljayA9IHRvb2xiYXJDbGljaztcbiAgfSk7XG5cbiAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuIl19
