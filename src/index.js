function neptune() {
  this.documents = [];
}

neptune.prototype.addDocument = function (name, path) {
  console.log(name);
  console.log(path);

};

neptune.prototype.start = function () {
  console.log('Started neptune!');
};
