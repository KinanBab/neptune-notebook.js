(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* global Prism */

// bind input to the textarea to the code tag
const codeInputHandler = function (codeTag, textAreaTag) {
  let code = textAreaTag.value;
  if (code === '') { // avoid switching to a terminal!
    code = ' ';
  }

  codeTag.innerHTML = code;
  Prism.highlightElement(codeTag);
};

// creates a transparent textarea that serves as an 'editor' for the code in
// the associated <code> tag
module.exports = function (codeTag) {
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
    'let $__eval__$;' +
    '$__eval__$ = function $__eval__$($__code__$) {' +
      'eval($__code__$);' +
      'eval($__eval__$.toString());' +
      'return $__eval__$;' +
    '};' + // function is returned by this statement
  '");'
)();

// determine scope and eval within it!
module.exports = function (code, scopeName) {
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

},{"./tabs.js":5}],4:[function(require,module,exports){
// Execute this code using in the given scope name in the server via node, and get back results!
module.exports = function (code, scopeName) {
  if (window.$__offline__$) {
    alert('Cannot execute server-side code while offline!');
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open('POST', window.location.href + '/__exec');
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log(JSON.parse(xhr.responseText));
    }
  };
  xhr.send(JSON.stringify({scopeName: scopeName, code: code}));
};

},{}],5:[function(require,module,exports){
/*
 * dependencies
 */
const Toolbar = require('./toolbar.js');
const Editor = require('./editor.js');

let autoCounter = 0;

const createTab = function (title, tabsContainer, preTag) {
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

  // add toolbar and <pre> tag
  codeTab.appendChild(Toolbar());
  codeTab.appendChild(preTag);

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
  createTab(title, tabsContainer, preTag);

  // add transparent text area that mimics the code tag
  preTag.appendChild(Editor(codeTag));
};

},{"./editor.js":1,"./toolbar.js":6}],6:[function(require,module,exports){
const scopedEval = require('./eval.js');
const serverExec = require('./serverExec.js');

// handles clicking on an icon in the code toolbar
const toolbarClick = function () {
  const type = this.children[0].classList[1].split('-')[1];
  const codeTag = this.parentNode.parentNode.getElementsByTagName('code')[0];
  const textAreaTag = this.parentNode.parentNode.getElementsByTagName('textarea')[0];
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
      if (options['env'] === 'server') {
        serverExec(codeTag.textContent, options['scope']);
      } else {
        scopedEval(codeTag.textContent, options['scope']);
      }
      break;
  }
};

// creates HTML elements for the toolbar on top of <code> tags
module.exports = function (handler=toolbarClick) {
  const element = document.createElement('div');
  element.classList.add('code-toolbar');
  element.innerHTML = '<a href="javascript:void(0)"><i class="fa fa-play"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-copy"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-trash"></i></a>';

  Array.from(element.children).map(function (aTag) {
    aTag.onclick = handler;
  });

  return element;
};

},{"./eval.js":2,"./serverExec.js":4}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9zdGF0aWNzL2Jyb3dzZXJpZnkvZWRpdG9yLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9ldmFsLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9uZXB0dW5lLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9zZXJ2ZXJFeGVjLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS90YWJzLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS90b29sYmFyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKiBnbG9iYWwgUHJpc20gKi9cblxuLy8gYmluZCBpbnB1dCB0byB0aGUgdGV4dGFyZWEgdG8gdGhlIGNvZGUgdGFnXG5jb25zdCBjb2RlSW5wdXRIYW5kbGVyID0gZnVuY3Rpb24gKGNvZGVUYWcsIHRleHRBcmVhVGFnKSB7XG4gIGxldCBjb2RlID0gdGV4dEFyZWFUYWcudmFsdWU7XG4gIGlmIChjb2RlID09PSAnJykgeyAvLyBhdm9pZCBzd2l0Y2hpbmcgdG8gYSB0ZXJtaW5hbCFcbiAgICBjb2RlID0gJyAnO1xuICB9XG5cbiAgY29kZVRhZy5pbm5lckhUTUwgPSBjb2RlO1xuICBQcmlzbS5oaWdobGlnaHRFbGVtZW50KGNvZGVUYWcpO1xufTtcblxuLy8gY3JlYXRlcyBhIHRyYW5zcGFyZW50IHRleHRhcmVhIHRoYXQgc2VydmVzIGFzIGFuICdlZGl0b3InIGZvciB0aGUgY29kZSBpblxuLy8gdGhlIGFzc29jaWF0ZWQgPGNvZGU+IHRhZ1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29kZVRhZykge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjb2RlLWVkaXRvcicpO1xuICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnc3BlbGxjaGVjaycsICdmYWxzZScpO1xuXG4gIC8vIGV4cG9zZSBoYW5kbGVyIGZvciBpbnB1dCBiaW5kaW5nXG4gIGVsZW1lbnQuaGFuZGxlciA9IGNvZGVJbnB1dEhhbmRsZXIuYmluZChudWxsLCBjb2RlVGFnLCBlbGVtZW50KTtcblxuICAvLyBsaXN0ZW4gdG8gYW55IGlucHV0IGNoYW5nZXNcbiAgaWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBlbGVtZW50LmhhbmRsZXIpO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQuYXR0YWNoRXZlbnQpIHsgLy8gZm9yIElFMTFcbiAgICBlbGVtZW50LmF0dGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgZWxlbWVudC5oYW5kbGVyKTtcbiAgfVxuXG4gIC8vIHB1dCBjb2RlIGluIHRleHRhcmVhXG4gIGVsZW1lbnQudmFsdWUgPSBjb2RlVGFnLnRleHRDb250ZW50O1xuXG4gIHJldHVybiBlbGVtZW50O1xufTtcbiIsIi8vIFN0b3JlIGFsbCBzY29wZXNcbmNvbnN0IHNjb3BlcyA9IHt9O1xuXG4vLyBjcmVhdGVzIHRoZSBmdW5jdGlvbiB3aXRob3V0IGEgY2xvc3VyZSAoaW4gZ2xvYmFsIHNjb3BlKVxuLy8gcHJvdGVjdHMgdGhlIHNjb3BlIG9mIHRoaXMgZmlsZSBhbmQgb3RoZXIgbmVwdHVuZSBmaWxlcyBmcm9tIGludGVyZmVyYW5jZSBmcm9tIGluc2lkZSBldmFsXG5jb25zdCAkX19ldmFsX18kID0gbmV3IEZ1bmN0aW9uKFxuICAncmV0dXJuIGV2YWwoXCInICtcbiAgICAvLyBRdWluZSBmb3Igc2NvcGluZyBldmFsc1xuICAgIC8vIFNpbXBsaWZpZWQgZmlkZGxlIHRvIGhlbHAgdW5kZXJzdGFuZCB3aHkgdGhpcyBxdWluZSBpcyB1c2VmdWw6IGh0dHBzOi8vanNmaWRkbGUubmV0L2tqdm82aDJ4L1xuICAgICdsZXQgJF9fZXZhbF9fJDsnICtcbiAgICAnJF9fZXZhbF9fJCA9IGZ1bmN0aW9uICRfX2V2YWxfXyQoJF9fY29kZV9fJCkgeycgK1xuICAgICAgJ2V2YWwoJF9fY29kZV9fJCk7JyArXG4gICAgICAnZXZhbCgkX19ldmFsX18kLnRvU3RyaW5nKCkpOycgK1xuICAgICAgJ3JldHVybiAkX19ldmFsX18kOycgK1xuICAgICd9OycgKyAvLyBmdW5jdGlvbiBpcyByZXR1cm5lZCBieSB0aGlzIHN0YXRlbWVudFxuICAnXCIpOydcbikoKTtcblxuLy8gZGV0ZXJtaW5lIHNjb3BlIGFuZCBldmFsIHdpdGhpbiBpdCFcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvZGUsIHNjb3BlTmFtZSkge1xuICBpZiAoc2NvcGVOYW1lID09IG51bGwpIHtcbiAgICBzY29wZU5hbWUgPSAnJF9fREVGQVVMVF9fJCc7XG4gIH1cblxuICAvLyBjcmVhdGUgZW1wdHkgc2NvcGUgaWYgaXQgZG9lcyBub3QgZXhpc3RcbiAgaWYgKHNjb3Blc1tzY29wZU5hbWVdID09IG51bGwpIHtcbiAgICBzY29wZXNbc2NvcGVOYW1lXSA9ICRfX2V2YWxfXyQ7XG4gIH1cblxuICAvLyBldmFsIHdpdGhpbiBzY29wZVxuICBzY29wZXNbc2NvcGVOYW1lXSA9IHNjb3Blc1tzY29wZU5hbWVdKGNvZGUpO1xufTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IFRhYnMgPSByZXF1aXJlKCcuL3RhYnMuanMnKTtcblxuICAvKlxuICAgKiBEZXRlY3QgPHByZT4gYW5kIDxjb2RlPiB0YWdzIG9mIGludGVyZXN0XG4gICAqL1xuICBjb25zdCBwcmVUYWdzID0gQXJyYXkuZnJvbShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgncHJlJykpO1xuICBjb25zdCBjb2RlVGFncyA9IHByZVRhZ3MubWFwKGZ1bmN0aW9uIChwcmVUYWcpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShwcmVUYWcuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvZGUnKSk7XG4gIH0pLnJlZHVjZShmdW5jdGlvbiAoY29kZVRhZ3MxLCBjb2RlVGFnczIpIHtcbiAgICByZXR1cm4gY29kZVRhZ3MxLmNvbmNhdChjb2RlVGFnczIpO1xuICB9LCBbXSkuZmlsdGVyKGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgcmV0dXJuIGNvZGVUYWcuY2xhc3NOYW1lLmluZGV4T2YoJ2xhbmd1YWdlLW5lcHR1bmUnKSA+IC0xO1xuICB9KTtcblxuICAvKlxuICAgKiBIZWxwZXIgZnVuY3Rpb25zXG4gICAqL1xuICBjb25zdCBnZXRPcHRpb25zID0gZnVuY3Rpb24gKGNvZGVUYWcpIHtcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIHRpdGxlOiAnSmF2YXNjcmlwdCcsXG4gICAgICBlbnY6ICdicm93c2VyJ1xuICAgIH07XG5cbiAgICAvLyByZXN1bHRcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMpO1xuICAgIGNvbnN0IGFkZE9wdGlvbiA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICAgICAgb3B0aW9uc1trZXldID0gdmFsO1xuXG4gICAgICBpZiAoa2V5ID09PSAnZW52JyAmJiBvcHRpb25zWyd0aXRsZSddID09PSBkZWZhdWx0T3B0aW9uc1sndGl0bGUnXSkge1xuICAgICAgICBvcHRpb25zWyd0aXRsZSddID0gdmFsO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBwYXJzZSBvcHRpb25zXG4gICAgZm9yIChsZXQgY2xhc3NOYW1lIG9mIGNvZGVUYWcuY2xhc3NMaXN0KSB7XG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUudHJpbSgpO1xuICAgICAgaWYgKCFjbGFzc05hbWUuc3RhcnRzV2l0aCgnbmVwdHVuZScpIHx8IGNsYXNzTmFtZS5pbmRleE9mKCdbJykgPT09IC0xKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUuc3Vic3RyaW5nKCgnbmVwdHVuZVsnKS5sZW5ndGgsIGNsYXNzTmFtZS5sZW5ndGgtMSk7XG4gICAgICBjbGFzc05hbWUuc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKG9wdGlvbikge1xuICAgICAgICBjb25zdCBpbmRleCA9IG9wdGlvbi5pbmRleE9mKCc9Jyk7XG4gICAgICAgIGNvbnN0IGtleSA9IG9wdGlvbi5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICBjb25zdCB2YWwgPSBvcHRpb24uc3Vic3RyaW5nKGluZGV4ICsgMSk7XG4gICAgICAgIGFkZE9wdGlvbihrZXksIHZhbCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfTtcblxuICBjb25zdCBzdHlsZUNvZGVCbG9jayA9IGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgY29uc3QgcHJlVGFnID0gY29kZVRhZy5wYXJlbnROb2RlO1xuXG4gICAgLy8gZ2V0IG5lcHR1bmUgY29kZSBvcHRpb25zIGZyb20gbWFya2Rvd25cbiAgICBjb25zdCBvcHRpb25zID0gZ2V0T3B0aW9ucyhjb2RlVGFnKTtcbiAgICBjb2RlVGFnLmRhdGFzZXQub3B0aW9ucyA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpO1xuXG4gICAgLy8gTWFrZSBzdXJlIFBSSVNNIHVuZGVyc3RhbmRzIHRoYXQgdGhpcyBpcyBKU1xuICAgIGNvZGVUYWcuY2xhc3NOYW1lID0gJ2xhbmd1YWdlLWphdmFzY3JpcHQnO1xuICAgIHByZVRhZy5jbGFzc05hbWUgPSAnbGFuZ3VhZ2UtamF2YXNjcmlwdCc7XG4gICAgcHJlVGFnLmNsYXNzTGlzdC5hZGQoJ2xpbmUtbnVtYmVycycpOyAvLyBhZGQgbGluZSBudW1iZXJpbmdcblxuICAgIC8vIFN0eWxlIGNvZGUgYXMgYSB0YWJiZWQgZnJhbWUgd2l0aCBhIHRvb2xiYXIgYW5kIGVkaXRvciFcbiAgICBUYWJzKHByZVRhZywgY29kZVRhZyk7XG4gIH07XG5cbiAgLypcbiAgICogQXBwbHkgc3R5bGluZyBhbmQgZnVuY3Rpb25hbGl0eVxuICAgKi9cbiAgY29kZVRhZ3MubWFwKGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgc3R5bGVDb2RlQmxvY2soY29kZVRhZyk7XG4gIH0pO1xufSkoKTtcbiIsIi8vIEV4ZWN1dGUgdGhpcyBjb2RlIHVzaW5nIGluIHRoZSBnaXZlbiBzY29wZSBuYW1lIGluIHRoZSBzZXJ2ZXIgdmlhIG5vZGUsIGFuZCBnZXQgYmFjayByZXN1bHRzIVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29kZSwgc2NvcGVOYW1lKSB7XG4gIGlmICh3aW5kb3cuJF9fb2ZmbGluZV9fJCkge1xuICAgIGFsZXJ0KCdDYW5ub3QgZXhlY3V0ZSBzZXJ2ZXItc2lkZSBjb2RlIHdoaWxlIG9mZmxpbmUhJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gIHhoci5vcGVuKCdQT1NUJywgd2luZG93LmxvY2F0aW9uLmhyZWYgKyAnL19fZXhlYycpO1xuICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOFwiKTtcbiAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0ICYmIHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgY29uc29sZS5sb2coSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KSk7XG4gICAgfVxuICB9O1xuICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeSh7c2NvcGVOYW1lOiBzY29wZU5hbWUsIGNvZGU6IGNvZGV9KSk7XG59O1xuIiwiLypcbiAqIGRlcGVuZGVuY2llc1xuICovXG5jb25zdCBUb29sYmFyID0gcmVxdWlyZSgnLi90b29sYmFyLmpzJyk7XG5jb25zdCBFZGl0b3IgPSByZXF1aXJlKCcuL2VkaXRvci5qcycpO1xuXG5sZXQgYXV0b0NvdW50ZXIgPSAwO1xuXG5jb25zdCBjcmVhdGVUYWIgPSBmdW5jdGlvbiAodGl0bGUsIHRhYnNDb250YWluZXIsIHByZVRhZykge1xuICBjb25zdCB0YWJSYWRpbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGNvbnN0IHRhYkxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgY29uc3QgY29kZVRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIC8vIGNyZWF0ZSBJRCBmb3IgcmFkaW9cbiAgY29uc3QgY291bnQgPSB0YWJzQ29udGFpbmVyLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpLmxlbmd0aDtcbiAgY29uc3QgdGFiSUQgPSB0YWJzQ29udGFpbmVyLmlkICsgJy10YWItJyArIChjb3VudCArIDEpO1xuXG4gIC8vIHN0eWxlIGxhYmxlIGFuZCByYWRpb1xuICB0YWJSYWRpby5jbGFzc05hbWUgPSAndGFiLWlucHV0JztcbiAgdGFiUmFkaW8uaWQgPSB0YWJJRDtcbiAgdGFiUmFkaW8ubmFtZSA9IHRhYnNDb250YWluZXIuaWQ7XG4gIHRhYlJhZGlvLnR5cGUgPSAncmFkaW8nO1xuXG4gIHRhYkxhYmVsLmNsYXNzTmFtZSA9ICd0YWItbGFiZWwnO1xuICB0YWJMYWJlbC5pZCA9IHRhYklEICsgJy1sYWJlbCc7XG4gIHRhYkxhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgdGFiSUQpO1xuICB0YWJMYWJlbC5pbm5lckhUTUwgPSB0aXRsZTtcbiAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgdGFiUmFkaW8uc2V0QXR0cmlidXRlKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICB0YWJMYWJlbC5jbGFzc0xpc3QuYWRkKCd0YWItbGFiZWwtc2VsZWN0ZWQnKTtcbiAgICB0YWJzQ29udGFpbmVyLmRhdGFzZXQuc2VsZWN0ZWQgPSB0YWJJRDtcbiAgfVxuXG4gIHRhYlJhZGlvLm9uY2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgIC8vIHJlbW92ZSBzZWxlY3Rpb24gZnJvbSBwcmV2aW91cyBsYWJlbFxuICAgIGNvbnN0IGxhc3RWYWwgPSB0YWJzQ29udGFpbmVyLmRhdGFzZXQuc2VsZWN0ZWQ7XG4gICAgY29uc3QgcHJldkxhYmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobGFzdFZhbCArICctbGFiZWwnKTtcbiAgICBwcmV2TGFiZWwuY2xhc3NMaXN0LnJlbW92ZSgndGFiLWxhYmVsLXNlbGVjdGVkJyk7XG4gICAgLy8gc2VsZWN0IHRoaXMgbGFiZWxcbiAgICB0YWJzQ29udGFpbmVyLmRhdGFzZXQuc2VsZWN0ZWQgPSB0YWJJRDtcbiAgICB0YWJMYWJlbC5jbGFzc0xpc3QuYWRkKCd0YWItbGFiZWwtc2VsZWN0ZWQnKTtcbiAgfTtcblxuICAvLyBzdHlsZSBjb250YWluZXJcbiAgY29kZVRhYi5jbGFzc0xpc3QuYWRkKCdjb2RlLXRhYicpO1xuXG4gIC8vIGFkZCB0b29sYmFyIGFuZCA8cHJlPiB0YWdcbiAgY29kZVRhYi5hcHBlbmRDaGlsZChUb29sYmFyKCkpO1xuICBjb2RlVGFiLmFwcGVuZENoaWxkKHByZVRhZyk7XG5cbiAgLy8gYWRkIHRoZSBjb2RlIGNvbnRhaW5lciB0byB0aGUgdGFic1xuICB0YWJzQ29udGFpbmVyLmluc2VydEJlZm9yZSh0YWJMYWJlbCwgdGFic0NvbnRhaW5lci5jaGlsZHJlbltjb3VudF0pO1xuICB0YWJzQ29udGFpbmVyLmFwcGVuZENoaWxkKHRhYlJhZGlvKTtcbiAgdGFic0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2RlVGFiKTtcbn07XG5cbmNvbnN0IGNyZWF0ZVRhYnNDb250YWluZXIgPSBmdW5jdGlvbiAoZnJhbWVJRCkge1xuICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgY29udGFpbmVyLmlkID0gZnJhbWVJRDtcbiAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ2NvZGUtdGFicycpO1xuICByZXR1cm4gY29udGFpbmVyO1xufTtcblxuY29uc3QgZ2V0T3JDcmVhdGVUYWJzQ29udGFpbmVyID0gZnVuY3Rpb24gKGZyYW1lSUQsIHByZVRhZykge1xuICBmcmFtZUlEID0gZnJhbWVJRCB8fCAnbmVwdHVuZS1mcmFtZS0nICsgKGF1dG9Db3VudGVyKyspO1xuICBsZXQgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZnJhbWVJRCk7XG5cbiAgaWYgKGNvbnRhaW5lciA9PSBudWxsKSB7XG4gICAgY29udGFpbmVyID0gY3JlYXRlVGFic0NvbnRhaW5lcihmcmFtZUlEKTtcbiAgICBwcmVUYWcucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY29udGFpbmVyLCBwcmVUYWcpO1xuICB9IGVsc2Uge1xuICAgIHByZVRhZy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHByZVRhZyk7XG4gIH1cblxuICByZXR1cm4gY29udGFpbmVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocHJlVGFnLCBjb2RlVGFnKSB7XG4gIC8vIFBhcnNlIG9wdGlvbnMgZnJvbSBtYXJrZG93blxuICBjb25zdCBvcHRpb25zID0gSlNPTi5wYXJzZShjb2RlVGFnLmRhdGFzZXQub3B0aW9ucyk7XG4gIGNvbnN0IGZyYW1lSUQgPSBvcHRpb25zWydmcmFtZSddO1xuICBjb25zdCB0aXRsZSA9IG9wdGlvbnNbJ3RpdGxlJ107XG5cbiAgLy8gQ3JlYXRlIChvciBnZXQgaWYgZXhpc3RzKSB0aGUgdGFicyBmcmFtZSBjb250YWluZXJcbiAgY29uc3QgdGFic0NvbnRhaW5lciA9IGdldE9yQ3JlYXRlVGFic0NvbnRhaW5lcihmcmFtZUlELCBwcmVUYWcpO1xuXG4gIC8vIEFkZCB0aGlzIDxwcmU+PGNvZGU+IHRhZ3MgYXMgYSB0YWIgdG8gdGhlIGNvbnRhaW5lclxuICBjcmVhdGVUYWIodGl0bGUsIHRhYnNDb250YWluZXIsIHByZVRhZyk7XG5cbiAgLy8gYWRkIHRyYW5zcGFyZW50IHRleHQgYXJlYSB0aGF0IG1pbWljcyB0aGUgY29kZSB0YWdcbiAgcHJlVGFnLmFwcGVuZENoaWxkKEVkaXRvcihjb2RlVGFnKSk7XG59O1xuIiwiY29uc3Qgc2NvcGVkRXZhbCA9IHJlcXVpcmUoJy4vZXZhbC5qcycpO1xuY29uc3Qgc2VydmVyRXhlYyA9IHJlcXVpcmUoJy4vc2VydmVyRXhlYy5qcycpO1xuXG4vLyBoYW5kbGVzIGNsaWNraW5nIG9uIGFuIGljb24gaW4gdGhlIGNvZGUgdG9vbGJhclxuY29uc3QgdG9vbGJhckNsaWNrID0gZnVuY3Rpb24gKCkge1xuICBjb25zdCB0eXBlID0gdGhpcy5jaGlsZHJlblswXS5jbGFzc0xpc3RbMV0uc3BsaXQoJy0nKVsxXTtcbiAgY29uc3QgY29kZVRhZyA9IHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjb2RlJylbMF07XG4gIGNvbnN0IHRleHRBcmVhVGFnID0gdGhpcy5wYXJlbnROb2RlLnBhcmVudE5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RleHRhcmVhJylbMF07XG4gIGNvbnN0IG9wdGlvbnMgPSBKU09OLnBhcnNlKGNvZGVUYWcuZGF0YXNldC5vcHRpb25zKTtcblxuICBsZXQgcmFuZ2U7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ2NvcHknOlxuICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZShjb2RlVGFnKTtcbiAgICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5hZGRSYW5nZShyYW5nZSk7XG4gICAgICBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xuICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICd0cmFzaCc6XG4gICAgICB0ZXh0QXJlYVRhZy52YWx1ZSA9ICcnO1xuICAgICAgdGV4dEFyZWFUYWcuaGFuZGxlcigpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdwbGF5JzpcbiAgICAgIGlmIChvcHRpb25zWydlbnYnXSA9PT0gJ3NlcnZlcicpIHtcbiAgICAgICAgc2VydmVyRXhlYyhjb2RlVGFnLnRleHRDb250ZW50LCBvcHRpb25zWydzY29wZSddKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjb3BlZEV2YWwoY29kZVRhZy50ZXh0Q29udGVudCwgb3B0aW9uc1snc2NvcGUnXSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgfVxufTtcblxuLy8gY3JlYXRlcyBIVE1MIGVsZW1lbnRzIGZvciB0aGUgdG9vbGJhciBvbiB0b3Agb2YgPGNvZGU+IHRhZ3Ncbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGhhbmRsZXI9dG9vbGJhckNsaWNrKSB7XG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjb2RlLXRvb2xiYXInKTtcbiAgZWxlbWVudC5pbm5lckhUTUwgPSAnPGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPjxpIGNsYXNzPVwiZmEgZmEtcGxheVwiPjwvaT48L2E+JyArXG4gICAgJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48aSBjbGFzcz1cImZhIGZhLWNvcHlcIj48L2k+PC9hPicgK1xuICAgICc8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaFwiPjwvaT48L2E+JztcblxuICBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGRyZW4pLm1hcChmdW5jdGlvbiAoYVRhZykge1xuICAgIGFUYWcub25jbGljayA9IGhhbmRsZXI7XG4gIH0pO1xuXG4gIHJldHVybiBlbGVtZW50O1xufTtcbiJdfQ==
