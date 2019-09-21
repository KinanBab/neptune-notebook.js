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
