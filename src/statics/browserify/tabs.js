/* global CodeMirror */
const Toolbar = require('./toolbar.js');
const OutputPanel = require('./outputPanel.js');

let autoCounter = 0;

const createTab = function (title, tabsContainer, code, options) {
  const isFirstTab = (tabsContainer.dataset.tabCount++ === 0);

  // hide the run icon if the first tab is unrunnable
  if (isFirstTab) {
    if (options.run === 'false') {
      const playIcon = tabsContainer.getElementsByClassName('code-top-toolbar')[0].getElementsByClassName('fa-play')[0];
      playIcon.parentNode.style.display = 'none';
    }
  }

  // if one or more tabs are unrunnable, hide the run all icon
  if (options.run === 'false') {
    const playIcon = tabsContainer.getElementsByClassName('code-top-toolbar')[0].getElementsByClassName('fa-cogs')[0];
    playIcon.parentNode.style.display = 'none';
  }

  // create a radio button and associated label for the tab header, and the tab body
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
    minimizeIcon.title = 'Hide output';
    // show/hide play icon if needed
    const playIcon = topToolbar.getElementsByClassName('fa-play')[0];
    playIcon.parentNode.style.display = options.run === 'false' ? 'none' : 'inline';
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
  container.dataset.tabCount = 0;
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
