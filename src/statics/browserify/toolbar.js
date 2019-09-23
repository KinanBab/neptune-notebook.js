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
