/* PrismJS 1.17.1
https://prismjs.com/download.html#themes=prism-tomorrow&languages=clike+javascript&plugins=line-highlight+line-numbers+autolinker+command-line+match-braces */
var _self="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{},Prism=function(u){var c=/\blang(?:uage)?-([\w-]+)\b/i,a=0;var _={manual:u.Prism&&u.Prism.manual,disableWorkerMessageHandler:u.Prism&&u.Prism.disableWorkerMessageHandler,util:{encode:function(e){return e instanceof L?new L(e.type,_.util.encode(e.content),e.alias):Array.isArray(e)?e.map(_.util.encode):e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).slice(8,-1)},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++a}),e.__id},clone:function n(e,r){var t,a,i=_.util.type(e);switch(r=r||{},i){case"Object":if(a=_.util.objId(e),r[a])return r[a];for(var o in t={},r[a]=t,e)e.hasOwnProperty(o)&&(t[o]=n(e[o],r));return t;case"Array":return a=_.util.objId(e),r[a]?r[a]:(t=[],r[a]=t,e.forEach(function(e,a){t[a]=n(e,r)}),t);default:return e}}},languages:{extend:function(e,a){var n=_.util.clone(_.languages[e]);for(var r in a)n[r]=a[r];return n},insertBefore:function(n,e,a,r){var t=(r=r||_.languages)[n],i={};for(var o in t)if(t.hasOwnProperty(o)){if(o==e)for(var l in a)a.hasOwnProperty(l)&&(i[l]=a[l]);a.hasOwnProperty(o)||(i[o]=t[o])}var s=r[n];return r[n]=i,_.languages.DFS(_.languages,function(e,a){a===s&&e!=n&&(this[e]=i)}),i},DFS:function e(a,n,r,t){t=t||{};var i=_.util.objId;for(var o in a)if(a.hasOwnProperty(o)){n.call(a,o,a[o],r||o);var l=a[o],s=_.util.type(l);"Object"!==s||t[i(l)]?"Array"!==s||t[i(l)]||(t[i(l)]=!0,e(l,n,o,t)):(t[i(l)]=!0,e(l,n,null,t))}}},plugins:{},highlightAll:function(e,a){_.highlightAllUnder(document,e,a)},highlightAllUnder:function(e,a,n){var r={callback:n,selector:'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'};_.hooks.run("before-highlightall",r);for(var t,i=e.querySelectorAll(r.selector),o=0;t=i[o++];)_.highlightElement(t,!0===a,r.callback)},highlightElement:function(e,a,n){var r=function(e){for(;e&&!c.test(e.className);)e=e.parentNode;return e?(e.className.match(c)||[,"none"])[1].toLowerCase():"none"}(e),t=_.languages[r];e.className=e.className.replace(c,"").replace(/\s+/g," ")+" language-"+r;var i=e.parentNode;i&&"pre"===i.nodeName.toLowerCase()&&(i.className=i.className.replace(c,"").replace(/\s+/g," ")+" language-"+r);var o={element:e,language:r,grammar:t,code:e.textContent};function l(e){o.highlightedCode=e,_.hooks.run("before-insert",o),o.element.innerHTML=o.highlightedCode,_.hooks.run("after-highlight",o),_.hooks.run("complete",o),n&&n.call(o.element)}if(_.hooks.run("before-sanity-check",o),!o.code)return _.hooks.run("complete",o),void(n&&n.call(o.element));if(_.hooks.run("before-highlight",o),o.grammar)if(a&&u.Worker){var s=new Worker(_.filename);s.onmessage=function(e){l(e.data)},s.postMessage(JSON.stringify({language:o.language,code:o.code,immediateClose:!0}))}else l(_.highlight(o.code,o.grammar,o.language));else l(_.util.encode(o.code))},highlight:function(e,a,n){var r={code:e,grammar:a,language:n};return _.hooks.run("before-tokenize",r),r.tokens=_.tokenize(r.code,r.grammar),_.hooks.run("after-tokenize",r),L.stringify(_.util.encode(r.tokens),r.language)},matchGrammar:function(e,a,n,r,t,i,o){for(var l in n)if(n.hasOwnProperty(l)&&n[l]){var s=n[l];s=Array.isArray(s)?s:[s];for(var u=0;u<s.length;++u){if(o&&o==l+","+u)return;var c=s[u],g=c.inside,f=!!c.lookbehind,h=!!c.greedy,d=0,m=c.alias;if(h&&!c.pattern.global){var p=c.pattern.toString().match(/[imsuy]*$/)[0];c.pattern=RegExp(c.pattern.source,p+"g")}c=c.pattern||c;for(var y=r,v=t;y<a.length;v+=a[y].length,++y){var k=a[y];if(a.length>e.length)return;if(!(k instanceof L)){if(h&&y!=a.length-1){if(c.lastIndex=v,!(x=c.exec(e)))break;for(var b=x.index+(f&&x[1]?x[1].length:0),w=x.index+x[0].length,A=y,P=v,O=a.length;A<O&&(P<w||!a[A].type&&!a[A-1].greedy);++A)(P+=a[A].length)<=b&&(++y,v=P);if(a[y]instanceof L)continue;j=A-y,k=e.slice(v,P),x.index-=v}else{c.lastIndex=0;var x=c.exec(k),j=1}if(x){f&&(d=x[1]?x[1].length:0);w=(b=x.index+d)+(x=x[0].slice(d)).length;var N=k.slice(0,b),S=k.slice(w),C=[y,j];N&&(++y,v+=N.length,C.push(N));var E=new L(l,g?_.tokenize(x,g):x,m,x,h);if(C.push(E),S&&C.push(S),Array.prototype.splice.apply(a,C),1!=j&&_.matchGrammar(e,a,n,y,v,!0,l+","+u),i)break}else if(i)break}}}}},tokenize:function(e,a){var n=[e],r=a.rest;if(r){for(var t in r)a[t]=r[t];delete a.rest}return _.matchGrammar(e,n,a,0,0,!1),n},hooks:{all:{},add:function(e,a){var n=_.hooks.all;n[e]=n[e]||[],n[e].push(a)},run:function(e,a){var n=_.hooks.all[e];if(n&&n.length)for(var r,t=0;r=n[t++];)r(a)}},Token:L};function L(e,a,n,r,t){this.type=e,this.content=a,this.alias=n,this.length=0|(r||"").length,this.greedy=!!t}if(u.Prism=_,L.stringify=function(e,a){if("string"==typeof e)return e;if(Array.isArray(e))return e.map(function(e){return L.stringify(e,a)}).join("");var n={type:e.type,content:L.stringify(e.content,a),tag:"span",classes:["token",e.type],attributes:{},language:a};if(e.alias){var r=Array.isArray(e.alias)?e.alias:[e.alias];Array.prototype.push.apply(n.classes,r)}_.hooks.run("wrap",n);var t=Object.keys(n.attributes).map(function(e){return e+'="'+(n.attributes[e]||"").replace(/"/g,"&quot;")+'"'}).join(" ");return"<"+n.tag+' class="'+n.classes.join(" ")+'"'+(t?" "+t:"")+">"+n.content+"</"+n.tag+">"},!u.document)return u.addEventListener&&(_.disableWorkerMessageHandler||u.addEventListener("message",function(e){var a=JSON.parse(e.data),n=a.language,r=a.code,t=a.immediateClose;u.postMessage(_.highlight(r,_.languages[n],n)),t&&u.close()},!1)),_;var e=document.currentScript||[].slice.call(document.getElementsByTagName("script")).pop();if(e&&(_.filename=e.src,e.hasAttribute("data-manual")&&(_.manual=!0)),!_.manual){function n(){_.manual||_.highlightAll()}"loading"!==document.readyState?window.requestAnimationFrame?window.requestAnimationFrame(n):window.setTimeout(n,16):document.addEventListener("DOMContentLoaded",n)}return _}(_self);"undefined"!=typeof module&&module.exports&&(module.exports=Prism),"undefined"!=typeof global&&(global.Prism=Prism);
Prism.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,lookbehind:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},"class-name":{pattern:/((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,lookbehind:!0,inside:{punctuation:/[.\\]/}},keyword:/\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,boolean:/\b(?:true|false)\b/,function:/\w+(?=\()/,number:/\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,operator:/--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,punctuation:/[{}[\];(),.:]/};
Prism.languages.javascript=Prism.languages.extend("clike",{"class-name":[Prism.languages.clike["class-name"],{pattern:/(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,lookbehind:!0}],keyword:[{pattern:/((?:^|})\s*)(?:catch|finally)\b/,lookbehind:!0},{pattern:/(^|[^.])\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,lookbehind:!0}],number:/\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,function:/#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,operator:/-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/}),Prism.languages.javascript["class-name"][0].pattern=/(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/,Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:/((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=\s*($|[\r\n,.;})\]]))/,lookbehind:!0,greedy:!0},"function-variable":{pattern:/#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,alias:"function"},parameter:[{pattern:/(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,inside:Prism.languages.javascript},{pattern:/(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,lookbehind:!0,inside:Prism.languages.javascript}],constant:/\b[A-Z](?:[A-Z_]|\dx?)*\b/}),Prism.languages.insertBefore("javascript","string",{"template-string":{pattern:/`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}|(?!\${)[^\\`])*`/,greedy:!0,inside:{"template-punctuation":{pattern:/^`|`$/,alias:"string"},interpolation:{pattern:/((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,lookbehind:!0,inside:{"interpolation-punctuation":{pattern:/^\${|}$/,alias:"punctuation"},rest:Prism.languages.javascript}},string:/[\s\S]+/}}}),Prism.languages.markup&&Prism.languages.markup.tag.addInlined("script","javascript"),Prism.languages.js=Prism.languages.javascript;
!function(){if("undefined"!=typeof self&&self.Prism&&self.document&&document.querySelector){var t,n=function(){if(void 0===t){var e=document.createElement("div");e.style.fontSize="13px",e.style.lineHeight="1.5",e.style.padding=0,e.style.border=0,e.innerHTML="&nbsp;<br />&nbsp;",document.body.appendChild(e),t=38===e.offsetHeight,document.body.removeChild(e)}return t},a=0;Prism.hooks.add("before-sanity-check",function(e){var t=e.element.parentNode,n=t&&t.getAttribute("data-line");if(t&&n&&/pre/i.test(t.nodeName)){var i=0;r(".line-highlight",t).forEach(function(e){i+=e.textContent.length,e.parentNode.removeChild(e)}),i&&/^( \n)+$/.test(e.code.slice(-i))&&(e.code=e.code.slice(0,-i))}}),Prism.hooks.add("complete",function e(t){var n=t.element.parentNode,i=n&&n.getAttribute("data-line");if(n&&i&&/pre/i.test(n.nodeName)){clearTimeout(a);var r=Prism.plugins.lineNumbers,o=t.plugins&&t.plugins.lineNumbers;if(l(n,"line-numbers")&&r&&!o)Prism.hooks.add("line-numbers",e);else s(n,i)(),a=setTimeout(u,1)}}),window.addEventListener("hashchange",u),window.addEventListener("resize",function(){var t=[];r("pre[data-line]").forEach(function(e){t.push(s(e))}),t.forEach(i)})}function r(e,t){return Array.prototype.slice.call((t||document).querySelectorAll(e))}function l(e,t){return t=" "+t+" ",-1<(" "+e.className+" ").replace(/[\n\t]/g," ").indexOf(t)}function i(e){e()}function s(u,e,d){var t=(e="string"==typeof e?e:u.getAttribute("data-line")).replace(/\s+/g,"").split(","),c=+u.getAttribute("data-line-offset")||0,f=(n()?parseInt:parseFloat)(getComputedStyle(u).lineHeight),h=l(u,"line-numbers"),p=h?u:u.querySelector("code")||u,m=[];return t.forEach(function(e){var t=e.split("-"),n=+t[0],i=+t[1]||n,r=u.querySelector('.line-highlight[data-range="'+e+'"]')||document.createElement("div");if(m.push(function(){r.setAttribute("aria-hidden","true"),r.setAttribute("data-range",e),r.className=(d||"")+" line-highlight"}),h&&Prism.plugins.lineNumbers){var o=Prism.plugins.lineNumbers.getLine(u,n),a=Prism.plugins.lineNumbers.getLine(u,i);if(o){var l=o.offsetTop+"px";m.push(function(){r.style.top=l})}if(a){var s=a.offsetTop-o.offsetTop+a.offsetHeight+"px";m.push(function(){r.style.height=s})}}else m.push(function(){r.setAttribute("data-start",n),n<i&&r.setAttribute("data-end",i),r.style.top=(n-c-1)*f+"px",r.textContent=new Array(i-n+2).join(" \n")});m.push(function(){p.appendChild(r)})}),function(){m.forEach(i)}}function u(){var e=location.hash.slice(1);r(".temporary.line-highlight").forEach(function(e){e.parentNode.removeChild(e)});var t=(e.match(/\.([\d,-]+)$/)||[,""])[1];if(t&&!document.getElementById(e)){var n=e.slice(0,e.lastIndexOf(".")),i=document.getElementById(n);if(i)i.hasAttribute("data-line")||i.setAttribute("data-line",""),s(i,t,"temporary ")(),document.querySelector(".temporary.line-highlight").scrollIntoView()}}}();
!function(){if("undefined"!=typeof self&&self.Prism&&self.document){var l="line-numbers",c=/\n(?!$)/g,m=function(e){var t=a(e)["white-space"];if("pre-wrap"===t||"pre-line"===t){var n=e.querySelector("code"),r=e.querySelector(".line-numbers-rows"),s=e.querySelector(".line-numbers-sizer"),i=n.textContent.split(c);s||((s=document.createElement("span")).className="line-numbers-sizer",n.appendChild(s)),s.style.display="block",i.forEach(function(e,t){s.textContent=e||"\n";var n=s.getBoundingClientRect().height;r.children[t].style.height=n+"px"}),s.textContent="",s.style.display="none"}},a=function(e){return e?window.getComputedStyle?getComputedStyle(e):e.currentStyle||null:null};window.addEventListener("resize",function(){Array.prototype.forEach.call(document.querySelectorAll("pre."+l),m)}),Prism.hooks.add("complete",function(e){if(e.code){var t=e.element,n=t.parentNode;if(n&&/pre/i.test(n.nodeName)&&!t.querySelector(".line-numbers-rows")){for(var r=!1,s=/(?:^|\s)line-numbers(?:\s|$)/,i=t;i;i=i.parentNode)if(s.test(i.className)){r=!0;break}if(r){t.className=t.className.replace(s," "),s.test(n.className)||(n.className+=" line-numbers");var l,a=e.code.match(c),o=a?a.length+1:1,u=new Array(o+1).join("<span></span>");(l=document.createElement("span")).setAttribute("aria-hidden","true"),l.className="line-numbers-rows",l.innerHTML=u,n.hasAttribute("data-start")&&(n.style.counterReset="linenumber "+(parseInt(n.getAttribute("data-start"),10)-1)),e.element.appendChild(l),m(n),Prism.hooks.run("line-numbers",e)}}}}),Prism.hooks.add("line-numbers",function(e){e.plugins=e.plugins||{},e.plugins.lineNumbers=!0}),Prism.plugins.lineNumbers={getLine:function(e,t){if("PRE"===e.tagName&&e.classList.contains(l)){var n=e.querySelector(".line-numbers-rows"),r=parseInt(e.getAttribute("data-start"),10)||1,s=r+(n.children.length-1);t<r&&(t=r),s<t&&(t=s);var i=t-r;return n.children[i]}}}}}();
!function(){if(("undefined"==typeof self||self.Prism)&&("undefined"==typeof global||global.Prism)){var t=/\b([a-z]{3,7}:\/\/|tel:)[\w\-+%~/.:=&@]+(?:\?[\w\-+%~/.:=?&!$'()*,;@]*)?(?:#[\w\-+%~/.:#=?&!$'()*,;@]*)?/,r=/\b\S+@[\w.]+[a-z]{2}/,a=/\[([^\]]+)]\(([^)]+)\)/,l=["comment","url","attr-value","string"];Prism.plugins.autolinker={processGrammar:function(i){i&&!i["url-link"]&&(Prism.languages.DFS(i,function(i,n,e){-1<l.indexOf(e)&&!Array.isArray(n)&&(n.pattern||(n=this[i]={pattern:n}),n.inside=n.inside||{},"comment"==e&&(n.inside["md-link"]=a),"attr-value"==e?Prism.languages.insertBefore("inside","punctuation",{"url-link":t},n):n.inside["url-link"]=t,n.inside["email-link"]=r)}),i["url-link"]=t,i["email-link"]=r)}},Prism.hooks.add("before-highlight",function(i){Prism.plugins.autolinker.processGrammar(i.grammar)}),Prism.hooks.add("wrap",function(i){if(/-link$/.test(i.type)){i.tag="a";var n=i.content;if("email-link"==i.type&&0!=n.indexOf("mailto:"))n="mailto:"+n;else if("md-link"==i.type){var e=i.content.match(a);n=e[2],i.content=e[1]}i.attributes.href=n;try{i.content=decodeURIComponent(i.content)}catch(i){}}})}}();
!function(){if("undefined"!=typeof self&&self.Prism&&self.document){var u=/(?:^|\s)command-line(?:\s|$)/;Prism.hooks.add("before-highlight",function(e){var t=e.vars=e.vars||{},a=t["command-line"]=t["command-line"]||{};if(!a.complete&&e.code){var n=e.element.parentNode;if(n&&/pre/i.test(n.nodeName)&&(u.test(n.className)||u.test(e.element.className)))if(e.element.querySelector(".command-line-prompt"))a.complete=!0;else{var r=e.code.split("\n");a.numberOfLines=r.length;var s=a.outputLines=[],o=n.getAttribute("data-output"),i=n.getAttribute("data-filter-output");if(o||""===o){o=o.split(",");for(var l=0;l<o.length;l++){var m=o[l].split("-"),p=parseInt(m[0],10),d=2===m.length?parseInt(m[1],10):p;if(!isNaN(p)&&!isNaN(d)){p<1&&(p=1),d>r.length&&(d=r.length),d--;for(var c=--p;c<=d;c++)s[c]=r[c],r[c]=""}}}else if(i)for(l=0;l<r.length;l++)0===r[l].indexOf(i)&&(s[l]=r[l].slice(i.length),r[l]="");e.code=r.join("\n")}else a.complete=!0}else a.complete=!0}),Prism.hooks.add("before-insert",function(e){var t=e.vars=e.vars||{},a=t["command-line"]=t["command-line"]||{};if(!a.complete){for(var n=e.highlightedCode.split("\n"),r=0,s=(a.outputLines||[]).length;r<s;r++)a.outputLines.hasOwnProperty(r)&&(n[r]=a.outputLines[r]);e.highlightedCode=n.join("\n")}}),Prism.hooks.add("complete",function(e){var t=e.vars=e.vars||{},a=t["command-line"]=t["command-line"]||{};if(!a.complete){var n=e.element.parentNode;u.test(e.element.className)&&(e.element.className=e.element.className.replace(u," ")),u.test(n.className)||(n.className+=" command-line");var r=function(e,t){return(n.getAttribute(e)||t).replace(/"/g,"&quot")},s=new Array((a.numberOfLines||0)+1),o=r("data-prompt","");if(""!==o)s=s.join('<span data-prompt="'+o+'"></span>');else{var i=r("data-user","user"),l=r("data-host","localhost");s=s.join('<span data-user="'+i+'" data-host="'+l+'"></span>')}var m=document.createElement("span");m.className="command-line-prompt",m.innerHTML=s;for(var p=0,d=(a.outputLines||[]).length;p<d;p++)if(a.outputLines.hasOwnProperty(p)){var c=m.children[p];c.removeAttribute("data-user"),c.removeAttribute("data-host"),c.removeAttribute("data-prompt")}e.element.insertBefore(m,e.element.firstChild),a.complete=!0}})}}();
!function(){if("undefined"!=typeof self&&self.Prism&&self.document){var c=/(?:^|\s)match-braces(?:\s|$)/,a=/(?:^|\s)brace-hover(?:\s|$)/,l=/(?:^|\s)brace-selected(?:\s|$)/,n=/(?:^|\s)no-brace-hover(?:\s|$)/,t=/(?:^|\s)no-brace-select(?:\s|$)/,u={"(":")","[":"]","{":"}"},f={"(":"brace-round","[":"brace-square","{":"brace-curly"},m=0,r=/^(pair-\d+-)(open|close)$/;Prism.hooks.add("complete",function(e){var a=e.element,n=a.parentElement;if(n&&"PRE"==n.tagName){for(var t=[],r=a;r;r=r.parentElement)if(c.test(r.className)){t.push("(","[","{");break}if(0!=t.length){n.__listenerAdded||(n.addEventListener("mousedown",function(){var e=n.querySelector("code");Array.prototype.slice.call(e.querySelectorAll(".brace-selected")).forEach(function(e){e.className=e.className.replace(l," ")})}),Object.defineProperty(n,"__listenerAdded",{value:!0}));var o=Array.prototype.slice.call(a.querySelectorAll("span.token.punctuation")),i=[];t.forEach(function(e){for(var a=u[e],n=f[e],t=[],r=[],s=0;s<o.length;s++){var c=o[s];if(0==c.childElementCount){var l=c.textContent;l===e?(i.push({index:s,open:!0,element:c}),c.className+=" "+n,c.className+=" brace-open",r.push(s)):l===a&&(i.push({index:s,open:!1,element:c}),c.className+=" "+n,c.className+=" brace-close",r.length&&t.push([s,r.pop()]))}}t.forEach(function(e){var a="pair-"+m+++"-",n=o[e[0]],t=o[e[1]];n.id=a+"open",t.id=a+"close",[n,t].forEach(function(e){e.addEventListener("mouseenter",p),e.addEventListener("mouseleave",d),e.addEventListener("click",h)})})});var s=0;i.sort(function(e,a){return e.index-a.index}),i.forEach(function(e){e.open?(e.element.className+=" brace-level-"+(s%12+1),s++):(s=Math.max(0,s-1),e.element.className+=" brace-level-"+(s%12+1))})}}})}function s(e){var a=r.exec(e.id);return document.querySelector("#"+a[1]+("open"==a[2]?"close":"open"))}function p(){for(var e=this.parentElement;e;e=e.parentElement)if(n.test(e.className))return;[this,s(this)].forEach(function(e){e.className=(e.className.replace(a," ")+" brace-hover").replace(/\s+/g," ")})}function d(){[this,s(this)].forEach(function(e){e.className=e.className.replace(a," ")})}function h(){for(var e=this.parentElement;e;e=e.parentElement)if(t.test(e.className))return;[this,s(this)].forEach(function(e){e.className=(e.className.replace(l," ")+" brace-selected").replace(/\s+/g," ")})}}();
