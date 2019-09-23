# Neptune-notebook.js

Interactive Notebook for Javascript and Node.js

## Overview

Neptune allows you to write interactive javascript documents using markdown. A document can contain
any markdown features (text, images, links, code blocks, etc), including "special" neptune code blocks
that can be executed interactively when the document is open. Neptune automatically generates HTML code
from the input markdown source, and manages the interactive code blocks.

Currently the following features are supported:
1. Covers all markdown features using [showdown](https://github.com/showdownjs/showdown).
2. (editable) Javascript, CSS, and HTML interactive code blocks.
3. Combining related code blocks in a tab layout.
4. Specifying the scope of each code block, so that code blocks with different scopes are totally independent
   and do not share any variables, while code blocks with the same scope share state (the effects of running one
   is visible when running any of the others).
5. Easy output display using `Console.log` which mimics the standard `console.log`.
6. Manual output display in a dedicated div following a code block for plots or other complex output formats.
7. Injecting HTML, CSS, and Javascript directly into document for customized styling or behavior.
8. Can run interactive node.js code via the server.
9. Dumps the output into a single HTML file for static hosting if desired (interactive code will not run).

## Interactive Code Blocks

Interactive code blocks are defined in the markdown source using:
~~~markdown
```neptune[<options>]
<code>
<code>
...
```
~~~

Where options is on the form: <key>:<value>,<key>:<value>,...,<key>:<value>

*Note:* options cannot include white spaces.

The following options are supported:
1. _language_ can be one of `javascript`, `css`, or `html`, defaults to javascript.
2. _inject_ if given any value, then this code block will be injected into the HTML code at the current position,
if not provided, the code will be displayed in an interactive block but not injected.
If this attribute is provided, neptune will ignore any of the next attributes.
3. _title_ specifies the title of the code block.
4. _scope_ specifies the scope of the code block, all code blocks with the same given scope will share state.
Blocks without a specified scope share state.
5. _frame_ all code blocks with the same frame value will be displayed together in a tab layout. The layout is
located in the position of the first code block that belongs to the frame. If not given, the code block will displayed
stand alone.
6. _env_ can be `browser` or `server`, defaults to browser, specifies where the code will be run.
7. _output_ if provided, neptune will create an empty div with the given value as an id right after the code block.
This div can be used by the code block to display custom HTML output.

### Important Pitfalls for Interactive Code Blocks

All interactive code blocks are isolated from most of the neptune client side code.

The following neptune internal variables are visible to code running inside code blocks, these variables are *unsafe* to modify by interactive code, doing so may cause failures.

```javascript
$__scopes__$, $__logMiddlewareBrowser__$, $__logMiddlewareServer__$, $__eval__$, $__code__$
Console // contains one attribute: 'log' which mimics console.log but displays output inside the HTML page.
```

Using `let` or `const` inside the code block will cause eval call to run in strict mode. Such user code will run properly if it is in
a stand-alone code block, but variables defined in it will not be visible to other code blocks (or re-runs of the same code
block), even if they are configured to have the same scope in the markdown source.

## Running Neptune

You can install neptune with:
```bash
npm install neptune-notebook
```

After installation, you can run a neptune server as follows:
```javascript
var Neptune = require('neptune-notebook'); // require neptune server-side code

var neptune = new Neptune(); // create a new server
neptune.addDocument('document-name1', 'path/to/markdown1', [<auto-refresh>=false], [<injected-JS-files>=[]], [<injected-CSS-files>=[]], [<injected-HTML-files>=[]]);
neptune.addDocument('document-name2', 'path/to/markdown2', [<auto-refresh>=false], [<injected-JS-files>=[]], [<injected-CSS-files>=[]], [<injected-HTML-files>=[]]);
...

// Static serving: Dump document as an HTML file
neptune.writeHTML('document-name1', 'path/to/output/html');

// Dynamic serving: supports server-side interactive code block
neptune.start(<port number>); // neptune will log to the console the urls for each document
```

*Where:*
1. `<auto-refresh>`: an optional boolean parameter, if set to `true`, it will automatically render any changes to the markdown source whenever the document is accessed with the browser.
By default, this is disabled.
2. `<injected-*-files>`: an array of (javascript, CSS, or HTML) file paths to inject statically into the page, look at the _Injecting Code Into Output Document_ section below for more details.

*Note:* you can choose to either statically or dynamically serve the output document (or both).

## Injecting Code Into Output Document

Neptune supports two approaches for injecting code into the output document. Code can be injected statically (prior
to the output HTML generation) or dynamically (with client side javascript that executes when the page is loaded).

Static injection is useful for injecting styling rules or external javascript dependencies. It is restricted in that
it can only inject code in fixed locations in the code. Namely, HTML and CSS code are injected at the end of <head> body,
while Javascript code is injected at the end of <body> inside a <script> tag.

Static injection is specified by providing an array of files whose content is injected into the document in order (as if by <script> or <link> tags).

```javascript
neptune.addDocument('document-name', 'path/to/markdown', <autosave>, ['/path/to/JS', ...], ['/path/to/CSS', ...], ['/path/to/HTML', ...]);
```

Dynamic injection is more flexible as it allows injecting code into any location in the page. Dynamic injection is defined within the markdown
input file using a neptune code block with `inject=true`. Look at the _Interactive Code Blocks_ section above for more details.

## Code Samples

For a sample neptune server, input markdown file, and output HTML, look under `demo/` directory in the github repo.

## License and Contribution

MIT. Pull-requests, bug reports, and feature requests are welcome.

Please use github issues to report bugs or request features. Use common sense to determine how much context information need to be provided.

Before sending a pull request, please run the linter to check your changes adheres to the code styling standards using `npm run lint`.

## Directory Structure
Neptune is made out of two components:
1. An express-based server responsible for transforming and rendering markdown, as well as serving documents.
2. A client side javascript library responsible for styling and managing interactive code blocks and other features.

The javascript client side library is automatically injected into the document HTML pages by the server. The server code is available under `src/`, while the client side
code is under `src/statics/`.

The client side code uses browserify to compile code under `src/statics/browserify` into `src/statics/neptune.js`, whose contents are injected into client side HTML pages.
If you made changes to the client side code and would like to recompile it, run `npm run build`.

Note that `/src/statics/prism.[css,js]` are external dependencies for the Prism library for pretty printing/styling of code inside HTML documents.
