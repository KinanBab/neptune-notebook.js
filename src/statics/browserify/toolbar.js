const scopedEval = require('./eval.js');
const serverExec = require('./serverExec.js');

// handles clicking on a run icon for non-javascript code!
const executeNonJavascript = function (code, language, tabID) {
  if (language === 'css') {
    code = '<style>'+code+'</style>';
  }

  document.getElementById(tabID + '-output').innerHTML = code;
}

const playTab = function (tabID) {
  const codeTab = document.getElementById(tabID + '-tab');
  const outputPanel = document.getElementById(tabID + '-output');
  const codeMirrorDiv = codeTab.getElementsByClassName('code-mirror-div')[0];
  const codeMirrorInstance = codeMirrorDiv.codeMirrorInstance;

  const options = JSON.parse(codeMirrorDiv.dataset.options);

  if ((options['offline'] === 'false' || options['offline'] === false || options['env'] === 'server') && window.$__offline__$) {
    alert('Cannot execute this piece of code while offline! Please run this document locally via a neptune server..');
    return;
  }

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
};

// handles clicking on an icon in the code toolbar
const toolbarClick = function () {
  const type = this.children[0].classList[1].split('-').slice(1).join('-');

  const tabID = this.parentNode.parentNode.parentNode.dataset.selected;
  const tabCount = this.parentNode.parentNode.parentNode.dataset.tabCount;
  const baseID = this.parentNode.parentNode.parentNode.id;

  const toolbarContainer = this.parentNode.parentNode;
  const tabRadio = document.getElementById(tabID);
  const tabLabel = document.getElementById(tabID + '-label');
  const codeTab = document.getElementById(tabID + '-tab');
  const codeMirrorDiv = codeTab.getElementsByClassName('code-mirror-div')[0];
  const codeMirrorInstance = codeMirrorDiv.codeMirrorInstance;

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
      playTab(tabID);
      break;

    case 'cogs':
      for (let i = 1; i <= tabCount; i++) {
        playTab(baseID + '-tab-' + i);
      }
      break;

    case 'arrow-up':
      tabRadio.checked = false;
      tabLabel.classList.remove('tab-label-selected');
      tabLabel.classList.add('tab-label-visible');
      this.children[0].classList.remove('fa-arrow-up');
      this.children[0].classList.add('fa-arrow-down');
      this.children[0].title = 'Show tab';
      break;

    case 'arrow-down':
      tabRadio.checked = true;
      tabLabel.classList.add('tab-label-selected');
      tabLabel.classList.remove('tab-label-visible');
      this.children[0].classList.remove('fa-arrow-down');
      this.children[0].classList.add('fa-arrow-up');
      this.children[0].title = 'Hide tab';
      break;

    case 'eye-slash':
      this.children[0].classList.remove('fa-eye-slash');
      this.children[0].classList.add('fa-eye');
      this.children[0].title = 'Show output';
      Array.from(this.parentNode.parentNode.parentNode.getElementsByClassName('output-panel')).map(function (panel) {
        panel.hide();
      });
      break;

    case 'eye':
      this.children[0].classList.remove('fa-eye');
      this.children[0].classList.add('fa-eye-slash');
      this.children[0].title = 'Hide output';
      Array.from(this.parentNode.parentNode.parentNode.getElementsByClassName('output-panel')).map(function (panel) {
        panel.unhide();
      });
      break;

    case 'bars':
      if (toolbarContainer.classList.contains('responsive')) {
        toolbarContainer.classList.remove('responsive');
      } else {
        toolbarContainer.classList.add('responsive');
      }
      break;
  }
};

// creates HTML elements for the toolbar on top of <code> tags
module.exports = function () {
  const element = document.createElement('span');
  element.classList.add('code-toolbar');
  element.innerHTML = '<a href="javascript:void(0)"><i class="fa fa-play" title="Run this tab"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-cogs" title="Run all tabs"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-copy" title="Copy code"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-trash" title="Clear code"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-eye-slash" title="Hide output"></i></a>' +
    '<a href="javascript:void(0)" class="navicon"><i class="fa fa-bars" title="Select tab"></i></a>' +
    '<a href="javascript:void(0)"><i class="fa fa-arrow-up" title="Hide tab"></i></a>';

  Array.from(element.children).map(function (aTag) {
    aTag.onclick = toolbarClick;
  });

  return element;
};
