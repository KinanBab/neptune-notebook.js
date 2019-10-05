(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
 */

// Store all scopes
const $__scopes__$ = {};

// creates the function without a closure (in global scope)
// protects the scope of this file and other neptune files from interferance from inside eval
const $__eval__$ = function $__eval__$(Console, $__code__$) {
  // Quine for scoping evals: relies on function closures to return a handler to the scope after an eval is executed!
  // Simplified fiddle to help understand why this quine is useful: https://jsfiddle.net/kjvo6h2x/
  try {
    $__code__$ += '\n';
    $__code__$ += $__eval__$.toString();
    $__code__$ += '$__eval__$;';
    return eval($__code__$);
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
},{}],2:[function(require,module,exports){
// format arguments as if console.log
module.exports = function () {
  let msg = '';

  // loop over arguments and format each
  for (let i = 0; i < arguments.length; i++) {
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
        let stackStr = arguments[i].stack.toString().split('\n').join('\n\t\t');
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

},{}],3:[function(require,module,exports){
module.exports = function (preTag, codeTag) {
  // Parse options from markdown
  const options = JSON.parse(codeTag.dataset.options);

  // create placeholder span element and put code inside it!
  let element;
  if (options['language'] === 'javascript') {
    element = document.createElement('script');
    element.type = 'text/javascript';
    element.innerHTML = codeTag.textContent;
  } else if (options['language'] === 'css') {
    element = document.createElement('style');
    element.innerHTML = codeTag.textContent;
  } else {
    element = document.createElement('span');
    element.innerHTML = codeTag.textContent;
  }

  // replace <pre> with this
  preTag.parentNode.replaceChild(element, preTag);
};

},{}],4:[function(require,module,exports){
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
      language: 'javascript',
      inject: false
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

},{"./inject.js":3,"./tabs.js":7}],5:[function(require,module,exports){
const formatter = require('./formatter.js');

function lineHeader () {
  const user = this.dataset.user;
  const host = this.dataset.host;
  return '<span class="output-line-span">[' + user + '@' + host + '] $</span> | ';
}

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

  const lineHeader = this.lineHeader();
  this.children[0].innerHTML += lineHeader + output.split('\n').join('\n' + lineHeader);
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
  if (options['language'] === 'javascript') {
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
  outputElement.dataset.language = options['language'];

  // bind logging functions to output panel HTML element
  outputElement.reset = reset.bind(outputElement);
  outputElement.hide = hide.bind(outputElement);
  outputElement.unhide = unhide.bind(outputElement);
  outputElement.lineHeader = lineHeader.bind(outputElement);

  return outputElement;
};

},{"./formatter.js":2}],6:[function(require,module,exports){
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
const OutputPanel = require('./outputPanel.js');

let autoCounter = 0;

const createTab = function (title, tabsContainer, code, options) {
  const tabRadio = document.createElement('input');
  const tabLabel = document.createElement('label');
  const codeTab = document.createElement('div');

  // create ID for radio
  const count = tabsContainer.getElementsByTagName('input').length;
  const tabID = tabsContainer.id + '-tab-' + (count + 1);

  // Code mirror HTML elements
  const editorDiv = document.createElement('div');
  editorDiv.classList.add('code-mirror-div');
  editorDiv.dataset.options = JSON.stringify(options);

  let mode = options['language'].toLowerCase();
  if (mode === 'html') {
    mode += 'mixed';
  }
  editorDiv.codeMirrorInstance = CodeMirror(editorDiv, {
    value: code.trim(),
    mode: mode,
    lineNumbers: true,
    theme: 'darcula',
    viewportMargin: Infinity
  });
  if (count === 0) {
    setTimeout(function () {
      editorDiv.codeMirrorInstance.refresh();
    }, 1);
  }

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
    // refresh code mirror
    editorDiv.codeMirrorInstance.refresh();
  };

  // style container
  codeTab.id = tabID + '-tab';
  codeTab.classList.add('code-tab');

  // append code mirror
  codeTab.appendChild(editorDiv);

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
  createTab(title, tabsContainer, codeTag.textContent, options);
};

},{"./outputPanel.js":5,"./toolbar.js":8}],8:[function(require,module,exports){
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
  const outputPanel = document.getElementById(tabID + '-output');
  const codeMirrorDiv = codeTab.getElementsByClassName('code-mirror-div')[0];
  const codeMirrorInstance = codeMirrorDiv.codeMirrorInstance;

  const options = JSON.parse(codeMirrorDiv.dataset.options);

  let range;
  switch (type) {
    case 'copy':
      window.getSelection().removeAllRanges();
      range = document.createRange();
      range.selectNode(codeMirrorDiv);
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      break;

    case 'trash':
      codeMirrorInstance.setValue('');
      break;

    case 'play':
      outputPanel.reset();
      if (options['language'] === 'javascript') {
        if (options['env'] === 'server') {
          serverExec(codeMirrorInstance.getValue(), options['scope'], tabID);
        } else {
          scopedEval(codeMirrorInstance.getValue(), options['scope'], tabID);
        }
      } else {
        executeNonJavascript(codeMirrorInstance.getValue(), options['language'], tabID);
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

},{"./eval.js":1,"./serverExec.js":6}]},{},[4]);
