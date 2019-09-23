/* global Prism */

const formatter = require('./formatter.js');

function reset(hideOutput) {
  this.dataset.shown = true;
  if (this.dataset.hideOutput !== 'true') {
    this.style.display = 'block';
  }
  if (this.dataset.language === 'javascript') {
    this.children[0].innerHTML = 'Running...';
  }
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

function hide() {
  this.style.display = 'none';
  this.dataset.hideOutput = 'true';
}

function unhide() {
  this.dataset.hideOutput = 'false';
  if (this.dataset.shown) {
    this.style.display = 'block';
  }
}

// mimic console.log / console.time / etc
const Console = {
  // this here is bound to the output panel HTML element
  log: function () {
    console.log.apply(console, arguments);
    this.display(formatter.apply(null, arguments));
  }
};

// Creates a terminal-like area for javascript or an empty div for HTML/CSS
module.exports = function (tabID, options) {
  let outputElement;
  if (options['language'] === 'javascript') {
    outputElement = document.createElement('pre');

    outputElement.classList.add('command-line');
    outputElement.dataset.user = options['title'].toLowerCase();
    outputElement.dataset.host = options['env'].toLowerCase();

    // create code tag
    const codeElement = document.createElement('code');
    codeElement.className = 'language-bash';
    outputElement.appendChild(codeElement);

    // bind util functions to HTML element
    outputElement.display = display.bind(outputElement);
    outputElement.Console = {};
    for (const attr in Console) {
      outputElement.Console[attr] = Console[attr].bind(outputElement);
    }
  } else {
    outputElement = document.createElement('div');
  }

  // style output area
  outputElement.id = tabID + '-output';
  outputElement.classList.add('output-panel');
  outputElement.dataset.language = options['language'];

  // bind logging functions to output panel HTML element
  outputElement.reset = reset.bind(outputElement);
  outputElement.hide = hide.bind(outputElement);
  outputElement.unhide = unhide.bind(outputElement);

  return outputElement;
};
