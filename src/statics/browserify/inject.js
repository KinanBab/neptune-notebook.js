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
