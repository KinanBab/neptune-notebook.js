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
