// bling.js
// https://gist.github.com/paulirish/12fb951a8b893a454b32

window.$ = document.querySelectorAll.bind(document);

Node.prototype.on = window.on = function (name, fn) {
  this.addEventListener(name, fn);
};

NodeList.prototype.__proto__ = Array.prototype;

NodeList.prototype.on = NodeList.prototype.addEventListener = function (name, fn) {
  this.forEach(function (elem, i) {
    elem.on(name, fn);
  });
};

Array.prototype.find = function (fn) {
  for (var i = 0; i < this.length; i++) if (fn(this[i], i, this)) return this[i];
  return null;
}