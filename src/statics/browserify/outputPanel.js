/* global Prism */

function reset() {
  this.style.display = 'block';
  this.children[0].innerHTML = 'Running...';
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

// mimic console.log / console.time / etc
const Console = {
  // this here is bound to the output panel HTML element
  log: function () {
    var msg = '';
    for (var i = 0; i < arguments.length; i++) {
      if (typeof(arguments[i]) === 'object') {
        msg += JSON.stringify(arguments[i]) + ' ';
      } else {
        msg += arguments[i] + ' ';
      }
    }
    this.display(msg);
  }
};

// creates a transparent textarea that serves as an 'editor' for the code in
// the associated <code> tag
module.exports = function (tabID, options) {
  // create pre tag
  const preElement = document.createElement('pre');
  preElement.id = tabID + '-output';
  preElement.classList.add('command-line');
  preElement.classList.add('output-panel');

  preElement.dataset.user = options['title'].toLowerCase();
  preElement.dataset.host = options['env'].toLowerCase();  
  
  // create code tag
  const codeElement = document.createElement('code');
  codeElement.className = 'language-bash';
  preElement.appendChild(codeElement);

  // bind logging functions to output panel HTML element
  preElement.reset = reset.bind(preElement);
  preElement.display = display.bind(preElement);
  preElement.Console = {};
  for (const attr in Console) {
    preElement.Console[attr] = Console[attr].bind(preElement);
  }
  
  return preElement;
};
