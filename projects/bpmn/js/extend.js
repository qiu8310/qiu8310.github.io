// JavaScript标准对象上的继承
//Basic support: Firefox(Gecko) 4.0 (2) Chrome 7  IE 9  Opera 11.6  Safari 5.14
if(!Function.prototype.bind) {
  Function.prototype.bind = function() {
    if(arguments.length === 0) return this;
    var context = Array.prototype.splice.call(arguments, 0, 1).pop(),
      args = toArray(arguments),
      func = this;
    return function() {
      args = args.concat(toArray(arguments));
      if(this instanceof arguments.callee) context = this;
      func.apply(context, args);
    }
  }
}

//Basic support: IE 9  ( below is the same if no state )
if (!Array.prototype.indexOf) {  
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {  
        "use strict";  
        if (this == null) {  
            throw new TypeError();  
        }  
        var t = Object(this);  
        var len = t.length >>> 0;  
        if (len === 0) {  
            return -1;  
        }  
        var n = 0;  
        if (arguments.length > 0) {  
            n = Number(arguments[1]);  
            if (n != n) { // shortcut for verifying if it's NaN  
                n = 0;  
            } else if (n != 0 && n != Infinity && n != -Infinity) {  
                n = (n > 0 || -1) * Math.floor(Math.abs(n));  
            }  
        }  
        if (n >= len) {  
            return -1;  
        }  
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);  
        for (; k < len; k++) {  
            if (k in t && t[k] === searchElement) {  
                return k;  
            }  
        }  
        return -1;  
    }  
}  

if (!Array.prototype.lastIndexOf) {  
  Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/) {  
    "use strict";  
  
    if (this == null)  
      throw new TypeError();  
  
    var t = Object(this);  
    var len = t.length >>> 0;  
    if (len === 0)  
      return -1;  
  
    var n = len;  
    if (arguments.length > 1) {  
      n = Number(arguments[1]);  
      if (n != n)  
        n = 0;  
      else if (n != 0 && n != (1 / 0) && n != -(1 / 0))  
        n = (n > 0 || -1) * Math.floor(Math.abs(n));  
    }  
  
    var k = n >= 0  
          ? Math.min(n, len - 1)  
          : len - Math.abs(n);  
  
    for (; k >= 0; k--) {  
      if (k in t && t[k] === searchElement)  
        return k;  
    }  
    return -1;  
  };  
}  

if (!Array.prototype.map) {  
  Array.prototype.map = function(callback, thisArg) {  
  
    var T, A, k;  
  
    if (this == null) {  
      throw new TypeError(" this is null or not defined");  
    }  
  
    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.  
    var O = Object(this);  
  
    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".  
    // 3. Let len be ToUint32(lenValue).  
    var len = O.length >>> 0;  
  
    // 4. If IsCallable(callback) is false, throw a TypeError exception.  
    // See: http://es5.github.com/#x9.11  
    if ({}.toString.call(callback) != "[object Function]") {  
      throw new TypeError(callback + " is not a function");  
    }  
  
    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.  
    if (thisArg) {  
      T = thisArg;  
    }  
  
    // 6. Let A be a new array created as if by the expression new Array(len) where Array is  
    // the standard built-in constructor with that name and len is the value of len.  
    A = new Array(len);  
  
    // 7. Let k be 0  
    k = 0;  
  
    // 8. Repeat, while k < len  
    while(k < len) {  
  
      var kValue, mappedValue;  
  
      // a. Let Pk be ToString(k).  
      //   This is implicit for LHS operands of the in operator  
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.  
      //   This step can be combined with c  
      // c. If kPresent is true, then  
      if (k in O) {  
  
        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.  
        kValue = O[ k ];  
  
        // ii. Let mappedValue be the result of calling the Call internal method of callback  
        // with T as the this value and argument list containing kValue, k, and O.  
        mappedValue = callback.call(T, kValue, k, O);  
  
        // iii. Call the DefineOwnProperty internal method of A with arguments  
        // Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},  
        // and false.  
  
        // In browsers that support Object.defineProperty, use the following:  
        // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });  
  
        // For best browser support, use the following:  
        A[ k ] = mappedValue;  
      }  
      // d. Increase k by 1.  
      k++;  
    }  
  
    // 9. return A  
    return A;  
  };        
}  

