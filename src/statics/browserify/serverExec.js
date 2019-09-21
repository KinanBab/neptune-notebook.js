// Execute this code using in the given scope name in the server via node, and get back results!
module.exports = function (code, scopeName) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', window.location.href + '/__exec');
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log(JSON.parse(xhr.responseText));
    }
  };
  xhr.send(JSON.stringify({scopeName: scopeName, code: code}));
};
