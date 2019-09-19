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

},{"./tabs.js":4}],4:[function(require,module,exports){
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

},{"./editor.js":1,"./toolbar.js":5}],5:[function(require,module,exports){
const scopedEval = require('./eval.js');

// handles clicking on an icon in the code toolbar
const toolbarClick = function () {
  const type = this.children[0].classList[1].split('-')[1];
  const codeTag = this.parentNode.parentNode.getElementsByTagName('code')[0];
  const textAreaTag = this.parentNode.parentNode.getElementsByTagName('textarea')[0];

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
      scopedEval(codeTag);
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

},{"./eval.js":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9zdGF0aWNzL2Jyb3dzZXJpZnkvZWRpdG9yLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9ldmFsLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS9uZXB0dW5lLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS90YWJzLmpzIiwic3JjL3N0YXRpY3MvYnJvd3NlcmlmeS90b29sYmFyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKiBnbG9iYWwgUHJpc20gKi9cblxuLy8gYmluZCBpbnB1dCB0byB0aGUgdGV4dGFyZWEgdG8gdGhlIGNvZGUgdGFnXG5jb25zdCBjb2RlSW5wdXRIYW5kbGVyID0gZnVuY3Rpb24gKGNvZGVUYWcsIHRleHRBcmVhVGFnKSB7XG4gIGxldCBjb2RlID0gdGV4dEFyZWFUYWcudmFsdWU7XG4gIGlmIChjb2RlID09PSAnJykgeyAvLyBhdm9pZCBzd2l0Y2hpbmcgdG8gYSB0ZXJtaW5hbCFcbiAgICBjb2RlID0gJyAnO1xuICB9XG5cbiAgY29kZVRhZy5pbm5lckhUTUwgPSBjb2RlO1xuICBQcmlzbS5oaWdobGlnaHRFbGVtZW50KGNvZGVUYWcpO1xufTtcblxuLy8gY3JlYXRlcyBhIHRyYW5zcGFyZW50IHRleHRhcmVhIHRoYXQgc2VydmVzIGFzIGFuICdlZGl0b3InIGZvciB0aGUgY29kZSBpblxuLy8gdGhlIGFzc29jaWF0ZWQgPGNvZGU+IHRhZ1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29kZVRhZykge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjb2RlLWVkaXRvcicpO1xuICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnc3BlbGxjaGVjaycsICdmYWxzZScpO1xuXG4gIC8vIGV4cG9zZSBoYW5kbGVyIGZvciBpbnB1dCBiaW5kaW5nXG4gIGVsZW1lbnQuaGFuZGxlciA9IGNvZGVJbnB1dEhhbmRsZXIuYmluZChudWxsLCBjb2RlVGFnLCBlbGVtZW50KTtcblxuICAvLyBsaXN0ZW4gdG8gYW55IGlucHV0IGNoYW5nZXNcbiAgaWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBlbGVtZW50LmhhbmRsZXIpO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQuYXR0YWNoRXZlbnQpIHsgLy8gZm9yIElFMTFcbiAgICBlbGVtZW50LmF0dGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgZWxlbWVudC5oYW5kbGVyKTtcbiAgfVxuXG4gIC8vIHB1dCBjb2RlIGluIHRleHRhcmVhXG4gIGVsZW1lbnQudmFsdWUgPSBjb2RlVGFnLnRleHRDb250ZW50O1xuXG4gIHJldHVybiBlbGVtZW50O1xufTtcbiIsIi8vIFN0b3JlIGFsbCBzY29wZXNcbmNvbnN0IHNjb3BlcyA9IHt9O1xuXG4vLyBjcmVhdGVzIHRoZSBmdW5jdGlvbiB3aXRob3V0IGEgY2xvc3VyZSAoaW4gZ2xvYmFsIHNjb3BlKVxuLy8gcHJvdGVjdHMgdGhlIHNjb3BlIG9mIHRoaXMgZmlsZSBhbmQgb3RoZXIgbmVwdHVuZSBmaWxlcyBmcm9tIGludGVyZmVyYW5jZSBmcm9tIGluc2lkZSBldmFsXG5uZXcgRnVuY3Rpb24oXG4gICdldmFsKFwiJyArXG4gICAgLy8gUXVpbmUgZm9yIHNjb3BpbmcgZXZhbHNcbiAgICAvLyBTaW1wbGlmaWVkIGZpZGRsZSB0byBoZWxwIHVuZGVyc3RhbmQgd2h5IHRoaXMgcXVpbmUgaXMgdXNlZnVsOiBodHRwczovL2pzZmlkZGxlLm5ldC9ranZvNmgyeC9cbiAgICAnZnVuY3Rpb24gJF9fZXZhbF9fJCgkX19jb2RlX18kKSB7JyArXG4gICAgICAnZXZhbCgkX19jb2RlX18kKTsnICtcbiAgICAgICdldmFsKCRfX2V2YWxfXyQudG9TdHJpbmcoKSk7JyArXG4gICAgICAncmV0dXJuICRfX2V2YWxfXyQ7JyArXG4gICAgJ30nICtcbiAgICAvLyBFeHBvc2UgUXVpbmUgdG8gYWxsIHNjcmlwdHNcbiAgICAnd2luZG93LiRfX2V2YWxfXyQgPSAkX19ldmFsX18kOycgK1xuICAnXCIpOydcbikoKTtcblxuLy8gZGV0ZXJtaW5lIHNjb3BlIGFuZCBldmFsIHdpdGhpbiBpdCFcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvZGVUYWcpIHtcbiAgY29uc3Qgb3B0aW9ucyA9IEpTT04ucGFyc2UoY29kZVRhZy5kYXRhc2V0Lm9wdGlvbnMpO1xuXG4gIGxldCBzY29wZU5hbWUgPSBvcHRpb25zWydzY29wZSddO1xuICBpZiAoc2NvcGVOYW1lID09IG51bGwpIHtcbiAgICBzY29wZU5hbWUgPSAnJF9fREVGQVVMVF9fJCc7XG4gIH1cblxuICAvLyBjcmVhdGUgZW1wdHkgc2NvcGUgaWYgaXQgZG9lcyBub3QgZXhpc3RcbiAgaWYgKHNjb3Blc1tzY29wZU5hbWVdID09IG51bGwpIHtcbiAgICBzY29wZXNbc2NvcGVOYW1lXSA9IHdpbmRvdy4kX19ldmFsX18kO1xuICB9XG5cbiAgLy8gZXZhbCB3aXRoaW4gc2NvcGVcbiAgc2NvcGVzW3Njb3BlTmFtZV0gPSBzY29wZXNbc2NvcGVOYW1lXShjb2RlVGFnLnRleHRDb250ZW50KTtcbn07XG4iLCIoZnVuY3Rpb24gKCkge1xuICBjb25zdCBUYWJzID0gcmVxdWlyZSgnLi90YWJzLmpzJyk7XG5cbiAgLypcbiAgICogRGV0ZWN0IDxwcmU+IGFuZCA8Y29kZT4gdGFncyBvZiBpbnRlcmVzdFxuICAgKi9cbiAgY29uc3QgcHJlVGFncyA9IEFycmF5LmZyb20oZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3ByZScpKTtcbiAgY29uc3QgY29kZVRhZ3MgPSBwcmVUYWdzLm1hcChmdW5jdGlvbiAocHJlVGFnKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20ocHJlVGFnLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjb2RlJykpO1xuICB9KS5yZWR1Y2UoZnVuY3Rpb24gKGNvZGVUYWdzMSwgY29kZVRhZ3MyKSB7XG4gICAgcmV0dXJuIGNvZGVUYWdzMS5jb25jYXQoY29kZVRhZ3MyKTtcbiAgfSwgW10pLmZpbHRlcihmdW5jdGlvbiAoY29kZVRhZykge1xuICAgIHJldHVybiBjb2RlVGFnLmNsYXNzTmFtZS5pbmRleE9mKCdsYW5ndWFnZS1uZXB0dW5lJykgPiAtMTtcbiAgfSk7XG5cbiAgLypcbiAgICogSGVscGVyIGZ1bmN0aW9uc1xuICAgKi9cbiAgY29uc3QgZ2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChjb2RlVGFnKSB7XG4gICAgY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICB0aXRsZTogJ0phdmFzY3JpcHQnLFxuICAgICAgZW52OiAnYnJvd3NlcidcbiAgICB9O1xuXG4gICAgLy8gcmVzdWx0XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zKTtcbiAgICBjb25zdCBhZGRPcHRpb24gPSBmdW5jdGlvbiAoa2V5LCB2YWwpIHtcbiAgICAgIG9wdGlvbnNba2V5XSA9IHZhbDtcblxuICAgICAgaWYgKGtleSA9PT0gJ2VudicgJiYgb3B0aW9uc1sndGl0bGUnXSA9PT0gZGVmYXVsdE9wdGlvbnNbJ3RpdGxlJ10pIHtcbiAgICAgICAgb3B0aW9uc1sndGl0bGUnXSA9IHZhbDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gcGFyc2Ugb3B0aW9uc1xuICAgIGZvciAobGV0IGNsYXNzTmFtZSBvZiBjb2RlVGFnLmNsYXNzTGlzdCkge1xuICAgICAgY2xhc3NOYW1lID0gY2xhc3NOYW1lLnRyaW0oKTtcbiAgICAgIGlmICghY2xhc3NOYW1lLnN0YXJ0c1dpdGgoJ25lcHR1bmUnKSB8fCBjbGFzc05hbWUuaW5kZXhPZignWycpID09PSAtMSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY2xhc3NOYW1lID0gY2xhc3NOYW1lLnN1YnN0cmluZygoJ25lcHR1bmVbJykubGVuZ3RoLCBjbGFzc05hbWUubGVuZ3RoLTEpO1xuICAgICAgY2xhc3NOYW1lLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uIChvcHRpb24pIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBvcHRpb24uaW5kZXhPZignPScpO1xuICAgICAgICBjb25zdCBrZXkgPSBvcHRpb24uc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgICAgY29uc3QgdmFsID0gb3B0aW9uLnN1YnN0cmluZyhpbmRleCArIDEpO1xuICAgICAgICBhZGRPcHRpb24oa2V5LCB2YWwpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH07XG5cbiAgY29uc3Qgc3R5bGVDb2RlQmxvY2sgPSBmdW5jdGlvbiAoY29kZVRhZykge1xuICAgIGNvbnN0IHByZVRhZyA9IGNvZGVUYWcucGFyZW50Tm9kZTtcblxuICAgIC8vIGdldCBuZXB0dW5lIGNvZGUgb3B0aW9ucyBmcm9tIG1hcmtkb3duXG4gICAgY29uc3Qgb3B0aW9ucyA9IGdldE9wdGlvbnMoY29kZVRhZyk7XG4gICAgY29kZVRhZy5kYXRhc2V0Lm9wdGlvbnMgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zKTtcblxuICAgIC8vIE1ha2Ugc3VyZSBQUklTTSB1bmRlcnN0YW5kcyB0aGF0IHRoaXMgaXMgSlNcbiAgICBjb2RlVGFnLmNsYXNzTmFtZSA9ICdsYW5ndWFnZS1qYXZhc2NyaXB0JztcbiAgICBwcmVUYWcuY2xhc3NOYW1lID0gJ2xhbmd1YWdlLWphdmFzY3JpcHQnO1xuICAgIHByZVRhZy5jbGFzc0xpc3QuYWRkKCdsaW5lLW51bWJlcnMnKTsgLy8gYWRkIGxpbmUgbnVtYmVyaW5nXG5cbiAgICAvLyBTdHlsZSBjb2RlIGFzIGEgdGFiYmVkIGZyYW1lIHdpdGggYSB0b29sYmFyIGFuZCBlZGl0b3IhXG4gICAgVGFicyhwcmVUYWcsIGNvZGVUYWcpO1xuICB9O1xuXG4gIC8qXG4gICAqIEFwcGx5IHN0eWxpbmcgYW5kIGZ1bmN0aW9uYWxpdHlcbiAgICovXG4gIGNvZGVUYWdzLm1hcChmdW5jdGlvbiAoY29kZVRhZykge1xuICAgIHN0eWxlQ29kZUJsb2NrKGNvZGVUYWcpO1xuICB9KTtcbn0pKCk7XG4iLCIvKlxuICogZGVwZW5kZW5jaWVzXG4gKi9cbmNvbnN0IFRvb2xiYXIgPSByZXF1aXJlKCcuL3Rvb2xiYXIuanMnKTtcbmNvbnN0IEVkaXRvciA9IHJlcXVpcmUoJy4vZWRpdG9yLmpzJyk7XG5cbmxldCBhdXRvQ291bnRlciA9IDA7XG5cbmNvbnN0IGNyZWF0ZVRhYiA9IGZ1bmN0aW9uICh0aXRsZSwgdGFic0NvbnRhaW5lciwgcHJlVGFnKSB7XG4gIGNvbnN0IHRhYlJhZGlvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgY29uc3QgdGFiTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICBjb25zdCBjb2RlVGFiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgLy8gY3JlYXRlIElEIGZvciByYWRpb1xuICBjb25zdCBjb3VudCA9IHRhYnNDb250YWluZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0JykubGVuZ3RoO1xuICBjb25zdCB0YWJJRCA9IHRhYnNDb250YWluZXIuaWQgKyAnLXRhYi0nICsgKGNvdW50ICsgMSk7XG5cbiAgLy8gc3R5bGUgbGFibGUgYW5kIHJhZGlvXG4gIHRhYlJhZGlvLmNsYXNzTmFtZSA9ICd0YWItaW5wdXQnO1xuICB0YWJSYWRpby5pZCA9IHRhYklEO1xuICB0YWJSYWRpby5uYW1lID0gdGFic0NvbnRhaW5lci5pZDtcbiAgdGFiUmFkaW8udHlwZSA9ICdyYWRpbyc7XG5cbiAgdGFiTGFiZWwuY2xhc3NOYW1lID0gJ3RhYi1sYWJlbCc7XG4gIHRhYkxhYmVsLmlkID0gdGFiSUQgKyAnLWxhYmVsJztcbiAgdGFiTGFiZWwuc2V0QXR0cmlidXRlKCdmb3InLCB0YWJJRCk7XG4gIHRhYkxhYmVsLmlubmVySFRNTCA9IHRpdGxlO1xuICBpZiAoY291bnQgPT09IDApIHtcbiAgICB0YWJSYWRpby5zZXRBdHRyaWJ1dGUoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgIHRhYkxhYmVsLmNsYXNzTGlzdC5hZGQoJ3RhYi1sYWJlbC1zZWxlY3RlZCcpO1xuICAgIHRhYnNDb250YWluZXIuZGF0YXNldC5zZWxlY3RlZCA9IHRhYklEO1xuICB9XG5cbiAgdGFiUmFkaW8ub25jbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgLy8gcmVtb3ZlIHNlbGVjdGlvbiBmcm9tIHByZXZpb3VzIGxhYmVsXG4gICAgY29uc3QgbGFzdFZhbCA9IHRhYnNDb250YWluZXIuZGF0YXNldC5zZWxlY3RlZDtcbiAgICBjb25zdCBwcmV2TGFiZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChsYXN0VmFsICsgJy1sYWJlbCcpO1xuICAgIHByZXZMYWJlbC5jbGFzc0xpc3QucmVtb3ZlKCd0YWItbGFiZWwtc2VsZWN0ZWQnKTtcbiAgICAvLyBzZWxlY3QgdGhpcyBsYWJlbFxuICAgIHRhYnNDb250YWluZXIuZGF0YXNldC5zZWxlY3RlZCA9IHRhYklEO1xuICAgIHRhYkxhYmVsLmNsYXNzTGlzdC5hZGQoJ3RhYi1sYWJlbC1zZWxlY3RlZCcpO1xuICB9O1xuXG4gIC8vIHN0eWxlIGNvbnRhaW5lclxuICBjb2RlVGFiLmNsYXNzTGlzdC5hZGQoJ2NvZGUtdGFiJyk7XG5cbiAgLy8gYWRkIHRvb2xiYXIgYW5kIDxwcmU+IHRhZ1xuICBjb2RlVGFiLmFwcGVuZENoaWxkKFRvb2xiYXIoKSk7XG4gIGNvZGVUYWIuYXBwZW5kQ2hpbGQocHJlVGFnKTtcblxuICAvLyBhZGQgdGhlIGNvZGUgY29udGFpbmVyIHRvIHRoZSB0YWJzXG4gIHRhYnNDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRhYkxhYmVsLCB0YWJzQ29udGFpbmVyLmNoaWxkcmVuW2NvdW50XSk7XG4gIHRhYnNDb250YWluZXIuYXBwZW5kQ2hpbGQodGFiUmFkaW8pO1xuICB0YWJzQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvZGVUYWIpO1xufTtcblxuY29uc3QgY3JlYXRlVGFic0NvbnRhaW5lciA9IGZ1bmN0aW9uIChmcmFtZUlEKSB7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb250YWluZXIuaWQgPSBmcmFtZUlEO1xuICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCgnY29kZS10YWJzJyk7XG4gIHJldHVybiBjb250YWluZXI7XG59O1xuXG5jb25zdCBnZXRPckNyZWF0ZVRhYnNDb250YWluZXIgPSBmdW5jdGlvbiAoZnJhbWVJRCwgcHJlVGFnKSB7XG4gIGZyYW1lSUQgPSBmcmFtZUlEIHx8ICduZXB0dW5lLWZyYW1lLScgKyAoYXV0b0NvdW50ZXIrKyk7XG4gIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChmcmFtZUlEKTtcblxuICBpZiAoY29udGFpbmVyID09IG51bGwpIHtcbiAgICBjb250YWluZXIgPSBjcmVhdGVUYWJzQ29udGFpbmVyKGZyYW1lSUQpO1xuICAgIHByZVRhZy5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChjb250YWluZXIsIHByZVRhZyk7XG4gIH0gZWxzZSB7XG4gICAgcHJlVGFnLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocHJlVGFnKTtcbiAgfVxuXG4gIHJldHVybiBjb250YWluZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwcmVUYWcsIGNvZGVUYWcpIHtcbiAgLy8gUGFyc2Ugb3B0aW9ucyBmcm9tIG1hcmtkb3duXG4gIGNvbnN0IG9wdGlvbnMgPSBKU09OLnBhcnNlKGNvZGVUYWcuZGF0YXNldC5vcHRpb25zKTtcbiAgY29uc3QgZnJhbWVJRCA9IG9wdGlvbnNbJ2ZyYW1lJ107XG4gIGNvbnN0IHRpdGxlID0gb3B0aW9uc1sndGl0bGUnXTtcblxuICAvLyBDcmVhdGUgKG9yIGdldCBpZiBleGlzdHMpIHRoZSB0YWJzIGZyYW1lIGNvbnRhaW5lclxuICBjb25zdCB0YWJzQ29udGFpbmVyID0gZ2V0T3JDcmVhdGVUYWJzQ29udGFpbmVyKGZyYW1lSUQsIHByZVRhZyk7XG5cbiAgLy8gQWRkIHRoaXMgPHByZT48Y29kZT4gdGFncyBhcyBhIHRhYiB0byB0aGUgY29udGFpbmVyXG4gIGNyZWF0ZVRhYih0aXRsZSwgdGFic0NvbnRhaW5lciwgcHJlVGFnKTtcblxuICAvLyBhZGQgdHJhbnNwYXJlbnQgdGV4dCBhcmVhIHRoYXQgbWltaWNzIHRoZSBjb2RlIHRhZ1xuICBwcmVUYWcuYXBwZW5kQ2hpbGQoRWRpdG9yKGNvZGVUYWcpKTtcbn07XG4iLCJjb25zdCBzY29wZWRFdmFsID0gcmVxdWlyZSgnLi9ldmFsLmpzJyk7XG5cbi8vIGhhbmRsZXMgY2xpY2tpbmcgb24gYW4gaWNvbiBpbiB0aGUgY29kZSB0b29sYmFyXG5jb25zdCB0b29sYmFyQ2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IHR5cGUgPSB0aGlzLmNoaWxkcmVuWzBdLmNsYXNzTGlzdFsxXS5zcGxpdCgnLScpWzFdO1xuICBjb25zdCBjb2RlVGFnID0gdGhpcy5wYXJlbnROb2RlLnBhcmVudE5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvZGUnKVswXTtcbiAgY29uc3QgdGV4dEFyZWFUYWcgPSB0aGlzLnBhcmVudE5vZGUucGFyZW50Tm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGV4dGFyZWEnKVswXTtcblxuICBsZXQgcmFuZ2U7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ2NvcHknOlxuICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZShjb2RlVGFnKTtcbiAgICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5hZGRSYW5nZShyYW5nZSk7XG4gICAgICBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xuICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICd0cmFzaCc6XG4gICAgICB0ZXh0QXJlYVRhZy52YWx1ZSA9ICcnO1xuICAgICAgdGV4dEFyZWFUYWcuaGFuZGxlcigpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdwbGF5JzpcbiAgICAgIHNjb3BlZEV2YWwoY29kZVRhZyk7XG4gICAgICBicmVhaztcbiAgfVxufTtcblxuLy8gY3JlYXRlcyBIVE1MIGVsZW1lbnRzIGZvciB0aGUgdG9vbGJhciBvbiB0b3Agb2YgPGNvZGU+IHRhZ3Ncbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGhhbmRsZXI9dG9vbGJhckNsaWNrKSB7XG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjb2RlLXRvb2xiYXInKTtcbiAgZWxlbWVudC5pbm5lckhUTUwgPSAnPGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPjxpIGNsYXNzPVwiZmEgZmEtcGxheVwiPjwvaT48L2E+JyArXG4gICAgJzxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48aSBjbGFzcz1cImZhIGZhLWNvcHlcIj48L2k+PC9hPicgK1xuICAgICc8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaFwiPjwvaT48L2E+JztcblxuICBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGRyZW4pLm1hcChmdW5jdGlvbiAoYVRhZykge1xuICAgIGFUYWcub25jbGljayA9IGhhbmRsZXI7XG4gIH0pO1xuXG4gIHJldHVybiBlbGVtZW50O1xufTtcbiJdfQ==
