(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.LogicGraphExtension = factory();
  }
}(this, function () {
  const LogicGraphExtension = {
    floatButton: [
      {
        "button_name": "Show",
        "event": "click",
        "callback": function (d) {
          const self = this;

        }
      }
    ],


  };



  return LogicGraphExtension;
}))