/* global Prism */

// Execute code from a selected <code> tag
function $__eval__$($__code__$) {
  eval($__code__$);
  eval($__eval__$.toString());
  return $__eval__$;
}

(function () {
  let scope = $__eval__$;

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
  const createEditorTag = function (codeTag) {
    const element = document.createElement('textarea');
    element.classList.add('code-editor');
    element.setAttribute('spellcheck', 'false');

    // listen to any input changes
    if (element.addEventListener) {
      element.addEventListener('input', codeInputHandler.bind(null, codeTag, element));
    } else if (element.attachEvent) { // for IE11
      element.attachEvent('onpropertychange', codeInputHandler.bind(null, codeTag, element));
    }

    // put code in textarea
    element.value = codeTag.textContent;

    return element;
  };

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
        codeInputHandler(codeTag, textAreaTag);
        break;

      case 'play':
        scope = scope(codeTag.textContent);
        break;
    }
  };

  // creates HTML elements for the toolbar on top of <code> tags
  const createToolbarElement = function (handler) {
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

  // Applies style and adds functionality to <code> tags
  const styleCodeBlock = function (codeTag) {
    // style the parent <pre> tag
    const preTag = codeTag.parentNode;
    preTag.classList.add('line-numbers'); // add line numbering

    // replace preTag with new container in DOM
    const container = document.createElement('div');
    preTag.parentNode.replaceChild(container, preTag);

    // style container
    container.classList.add('code-container');

    // add toolbar
    container.appendChild(createToolbarElement(function () {
      toolbarClick.apply(this, arguments);
    }));

    // add code <pre> tag
    container.appendChild(preTag);

    // add transparent text area that mimics the code tag
    preTag.appendChild(createEditorTag(codeTag));
  };

  // detect all pre tags that have actual javascript code in them
  const preTags = Array.from(document.getElementsByTagName('pre'));

  // detect all code tags that have javascript
  const codeTags = preTags.map(function (preTag) {
    return Array.from(preTag.getElementsByTagName('code'));
  }).reduce(function (codeTags1, codeTags2) {
    return codeTags1.concat(codeTags2);
  }, []).filter(function (codeTag) {
    return codeTag.className.indexOf('language-javascript') > -1;
  });

  // style code tags
  codeTags.map(function (codeTag) {
    styleCodeBlock(codeTag);
  });
})();