if ( !Array.prototype.forEach ) {  
  
  Array.prototype.forEach = function( callback, thisArg ) {  
  
    var T, k;  
  
    if ( this == null ) {  
      throw new TypeError( " this is null or not defined" );  
    }  
  
    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.  
    var O = Object(this);  
  
    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".  
    // 3. Let len be ToUint32(lenValue).  
    var len = O.length >>> 0; // Hack to convert O.length to a UInt32  
  
    // 4. If IsCallable(callback) is false, throw a TypeError exception.  
    // See: http://es5.github.com/#x9.11  
    if ( {}.toString.call(callback) != "[object Function]" ) {  
      throw new TypeError( callback + " is not a function" );  
    }  
  
    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.  
    if ( thisArg ) {  
      T = thisArg;  
    }  
  
    // 6. Let k be 0  
    k = 0;  
  
    // 7. Repeat, while k < len  
    while( k < len ) {  
  
      var kValue;  
  
      // a. Let Pk be ToString(k).  
      //   This is implicit for LHS operands of the in operator  
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.  
      //   This step can be combined with c  
      // c. If kPresent is true, then  
      if ( k in O ) {  
  
        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.  
        kValue = O[ k ];  
  
        // ii. Call the Call internal method of callback with T as the this value and  
        // argument list containing kValue, k, and O.  
        callback.call( T, kValue, k, O );  
      }  
      // d. Increase k by 1.  
      k++;  
    }  
    // 8. return undefined  
  };  
}  

if (!Array.prototype.every) {  
  Array.prototype.every = function(fun /*, thisp */)  {  
    "use strict";  
  
    if (this == null)  
      throw new TypeError();  
  
    var t = Object(this);  
    var len = t.length >>> 0;  
    if (typeof fun != "function")  
      throw new TypeError();  
  
    var thisp = arguments[1];  
    for (var i = 0; i < len; i++) {  
      if (i in t && !fun.call(thisp, t[i], i, t))  
        return false;  
    }  
  
    return true;  
  };  
}  

if (!Array.prototype.filter){
  Array.prototype.filter = function(fun /*, thisp */){
    "use strict";
    if (this == null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++){
      if (i in t) {
        var val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
}


//Basic support: IE 9   Opera 10.5  Safari 5 
if(!String.prototype.trim) {  
  String.prototype.trim = function () {  
    return this.replace(/^\s+|\s+$/g,'');  
  };  
}  

//C 5 FF 4.0 (2)  IE 9  O 11.60  S 5
if (!Object.create) {  
    Object.create = function (o) {  
        if (arguments.length > 1) {  
          // 支持的浏览器可以带第二个参数来设置原型的属性，但这些属性是不能修改，不能枚举，所以不好手动实现
            throw new Error('Object.create implementation only accepts the first parameter.');  
        }  
        function F() {}  
        F.prototype = o;  
        return new F();  
    };  
}  

// FF 4(2.0)  C 5  IE 9 O 12  S 5
if (!Object.keys) {  
    Object.keys = function (o) {  
      var key, rtn = [];
      for( key in o) {
        if(o.hasOwnProperty(key)){
          rtn.push(key);
        }
      }
      return rtn; 
    };  
}  

// FF 4 (2.0) C 5  IE 9 O 10.5   S 5
if(!Array.isArray) {  
  Array.isArray = function (arg) {  
    return Object.prototype.toString.call(arg) == '[object Array]';  
  };  
}  


/* add on prototype  非标准 */
if(!Function.prototype.method) {
  Function.prototype.method = function(name, func) {
    this.prototype[name] = func;
    return this;
  }
}
if(!String.prototype.ltrim) {  
  String.prototype.ltrim = function () {  
    return this.replace(/^\s+/,'');  
  };  
}  
if(!String.prototype.rtrim) {  
  String.prototype.rtrim = function () {  
    return this.replace(/\s+$/,'');  
  };  
}  

// ======================= DOM Utility Functions from PastryKit =============================== //
// Sure, we could use jQuery or XUI for these,
// but these are concise and will work with plain vanilla JS
Element.prototype.hasClassName = function (a) {
    return new RegExp("(?:^|\\s+)" + a + "(?:\\s+|$)").test(this.className);
};

Element.prototype.addClassName = function (a) {
    if (!this.hasClassName(a)) {
        this.className = [this.className, a].join(" ");
    }
};

Element.prototype.removeClassName = function (b) {
    if (this.hasClassName(b)) {
        var a = this.className;
        this.className = a.replace(new RegExp("(?:^|\\s+)" + b + "(?:\\s+|$)", "g"), " ");
    }
};

Element.prototype.toggleClassName = function (a) {
    this[this.hasClassName(a) ? "removeClassName" : "addClassName"](a);
};


