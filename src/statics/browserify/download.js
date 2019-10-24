// Exports a document to an HTML page with all outputs and interactions stored (minus scopes)
const markup = document.documentElement.innerHTML;

const getAllOutputs = function () {
  const outputs = {
    defaultPanels: {},
    customPanels: {}
  };

  const defaultPanels = document.getElementsByClassName('output-panel');
  for (let i = 0; i < defaultPanels.length; i++) {
    outputs.defaultPanels[defaultPanels[i].id] = defaultPanels[i].innerHTML;
  }

  const customPanels = document.getElementsByClassName('custom-output-div');
  for (let i = 0; i < customPanels.length; i++) {
    outputs.customPanels[customPanels[i].id] = customPanels[i].innerHTML;
  }

  return outputs;
};

const fillOutputs = function (outputs) {
  const defaultOutputs = outputs.defaultPanels;
  const customOutputs = outputs.customPanels;
  
  for (let key in defaultOutputs) {
    if (defaultOutputs.hasOwnProperty(key)) {
      const panel = document.getElementById(key);
      panel.reset();
      panel.innerHTML = defaultOutputs[key];
    }
  }
  for (let key in customOutputs) {
    if (customOutputs.hasOwnProperty(key)) {
      const panel = document.getElementById(key);
      panel.innerHTML = customOutputs[key];
    }
  }
};

const genCode = function (outputs) {
  return '<script type="text/javascript">' +
  'window.$__offline__$ = true;' +
  '(' + fillOutputs.toString() + ')(' + JSON.stringify(outputs) + ');' +
  '<' + '/' + 'script>';
};

module.exports = function () {
  const suffix = "\n<script type='text/javascipt'>window.$__offline__$ = true;<" + "/script>\n";
  const content = "<html>\n" + markup + genCode(getAllOutputs()) + "<" + "/html>";

  const blob = new Blob([content], {type: 'text/javascript;charset=utf-8'});
  saveAs(blob, 'output.html');
};
