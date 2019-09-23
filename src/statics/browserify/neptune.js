(function () {
  const Tabs = require('./tabs.js');
  const Inject = require('./inject.js');

  const outputIDs = []; // stores all reserved output <div> IDs

  /*
   * Detect <pre> and <code> tags of interest
   */
  const preTags = Array.from(document.getElementsByTagName('pre'));
  const codeTags = preTags.map(function (preTag) {
    return Array.from(preTag.getElementsByTagName('code'));
  }).reduce(function (codeTags1, codeTags2) {
    return codeTags1.concat(codeTags2);
  }, []).filter(function (codeTag) {
    return codeTag.className.indexOf('language-neptune') > -1;
  });

  /*
   * Helper functions
   */
  const getOptions = function (codeTag) {
    const defaultOptions = {
      title: 'Javascript',
      env: 'browser',
      language: 'javascript',
      inject: false
    };

    // result
    const options = Object.assign({}, defaultOptions);
    const addOption = function (key, val) {
      options[key] = val;

      if (key === 'env' && options['title'] === defaultOptions['title']) {
        options['title'] = val;
      } else if (key === 'language') {
        options['language'] = options['language'].toLowerCase();
      } else if (key === 'outputID') {
        const id = options['outputID'];
        if (outputIDs.indexOf(id) > -1) {
          throw new Error('Duplicated outputID ' + id);
        }
        outputIDs.push(id);
      }
    };

    // parse options
    for (let className of codeTag.classList) {
      className = className.trim();
      if (!className.startsWith('neptune') || className.indexOf('[') === -1) {
        continue;
      }

      className = className.substring(('neptune[').length, className.length-1);
      className.split(',').map(function (option) {
        const index = option.indexOf('=');
        const key = option.substring(0, index);
        const val = option.substring(index + 1);
        addOption(key, val);
      });
    }

    return options;
  };

  const styleCodeBlock = function (codeTag) {
    const preTag = codeTag.parentNode;

    // get neptune code options from markdown
    const options = getOptions(codeTag);
    codeTag.dataset.options = JSON.stringify(options);

    // Make sure PRISM understands that this is JS
    codeTag.className = 'language-' + options['language'];
    preTag.className = 'language-' + options['language'];
    preTag.classList.add('line-numbers'); // add line numbering

    // If inject property is true, then inject code into page at this point without displaying it
    if (options['inject']) {
      Inject(preTag, codeTag);
    } else {
      // Style code as a tabbed frame with a toolbar and editor!
      Tabs(preTag, codeTag);
    }
  };

  /*
   * Apply styling and functionality
   */
  codeTags.map(function (codeTag) {
    styleCodeBlock(codeTag);
  });
})();
