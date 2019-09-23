```neptune[inject=true]
console.log('injection test!');
```

```neptune[inject=true,language=CSS]
h1.injectedClass {
  color: blue;
}
```

```neptune[inject=true,language=HTML]
<h1 class="injectedClass"> Injected Header! </h1>
```

# Test Neptune notebook document

![image1](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")

## Some code

```neptune[title=Party&nbsp;1,scope=1,env=browser,frame=frame1,outputID=myOutput]
var x = 10;
document.getElementById('myOutput').innerHTML = '<h1>Test</h1><br><p>Test <b>me</b>: <a href="javascript:void(0)">Here!</a></p>';
x = 5;
Console.log(x);
```

```neptune[title=Party&nbsp;2,scope=2,env=browser,frame=frame1,outputID=myOutput2]
var y = 2;
Console.log(y);
document.getElementById('myOutput2').innerHTML = '<b>Hello!</b>';
Console.log(x);
```

```neptune[title=Server,scope=3,env=server,frame=frame1]
Console.log('I am the server!');
Console.log('dirname', __dirname);
```

```neptune[inject=true,language=HTML]
<h3> Some more injected code! </h3>
```

## Some other code

```neptune[title=HTML,frame=frame2,outputID=HTMLOutput,language=HTML]
<h1 class="my-test">Test this HTML!</h1>
```

```neptune[title=CSS,frame=frame2,language=CSS]
.my-test {
  color: red;
}
```
