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

},{}],3:[function(require,module,exports){
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

},{"./tabs.js":6}],4:[function(require,module,exports){
/* global Prism */

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
    var msg = '';
    for (var i = 0; i < arguments.length; i++) {
      if (typeof(arguments[i]) === 'object') {
        msg += JSON.stringify(arguments[i]) + ' ';
      } else {
        msg += arguments[i] + ' ';
      }
    }
    this.display(msg);
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

},{}],5:[function(require,module,exports){
// Execute this code using in the given scope name in the server via node, and get back results!
module.exports = function (code, scopeName, tabID) {
  if (window.$__offline__$) {
    alert('Cannot execute server-side code while offline!');
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open('POST', window.location.href + '/__exec');
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const outputPanel = document.getElementById(tabID + '-output');
      for (const record of JSON.parse(xhr.responseText)) {
        outputPanel.Console.log.apply(outputPanel, record);
      }
    }
  };
  xhr.send(JSON.stringify({scopeName: scopeName, code: code}));
};

},{}],6:[function(require,module,exports){
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

},{"./editor.js":1,"./outputPanel.js":4,"./toolbar.js":7}],7:[function(require,module,exports){
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

},{"./eval.js":2,"./serverExec.js":5}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9zdGF0aWNzL2Jyb3dzZXJpZnkvZWRpdG9yLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9ldmFsLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9uZXB0dW5lLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9vdXRwdXRQYW5lbC5qcyIsInNyYy9zdGF0aWNzL2Jyb3dzZXJpZnkvc2VydmVyRXhlYy5qcyIsInNyYy9zdGF0aWNzL2Jyb3dzZXJpZnkvdGFicy5qcyIsInNyYy9zdGF0aWNzL2Jyb3dzZXJpZnkvdG9vbGJhci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qIGdsb2JhbCBQcmlzbSAqL1xuXG4vLyBiaW5kIGlucHV0IHRvIHRoZSB0ZXh0YXJlYSB0byB0aGUgY29kZSB0YWdcbmNvbnN0IGNvZGVJbnB1dEhhbmRsZXIgPSBmdW5jdGlvbiAoY29kZVRhZywgdGV4dEFyZWFUYWcpIHtcbiAgdGV4dEFyZWFUYWcuc2Nyb2xsVG9wID0gMDtcbiAgbGV0IGNvZGUgPSB0ZXh0QXJlYVRhZy52YWx1ZTtcblxuICBjb2RlVGFnLmlubmVySFRNTCA9IGNvZGUgKyAnICc7XG4gIFByaXNtLmhpZ2hsaWdodEVsZW1lbnQoY29kZVRhZyk7XG59O1xuXG4vLyBjcmVhdGVzIGEgdHJhbnNwYXJlbnQgdGV4dGFyZWEgdGhhdCBzZXJ2ZXMgYXMgYW4gJ2VkaXRvcicgZm9yIHRoZSBjb2RlIGluXG4vLyB0aGUgYXNzb2NpYXRlZCA8Y29kZT4gdGFnXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gIGNvZGVUYWcuaW5uZXJIVE1MICs9ICcgJztcblxuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjb2RlLWVkaXRvcicpO1xuICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnc3BlbGxjaGVjaycsICdmYWxzZScpO1xuXG4gIC8vIGV4cG9zZSBoYW5kbGVyIGZvciBpbnB1dCBiaW5kaW5nXG4gIGVsZW1lbnQuaGFuZGxlciA9IGNvZGVJbnB1dEhhbmRsZXIuYmluZChudWxsLCBjb2RlVGFnLCBlbGVtZW50KTtcblxuICAvLyBsaXN0ZW4gdG8gYW55IGlucHV0IGNoYW5nZXNcbiAgaWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBlbGVtZW50LmhhbmRsZXIpO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQuYXR0YWNoRXZlbnQpIHsgLy8gZm9yIElFMTFcbiAgICBlbGVtZW50LmF0dGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgZWxlbWVudC5oYW5kbGVyKTtcbiAgfVxuXG4gIC8vIHB1dCBjb2RlIGluIHRleHRhcmVhXG4gIGVsZW1lbnQudmFsdWUgPSBjb2RlVGFnLnRleHRDb250ZW50O1xuXG4gIHJldHVybiBlbGVtZW50O1xufTtcbiIsIi8vIFN0b3JlIGFsbCBzY29wZXNcbmNvbnN0IHNjb3BlcyA9IHt9O1xuXG4vLyBjcmVhdGVzIHRoZSBmdW5jdGlvbiB3aXRob3V0IGEgY2xvc3VyZSAoaW4gZ2xvYmFsIHNjb3BlKVxuLy8gcHJvdGVjdHMgdGhlIHNjb3BlIG9mIHRoaXMgZmlsZSBhbmQgb3RoZXIgbmVwdHVuZSBmaWxlcyBmcm9tIGludGVyZmVyYW5jZSBmcm9tIGluc2lkZSBldmFsXG5jb25zdCAkX19ldmFsX18kID0gbmV3IEZ1bmN0aW9uKFxuICAncmV0dXJuIGV2YWwoXCInICtcbiAgICAvLyBRdWluZSBmb3Igc2NvcGluZyBldmFsc1xuICAgIC8vIFNpbXBsaWZpZWQgZmlkZGxlIHRvIGhlbHAgdW5kZXJzdGFuZCB3aHkgdGhpcyBxdWluZSBpcyB1c2VmdWw6IGh0dHBzOi8vanNmaWRkbGUubmV0L2tqdm82aDJ4L1xuICAgICd2YXIgJF9fZXZhbF9fJDsnICtcbiAgICAnJF9fZXZhbF9fJCA9IGZ1bmN0aW9uICRfX2V2YWxfXyQoJF9fY29kZV9fJCkgeycgK1xuICAgICAgJ2V2YWwoJF9fY29kZV9fJCk7JyArXG4gICAgICAnZXZhbCgkX19ldmFsX18kLnRvU3RyaW5nKCkpOycgK1xuICAgICAgJ3JldHVybiAkX19ldmFsX18kOycgK1xuICAgICd9OycgKyAvLyBmdW5jdGlvbiBpcyByZXR1cm5lZCBieSB0aGlzIHN0YXRlbWVudFxuICAnXCIpOydcbikoKTtcblxuY29uc3QgbG9nTWlkZGxld2FyZUJyb3dzZXIgPSBmdW5jdGlvbiAodGFiSUQpIHtcbiAgcmV0dXJuICd2YXIgQ29uc29sZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFxcJycrdGFiSUQrJy1vdXRwdXRcXCcpLkNvbnNvbGU7Jztcbn1cblxuY29uc3QgbG9nTWlkZGxld2FyZVNlcnZlciA9ICd2YXIgQ29uc29sZSA9IHt9OycgK1xuICAnQ29uc29sZS5sb2cgPSBmdW5jdGlvbiAoKSB7JyArXG4gICAgJ2dsb2JhbC4kX19sb2dzX18kLnB1c2goYXJndW1lbnRzKTsnICtcbiAgJ307JztcblxuLy8gZGV0ZXJtaW5lIHNjb3BlIGFuZCBldmFsIHdpdGhpbiBpdCFcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvZGUsIHNjb3BlTmFtZSwgdGFiSUQpIHtcbiAgY29kZSA9ICh0YWJJRCA/IGxvZ01pZGRsZXdhcmVCcm93c2VyKHRhYklEKSA6IGxvZ01pZGRsZXdhcmVTZXJ2ZXIpICsgY29kZTtcblxuICBpZiAoc2NvcGVOYW1lID09IG51bGwpIHtcbiAgICBzY29wZU5hbWUgPSAnJF9fREVGQVVMVF9fJCc7XG4gIH1cblxuICAvLyBjcmVhdGUgZW1wdHkgc2NvcGUgaWYgaXQgZG9lcyBub3QgZXhpc3RcbiAgaWYgKHNjb3Blc1tzY29wZU5hbWVdID09IG51bGwpIHtcbiAgICBzY29wZXNbc2NvcGVOYW1lXSA9ICRfX2V2YWxfXyQ7XG4gIH1cblxuICAvLyBldmFsIHdpdGhpbiBzY29wZVxuICBzY29wZXNbc2NvcGVOYW1lXSA9IHNjb3Blc1tzY29wZU5hbWVdKGNvZGUpO1xufTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IFRhYnMgPSByZXF1aXJlKCcuL3RhYnMuanMnKTtcblxuICAvKlxuICAgKiBEZXRlY3QgPHByZT4gYW5kIDxjb2RlPiB0YWdzIG9mIGludGVyZXN0XG4gICAqL1xuICBjb25zdCBwcmVUYWdzID0gQXJyYXkuZnJvbShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgncHJlJykpO1xuICBjb25zdCBjb2RlVGFncyA9IHByZVRhZ3MubWFwKGZ1bmN0aW9uIChwcmVUYWcpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShwcmVUYWcuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvZGUnKSk7XG4gIH0pLnJlZHVjZShmdW5jdGlvbiAoY29kZVRhZ3MxLCBjb2RlVGFnczIpIHtcbiAgICByZXR1cm4gY29kZVRhZ3MxLmNvbmNhdChjb2RlVGFnczIpO1xuICB9LCBbXSkuZmlsdGVyKGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgcmV0dXJuIGNvZGVUYWcuY2xhc3NOYW1lLmluZGV4T2YoJ2xhbmd1YWdlLW5lcHR1bmUnKSA+IC0xO1xuICB9KTtcblxuICAvKlxuICAgKiBIZWxwZXIgZnVuY3Rpb25zXG4gICAqL1xuICBjb25zdCBnZXRPcHRpb25zID0gZnVuY3Rpb24gKGNvZGVUYWcpIHtcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIHRpdGxlOiAnSmF2YXNjcmlwdCcsXG4gICAgICBlbnY6ICdicm93c2VyJ1xuICAgIH07XG5cbiAgICAvLyByZXN1bHRcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMpO1xuICAgIGNvbnN0IGFkZE9wdGlvbiA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICAgICAgb3B0aW9uc1trZXldID0gdmFsO1xuXG4gICAgICBpZiAoa2V5ID09PSAnZW52JyAmJiBvcHRpb25zWyd0aXRsZSddID09PSBkZWZhdWx0T3B0aW9uc1sndGl0bGUnXSkge1xuICAgICAgICBvcHRpb25zWyd0aXRsZSddID0gdmFsO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBwYXJzZSBvcHRpb25zXG4gICAgZm9yIChsZXQgY2xhc3NOYW1lIG9mIGNvZGVUYWcuY2xhc3NMaXN0KSB7XG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUudHJpbSgpO1xuICAgICAgaWYgKCFjbGFzc05hbWUuc3RhcnRzV2l0aCgnbmVwdHVuZScpIHx8IGNsYXNzTmFtZS5pbmRleE9mKCdbJykgPT09IC0xKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUuc3Vic3RyaW5nKCgnbmVwdHVuZVsnKS5sZW5ndGgsIGNsYXNzTmFtZS5sZW5ndGgtMSk7XG4gICAgICBjbGFzc05hbWUuc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKG9wdGlvbikge1xuICAgICAgICBjb25zdCBpbmRleCA9IG9wdGlvbi5pbmRleE9mKCc9Jyk7XG4gICAgICAgIGNvbnN0IGtleSA9IG9wdGlvbi5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICBjb25zdCB2YWwgPSBvcHRpb24uc3Vic3RyaW5nKGluZGV4ICsgMSk7XG4gICAgICAgIGFkZE9wdGlvbihrZXksIHZhbCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfTtcblxuICBjb25zdCBzdHlsZUNvZGVCbG9jayA9IGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgY29uc3QgcHJlVGFnID0gY29kZVRhZy5wYXJlbnROb2RlO1xuXG4gICAgLy8gZ2V0IG5lcHR1bmUgY29kZSBvcHRpb25zIGZyb20gbWFya2Rvd25cbiAgICBjb25zdCBvcHRpb25zID0gZ2V0T3B0aW9ucyhjb2RlVGFnKTtcbiAgICBjb2RlVGFnLmRhdGFzZXQub3B0aW9ucyA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpO1xuXG4gICAgLy8gTWFrZSBzdXJlIFBSSVNNIHVuZGVyc3RhbmRzIHRoYXQgdGhpcyBpcyBKU1xuICAgIGNvZGVUYWcuY2xhc3NOYW1lID0gJ2xhbmd1YWdlLWphdmFzY3JpcHQnO1xuICAgIHByZVRhZy5jbGFzc05hbWUgPSAnbGFuZ3VhZ2UtamF2YXNjcmlwdCc7XG4gICAgcHJlVGFnLmNsYXNzTGlzdC5hZGQoJ2xpbmUtbnVtYmVycycpOyAvLyBhZGQgbGluZSBudW1iZXJpbmdcblxuICAgIC8vIFN0eWxlIGNvZGUgYXMgYSB0YWJiZWQgZnJhbWUgd2l0aCBhIHRvb2xiYXIgYW5kIGVkaXRvciFcbiAgICBUYWJzKHByZVRhZywgY29kZVRhZyk7XG4gIH07XG5cbiAgLypcbiAgICogQXBwbHkgc3R5bGluZyBhbmQgZnVuY3Rpb25hbGl0eVxuICAgKi9cbiAgY29kZVRhZ3MubWFwKGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgc3R5bGVDb2RlQmxvY2soY29kZVRhZyk7XG4gIH0pO1xufSkoKTtcbiIsIi8qIGdsb2JhbCBQcmlzbSAqL1xuXG5mdW5jdGlvbiByZXNldCgpIHtcbiAgdGhpcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgdGhpcy5jaGlsZHJlblswXS5pbm5lckhUTUwgPSAnUnVubmluZy4uLic7XG59XG5cbmZ1bmN0aW9uIGRpc3BsYXkob3V0cHV0KSB7XG4gIGlmICh0aGlzLmNoaWxkcmVuWzBdLnRleHRDb250ZW50ID09PSAnUnVubmluZy4uLicpIHtcbiAgICB0aGlzLmNoaWxkcmVuWzBdLmlubmVySFRNTCA9ICcnO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuY2hpbGRyZW5bMF0uaW5uZXJIVE1MICs9ICdcXG4nO1xuICB9XG5cbiAgdGhpcy5jaGlsZHJlblswXS5pbm5lckhUTUwgKz0gb3V0cHV0O1xuICBQcmlzbS5oaWdobGlnaHRFbGVtZW50KHRoaXMuY2hpbGRyZW5bMF0pO1xufVxuXG4vLyBtaW1pYyBjb25zb2xlLmxvZyAvIGNvbnNvbGUudGltZSAvIGV0Y1xuY29uc3QgQ29uc29sZSA9IHtcbiAgLy8gdGhpcyBoZXJlIGlzIGJvdW5kIHRvIHRoZSBvdXRwdXQgcGFuZWwgSFRNTCBlbGVtZW50XG4gIGxvZzogZnVuY3Rpb24gKCkge1xuICAgIHZhciBtc2cgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZihhcmd1bWVudHNbaV0pID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtc2cgKz0gSlNPTi5zdHJpbmdpZnkoYXJndW1lbnRzW2ldKSArICcgJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1zZyArPSBhcmd1bWVudHNbaV0gKyAnICc7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZGlzcGxheShtc2cpO1xuICB9XG59O1xuXG4vLyBjcmVhdGVzIGEgdHJhbnNwYXJlbnQgdGV4dGFyZWEgdGhhdCBzZXJ2ZXMgYXMgYW4gJ2VkaXRvcicgZm9yIHRoZSBjb2RlIGluXG4vLyB0aGUgYXNzb2NpYXRlZCA8Y29kZT4gdGFnXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh0YWJJRCwgb3B0aW9ucykge1xuICAvLyBjcmVhdGUgcHJlIHRhZ1xuICBjb25zdCBwcmVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XG4gIHByZUVsZW1lbnQuaWQgPSB0YWJJRCArICctb3V0cHV0JztcbiAgcHJlRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjb21tYW5kLWxpbmUnKTtcbiAgcHJlRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdvdXRwdXQtcGFuZWwnKTtcblxuICBwcmVFbGVtZW50LmRhdGFzZXQudXNlciA9IG9wdGlvbnNbJ3RpdGxlJ10udG9Mb3dlckNhc2UoKTtcbiAgcHJlRWxlbWVudC5kYXRhc2V0Lmhvc3QgPSBvcHRpb25zWydlbnYnXS50b0xvd2VyQ2FzZSgpOyAgXG4gIFxuICAvLyBjcmVhdGUgY29kZSB0YWdcbiAgY29uc3QgY29kZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjb2RlJyk7XG4gIGNvZGVFbGVtZW50LmNsYXNzTmFtZSA9ICdsYW5ndWFnZS1iYXNoJztcbiAgcHJlRWxlbWVudC5hcHBlbmRDaGlsZChjb2RlRWxlbWVudCk7XG5cbiAgLy8gYmluZCBsb2dnaW5nIGZ1bmN0aW9ucyB0byBvdXRwdXQgcGFuZWwgSFRNTCBlbGVtZW50XG4gIHByZUVsZW1lbnQucmVzZXQgPSByZXNldC5iaW5kKHByZUVsZW1lbnQpO1xuICBwcmVFbGVtZW50LmRpc3BsYXkgPSBkaXNwbGF5LmJpbmQocHJlRWxlbWVudCk7XG4gIHByZUVsZW1lbnQuQ29uc29sZSA9IHt9O1xuICBmb3IgKGNvbnN0IGF0dHIgaW4gQ29uc29sZSkge1xuICAgIHByZUVsZW1lbnQuQ29uc29sZVthdHRyXSA9IENvbnNvbGVbYXR0cl0uYmluZChwcmVFbGVtZW50KTtcbiAgfVxuICBcbiAgcmV0dXJuIHByZUVsZW1lbnQ7XG59O1xuIiwiLy8gRXhlY3V0ZSB0aGlzIGNvZGUgdXNpbmcgaW4gdGhlIGdpdmVuIHNjb3BlIG5hbWUgaW4gdGhlIHNlcnZlciB2aWEgbm9kZSwgYW5kIGdldCBiYWNrIHJlc3VsdHMhXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb2RlLCBzY29wZU5hbWUsIHRhYklEKSB7XG4gIGlmICh3aW5kb3cuJF9fb2ZmbGluZV9fJCkge1xuICAgIGFsZXJ0KCdDYW5ub3QgZXhlY3V0ZSBzZXJ2ZXItc2lkZSBjb2RlIHdoaWxlIG9mZmxpbmUhJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gIHhoci5vcGVuKCdQT1NUJywgd2luZG93LmxvY2F0aW9uLmhyZWYgKyAnL19fZXhlYycpO1xuICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOFwiKTtcbiAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0ICYmIHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgY29uc3Qgb3V0cHV0UGFuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWJJRCArICctb3V0cHV0Jyk7XG4gICAgICBmb3IgKGNvbnN0IHJlY29yZCBvZiBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpKSB7XG4gICAgICAgIG91dHB1dFBhbmVsLkNvbnNvbGUubG9nLmFwcGx5KG91dHB1dFBhbmVsLCByZWNvcmQpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoe3Njb3BlTmFtZTogc2NvcGVOYW1lLCBjb2RlOiBjb2RlfSkpO1xufTtcbiIsIi8qXG4gKiBkZXBlbmRlbmNpZXNcbiAqL1xuY29uc3QgVG9vbGJhciA9IHJlcXVpcmUoJy4vdG9vbGJhci5qcycpO1xuY29uc3QgRWRpdG9yID0gcmVxdWlyZSgnLi9lZGl0b3IuanMnKTtcbmNvbnN0IE91dHB1dFBhbmVsID0gcmVxdWlyZSgnLi9vdXRwdXRQYW5lbC5qcycpO1xuXG5sZXQgYXV0b0NvdW50ZXIgPSAwO1xuXG5jb25zdCBjcmVhdGVUYWIgPSBmdW5jdGlvbiAodGl0bGUsIHRhYnNDb250YWluZXIsIHByZVRhZywgb3B0aW9ucykge1xuICBjb25zdCB0YWJSYWRpbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGNvbnN0IHRhYkxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgY29uc3QgY29kZVRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIC8vIGNyZWF0ZSBJRCBmb3IgcmFkaW9cbiAgY29uc3QgY291bnQgPSB0YWJzQ29udGFpbmVyLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpLmxlbmd0aDtcbiAgY29uc3QgdGFiSUQgPSB0YWJzQ29udGFpbmVyLmlkICsgJy10YWItJyArIChjb3VudCArIDEpO1xuXG4gIC8vIHN0eWxlIGxhYmxlIGFuZCByYWRpb1xuICB0YWJSYWRpby5jbGFzc05hbWUgPSAndGFiLWlucHV0JztcbiAgdGFiUmFkaW8uaWQgPSB0YWJJRDtcbiAgdGFiUmFkaW8ubmFtZSA9IHRhYnNDb250YWluZXIuaWQ7XG4gIHRhYlJhZGlvLnR5cGUgPSAncmFkaW8nO1xuXG4gIHRhYkxhYmVsLmNsYXNzTmFtZSA9ICd0YWItbGFiZWwnO1xuICB0YWJMYWJlbC5pZCA9IHRhYklEICsgJy1sYWJlbCc7XG4gIHRhYkxhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgdGFiSUQpO1xuICB0YWJMYWJlbC5pbm5lckhUTUwgPSB0aXRsZTtcbiAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgdGFiUmFkaW8uc2V0QXR0cmlidXRlKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICB0YWJMYWJlbC5jbGFzc0xpc3QuYWRkKCd0YWItbGFiZWwtc2VsZWN0ZWQnKTtcbiAgICB0YWJzQ29udGFpbmVyLmRhdGFzZXQuc2VsZWN0ZWQgPSB0YWJJRDtcbiAgfVxuXG4gIHRhYlJhZGlvLm9uY2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgIC8vIHJlbW92ZSBzZWxlY3Rpb24gZnJvbSBwcmV2aW91cyBsYWJlbFxuICAgIGNvbnN0IGxhc3RWYWwgPSB0YWJzQ29udGFpbmVyLmRhdGFzZXQuc2VsZWN0ZWQ7XG4gICAgY29uc3QgcHJldkxhYmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobGFzdFZhbCArICctbGFiZWwnKTtcbiAgICBwcmV2TGFiZWwuY2xhc3NMaXN0LnJlbW92ZSgndGFiLWxhYmVsLXNlbGVjdGVkJyk7XG4gICAgLy8gc2VsZWN0IHRoaXMgbGFiZWxcbiAgICB0YWJzQ29udGFpbmVyLmRhdGFzZXQuc2VsZWN0ZWQgPSB0YWJJRDtcbiAgICB0YWJMYWJlbC5jbGFzc0xpc3QuYWRkKCd0YWItbGFiZWwtc2VsZWN0ZWQnKTtcbiAgfTtcblxuICAvLyBzdHlsZSBjb250YWluZXJcbiAgY29kZVRhYi5jbGFzc0xpc3QuYWRkKCdjb2RlLXRhYicpO1xuXG4gIC8vIGFkZCB0b29sYmFyIGFuZCA8cHJlPiB0YWcgYW5kIG91dHB1dCBhcmVhXG4gIGNvZGVUYWIuYXBwZW5kQ2hpbGQoVG9vbGJhcih0YWJJRCkpO1xuICBjb2RlVGFiLmFwcGVuZENoaWxkKHByZVRhZyk7XG4gIGNvZGVUYWIuYXBwZW5kQ2hpbGQoT3V0cHV0UGFuZWwodGFiSUQsIG9wdGlvbnMpKTtcblxuICAvLyBhZGQgdGhlIGNvZGUgY29udGFpbmVyIHRvIHRoZSB0YWJzXG4gIHRhYnNDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRhYkxhYmVsLCB0YWJzQ29udGFpbmVyLmNoaWxkcmVuW2NvdW50XSk7XG4gIHRhYnNDb250YWluZXIuYXBwZW5kQ2hpbGQodGFiUmFkaW8pO1xuICB0YWJzQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvZGVUYWIpO1xufTtcblxuY29uc3QgY3JlYXRlVGFic0NvbnRhaW5lciA9IGZ1bmN0aW9uIChmcmFtZUlEKSB7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb250YWluZXIuaWQgPSBmcmFtZUlEO1xuICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCgnY29kZS10YWJzJyk7XG4gIHJldHVybiBjb250YWluZXI7XG59O1xuXG5jb25zdCBnZXRPckNyZWF0ZVRhYnNDb250YWluZXIgPSBmdW5jdGlvbiAoZnJhbWVJRCwgcHJlVGFnKSB7XG4gIGZyYW1lSUQgPSBmcmFtZUlEIHx8ICduZXB0dW5lLWZyYW1lLScgKyAoYXV0b0NvdW50ZXIrKyk7XG4gIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChmcmFtZUlEKTtcblxuICBpZiAoY29udGFpbmVyID09IG51bGwpIHtcbiAgICBjb250YWluZXIgPSBjcmVhdGVUYWJzQ29udGFpbmVyKGZyYW1lSUQpO1xuICAgIHByZVRhZy5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChjb250YWluZXIsIHByZVRhZyk7XG4gIH0gZWxzZSB7XG4gICAgcHJlVGFnLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocHJlVGFnKTtcbiAgfVxuXG4gIHJldHVybiBjb250YWluZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwcmVUYWcsIGNvZGVUYWcpIHtcbiAgLy8gUGFyc2Ugb3B0aW9ucyBmcm9tIG1hcmtkb3duXG4gIGNvbnN0IG9wdGlvbnMgPSBKU09OLnBhcnNlKGNvZGVUYWcuZGF0YXNldC5vcHRpb25zKTtcbiAgY29uc3QgZnJhbWVJRCA9IG9wdGlvbnNbJ2ZyYW1lJ107XG4gIGNvbnN0IHRpdGxlID0gb3B0aW9uc1sndGl0bGUnXTtcblxuICAvLyBDcmVhdGUgKG9yIGdldCBpZiBleGlzdHMpIHRoZSB0YWJzIGZyYW1lIGNvbnRhaW5lclxuICBjb25zdCB0YWJzQ29udGFpbmVyID0gZ2V0T3JDcmVhdGVUYWJzQ29udGFpbmVyKGZyYW1lSUQsIHByZVRhZyk7XG5cbiAgLy8gQWRkIHRoaXMgPHByZT48Y29kZT4gdGFncyBhcyBhIHRhYiB0byB0aGUgY29udGFpbmVyXG4gIGNyZWF0ZVRhYih0aXRsZSwgdGFic0NvbnRhaW5lciwgcHJlVGFnLCBvcHRpb25zKTtcblxuICAvLyBhZGQgdHJhbnNwYXJlbnQgdGV4dCBhcmVhIHRoYXQgbWltaWNzIHRoZSBjb2RlIHRhZ1xuICBwcmVUYWcuYXBwZW5kQ2hpbGQoRWRpdG9yKGNvZGVUYWcpKTtcbn07XG4iLCJjb25zdCBzY29wZWRFdmFsID0gcmVxdWlyZSgnLi9ldmFsLmpzJyk7XG5jb25zdCBzZXJ2ZXJFeGVjID0gcmVxdWlyZSgnLi9zZXJ2ZXJFeGVjLmpzJyk7XG5cbi8vIGhhbmRsZXMgY2xpY2tpbmcgb24gYW4gaWNvbiBpbiB0aGUgY29kZSB0b29sYmFyXG5jb25zdCB0b29sYmFyQ2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IHRhYklEID0gdGhpcy5wYXJlbnROb2RlLmRhdGFzZXQudGFiSUQ7XG4gIGNvbnN0IHR5cGUgPSB0aGlzLmNoaWxkcmVuWzBdLmNsYXNzTGlzdFsxXS5zcGxpdCgnLScpWzFdO1xuICBjb25zdCBjb2RlVGFnID0gdGhpcy5wYXJlbnROb2RlLnBhcmVudE5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvZGUnKVswXTtcbiAgY29uc3QgdGV4dEFyZWFUYWcgPSB0aGlzLnBhcmVudE5vZGUucGFyZW50Tm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGV4dGFyZWEnKVswXTtcbiAgY29uc3Qgb3B0aW9ucyA9IEpTT04ucGFyc2UoY29kZVRhZy5kYXRhc2V0Lm9wdGlvbnMpO1xuICBjb25zdCBvdXRwdXRQYW5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhYklEICsgJy1vdXRwdXQnKTtcblxuICBsZXQgcmFuZ2U7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ2NvcHknOlxuICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZShjb2RlVGFnKTtcbiAgICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5hZGRSYW5nZShyYW5nZSk7XG4gICAgICBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xuICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICd0cmFzaCc6XG4gICAgICB0ZXh0QXJlYVRhZy52YWx1ZSA9ICcnO1xuICAgICAgdGV4dEFyZWFUYWcuaGFuZGxlcigpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdwbGF5JzpcbiAgICAgIG91dHB1dFBhbmVsLnJlc2V0KCk7XG4gICAgICBpZiAob3B0aW9uc1snZW52J10gPT09ICdzZXJ2ZXInKSB7XG4gICAgICAgIHNlcnZlckV4ZWMoY29kZVRhZy50ZXh0Q29udGVudCwgb3B0aW9uc1snc2NvcGUnXSwgdGFiSUQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NvcGVkRXZhbChjb2RlVGFnLnRleHRDb250ZW50LCBvcHRpb25zWydzY29wZSddLCB0YWJJRCk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgfVxufTtcblxuLy8gY3JlYXRlcyBIVE1MIGVsZW1lbnRzIGZvciB0aGUgdG9vbGJhciBvbiB0b3Agb2YgPGNvZGU+IHRhZ3Ncbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHRhYklELCBoYW5kbGVyPXRvb2xiYXJDbGljaykge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnY29kZS10b29sYmFyJyk7XG4gIGVsZW1lbnQuZGF0YXNldC50YWJJRCA9IHRhYklEO1xuICBlbGVtZW50LmlubmVySFRNTCA9ICc8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+PGkgY2xhc3M9XCJmYSBmYS1wbGF5XCI+PC9pPjwvYT4nICtcbiAgICAnPGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPjxpIGNsYXNzPVwiZmEgZmEtY29weVwiPjwvaT48L2E+JyArXG4gICAgJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoXCI+PC9pPjwvYT4nO1xuXG4gIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZHJlbikubWFwKGZ1bmN0aW9uIChhVGFnKSB7XG4gICAgYVRhZy5vbmNsaWNrID0gaGFuZGxlcjtcbiAgfSk7XG5cbiAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuIl19
