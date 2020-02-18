# Test Neptune notebook document

<!-- image -->
![image1](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")

## Some code

```neptune[title=Party&nbsp;1,scope=1,env=browser,frame=frame1,outputID=myOutput]
// some random script!
var x = 10;
document.getElementById('myOutput').innerHTML = '<h1>Test</h1><br><p>Test <b>me</b>: <a href="javascript:void(0)">Here!</a></p>';
x = 5;
Console.log(x);
```

```neptune[title=Party&nbsp;2,scope=2,env=browser,frame=frame1,outputID=myOutput2,offline=false]
// this will throw an error!
var y = 2;
Console.log(y);
document.getElementById('myOutput2').innerHTML = '<b>Hello!</b>';
Console.log(x);
```

```neptune[title=Server,scope=3,env=server,frame=frame1]
Console.log('I am the server!');
Console.log('dirname', __dirname);

// does not work, because node will look at __dirname/include/test.js
// const lib2 = require('include/test.js');

// this works, because using the Require wrapper
// tells neptune to resolve relative to the
// directory of the main neptune server file
// (i.e. the main module)
const lib = Require('include/test.js');
Console.log(lib);

// do not use Require wrapper for
// npm and node dependencies
const fs = require('fs');
Console.log(fs.mkdir.toString().split('\n')[0]);
```

```neptune[inject=true,language=HTML]
<h3> Some more injected code! </h3>
```

## Some other code

```neptune[title=HTML,frame=frame2,outputID=HTMLOutput,language=HTML,dropdown=false]
<h1 class="my-test">Test this HTML!</h1>
```

```neptune[title=CSS,frame=frame2,language=CSS]
.my-test {
  color: red;
}
```

<!-- Inject some code into this location (at the end) in the HTML -->

```neptune[inject=true]
console.log('this is some injected code');
```
```neptune[inject=true,language=CSS]
h4.injectedClass {
  color: blue;
  text-align: center;
}
```
```neptune[inject=true,language=HTML]
<br><br><br>
<h4 class="injectedClass">Good bye!</h4>
```
