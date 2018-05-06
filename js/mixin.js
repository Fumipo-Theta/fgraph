// ref.: http://qiita.com/gaogao_9/items/97eab8808b4304fa2073

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.mixinModule = factory();
  }
}(this, function () {

  function on(superClass) {
    if (typeof (superClass) === "function") {
      return mixinChecker.bind(superClass);
    }
    if (Array.isArray(superClass) && superClass[0] === "mixin") {
      return mixin.bind(null);
    }
    throw new TypeError("変なの渡すな");
  }

  function mixinChecker([str]) {
    if (str !== "mixin") throw new TypeError("変なの渡すな");
    return mixin.bind(this);
  }

  function mixin(...mixinList) {
    const MixinReciever = createMixinReciever.call(this, ctorCallback);
    const ctorList = [];

    for (const mixinFunc of mixinList) {
      const ctor = mixinClass(MixinReciever, mixinFunc);

      if (ctor) ctorList.push(ctor);
    }

    return MixinReciever;

    function ctorCallback(...args) {
      for (const ctor of ctorList) {
        const ins = new ctor(...args);
        for (const key of Reflect.ownKeys(ins)) {
          const descriptor = Object.getOwnPropertyDescriptor(ins, key);

          descriptor.configurable = true;
          descriptor.enumerable = false;
          if (descriptor.hasOwnProperty("writable")) {
            descriptor.writable = true;
          }

          Object.defineProperty(this, key, descriptor);
        }
      }
    }
  }

  function createMixinReciever(ctorCallback) {
    if (typeof (this) === "function") {
      // class Hoge extends on (Fuga) `mixin` (...) の形の場合ここを通る
      return class MixinReciever extends this{
        constructor(...args) {
          super(...args);
          ctorCallback.call(this, ...args);
        }
      };
    }

    // class Hoge extends on `mixin` (...) の形の場合ここを通る
    return class MixinReciever {
      constructor(...args) {
        ctorCallback.call(this, ...args);
      }
    };
  }

  // mixinClass関数(今度はcontructor対応します)
  function mixinClass(baseClass, target) {
    const targetObj = (typeof (target) === "function")
      ? target.prototype
      : target;
    let ctor = null;

    for (const key of Reflect.ownKeys(targetObj)) {
      const descriptor = Object.getOwnPropertyDescriptor(targetObj, key);

      if (key === "constructor") {
        if (typeof (descriptor.value) === "function") {
          ctor = descriptor.value;
        }
        continue;
      }

      descriptor.configurable = true;
      descriptor.enumerable = false;
      if (descriptor.hasOwnProperty("writable")) {
        descriptor.writable = true;
      }

      Object.defineProperty(baseClass.prototype, key, descriptor);
    }

    return ctor;
  }

  return {
    on: on,
    mixin: mixin
  }
}))
