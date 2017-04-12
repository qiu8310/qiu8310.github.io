


"use strict";


var toString 	= function(o){ return Object.prototype.toString.call(o); },
toArray 	= function(o){ return Array.prototype.slice.call(o, 0); },
isNaN    	= function(o){ return o !== o},
isNotNaN	= function(o){ return o === o},
//debug
debug 		= true;

// 常用方法
var bindEvent, 
	upFirst,
	each, 	// 遍历数组
	id,     // getElementById的缩写，并带有缓存
	getNodePosition,  // 得到DOM元素的位置
	getNodeSize,	// 得到DOM元素的大小
	getViewPosition,  // 视口的位置
	getViewSize, 	//视口的大小
	getUid, 	// 得到一个从1开始的唯一ID
	getUUID, 	// 得到一个唯一的 UUID
	randomStr,
	make, 		// 生成DOM元素或修改属性
	extend;		// 继承用的

bindEvent=function(obj, type, func, scope){
	if(isString(obj)) obj = document.getElementById(obj);
    function handler(e){
        e = e || window.event;
        if (!e.target){
            e.target = e.srcElement;
            e.preventDefault = function(){
                this.returnValue = false;
            };
            e.stopPropagation = function(){
            	this.cancelBubble = true;
            };
        }
        func.call(scope || this, e);
    };
    // 建议不要一议性监听多个组件，可以监听它们的共同父元素，再来判断是哪个具体子元素，除非是些不冒泡的事件
    if(toString(obj) === '[object NodeList]'){
		for(var i=0,l=obj.length; i<l; ++i){
			bindEvent(obj[i], type, handler);
		}
	}else if(obj){
	    if(obj.attachEvent){
	        obj.attachEvent('on' + type, handler);
	    }else if(obj.addEventListener){
	        obj.addEventListener(type, handler, false);
	    }
	}
}; 

upFirst = function(str){
	if(str === '') return str;
	return str.charAt(0).toUpperCase() + str.substr(1);
}

each = function(arr, func, obj){
	if(!obj) obj = null;
	for(var i=0,l=arr.length; i<l; ++i){
		func.apply(obj, [i,arr[i]]);
	}
};

id = (function(){
	var cache = {};
	return function(tag, force){
		if(force !== true && cache[tag]) return cache[tag];
		var r = document.getElementById(tag);
		cache[tag] = r;
		return r;
	}
})()

getNodePosition = function(e){
	var e1=e, e2=e;
	var x=0, y=0;
	if(e1.offsetParent) {
		do {
			x += e1.offsetLeft;
			y += e1.offsetTop;
		} while(e1 = e1.offsetParent);
	}
	while((e2 = e2.parentNode) && e2.nodeName.toUpperCase() !== 'BODY') {
		x -= e2.scrollLeft;
		y -= e2.scrollTop;
	}
	return {x:x, y:y};
},

getNodeSize = function(e){	return {width:e.offsetWidth, height:e.offsetHeight}; }

getViewPosition = function(){
	if(typeof window.pageYOffset === 'number') {
		return {x: window.pageXOffset, y: window.pageYOffset };
	}else if( document.body && (document.body.scrollLeft || document.body.scrollTop) ){
		return {x: document.body.scrollLeft, y: document.body.scrollTop};
	}else if( document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop) ){
		return {x: document.documentElement.scrollLeft, y: document.documentElement.scrollTop};
	}else{
		return {x: 0, y: 0};
	}
}

getViewSize = function() {
	if(typeof window.innerWidth === 'number'){
		return {width: window.innerWidth, height: window.innerHeight};
	}else if(document.body && (document.body.clientWidth || document.body.clientHeight)) {
		return {width: document.body.clientWidth, height: document.body.clientHeight};
	}else if(document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
		return {width: document.documentElement.clientWidth, height: document.documentElement.clientHeight};
	}else {
		return {width: 0, height: 0};
	}
},



// 将Math中常用的函数放到window域中
each(['cos','sin','tan','atan2','min','max','abs','sqrt','PI'], function(i,item){
	this[item] = Math[item];
}, window);

// 检测对象类型函数
each(['Object', 'Array', 'String', 'Number', 'Boolean', 'Function'], function(i, item){
	this['is'+item] 	= function(o){ return toString(o) === '[object '+item+']'};
	this['isNot'+item] 	= function(o){ return toString(o) !== '[object '+item+']'};
}, window);

// console 调试函数
each(['log','info','error'], function(i, item){
	this[item] = function(){ if(debug) console[item].apply(console, toArray(arguments))};
}, window);



/**
 *	UUID
 *	xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx, where each x is replaced with a random hexadecimal digit from 0 to f, 
 *	and y is replaced with a random hexadecimal digit from 8 to b.
 */
getUUID = function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b}
 
randomStr = function(length, max){
	var random_string_chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	max = max || random_string_chars.length;
    var i, ret = [];
    for(i=0; i < length; i++) {
        ret.push( random_string_chars.substr(Math.floor(Math.random() * max),1) );
    }
    return ret.join('');
}

/**
 *  得到一个唯一的id， 并带上字符串前缀
 */
getUid = (function(){
    var id = 0, pre = randomStr(5) + '_';
    return function(){ return pre + (++id) ; };
})();



make = function(dom, left, top, width, height, position){
	left = left || 0;
	top = top || 0;
	var style, isCanvas=isString(dom) && dom==='canvas' || toString(dom)==='[object HTMLCanvasElement]';
	if(isString(dom)){
		dom = document.createElement(dom);
	}
	style = dom.style;
	
	if(position) style.position = position;
	style.left = left + 'px';
	style.top = top + 'px';
	style.width = width + 'px';
	style.height = height + 'px';

	if(isCanvas){
		dom.width = width;
		dom.height = height;
	}
	
	return dom;
};

/**
 *  	参数: 		[deep], obj1, obj2, ..., objn, [props], [type]
 *
 *  	deep: 		Boolean参数，如果deep为true，则进行深度复制。
 *  	obj2...objn:	将 obj2 - objn上的属性加到obj1上去。
 *	props: 		指定要覆盖或添加的字段名，可以是字符串(用逗号隔开每个字段和数组)，
 *			指定此字段后就不会把其它对象的所有属性都覆盖或添加到obj1上去。
 *  	type: 		最后一个Number参数,默认为 3：
 *				1 => 覆盖原有属性，不添加新属性	extend.OVERRIDE
 *				2 => 覆盖原有属性，也添加新属性	extend.OVERRIDE_ADD
 *				3 => 不覆盖原属性，但添加新属性	extend.ADD
 */
extend = function(){
	var	deep = false, len = arguments.length, i=0, orig , 
		obj, key, type = 3, props = false, propsObj={};
	if(isBoolean(arguments[i]) ){
		deep = arguments[i++];
	}
	// 获得 type 值
	if( isNumber( arguments[len-1] )){
		type = arguments[--len];
	}

	// 获得props数组并将 props 数组的值保存到 propsObj 对象的键中
	if(isString(arguments[len-1]) || isArray(arguments[len-1]) ){
		props = arguments[--len];
		if(isString(props)) props = props.split(',');
		for(var l=props.length; l>0; --l) propsObj[props[l-1]] = l-1;
	}
	orig = arguments[i] || {};
	var tempObj;
	while(++i < len){
		obj = arguments[i] ;
		if( obj === undefined || isNotObject(obj)) continue;
		tempObj = props === false ? obj : propsObj;
		for(key in tempObj) {
			if(deep && isObject(obj[key])){
        			if(orig === obj[key]) continue; // avoid dead loop
        			extend(deep, orig[key], obj[key], type);
	        	}else{
	        		switch(type){
		    			case 1: 	// OVERRIDE
		    				if(orig.hasOwnProperty(key) && obj.hasOwnProperty(key) && obj[key] !== undefined )  
							orig[key] = obj[key];
		    			break;
		    			case 2: 	// OVERRIDE & ADD
		    				orig[key] = obj[key];
		    			break;
		    			case 3: 	// ADD
		    			default:
		    				if(orig[key] === undefined && obj.hasOwnProperty(key) && obj[key] !== undefined ) 
							orig[key] = obj[key];
		    			break;
	        		}
	        	}
	    	}
	}

	return orig;
};
extend.OVERRIDE = 1;
extend.OVERRIDE_ADD = 2;
extend.ADD = 3;




// 常用画图方法
var drawRoundRect, drawOval, drawDiamond, drawRegularPolygon;

/**
 *	画圆角矩形
 */
drawRoundRect = function(ctx, x, y, width, height, r){
	r = r === undefined ? 3 : r;
	if(width < 30 && height < 30 ) r = 0;	// 长宽太小圆角也没意义
	if(r===0){
		ctx.rect(x, y, width, height);
	}else{
		ctx.moveTo(x, y+r);
		ctx.arcTo(x, y, x+r, y, r);
		ctx.lineTo(x+width-r, y);
		ctx.arcTo(x+width, y, x+width, y+r, r);
		ctx.lineTo(x+width, y+height-r);
		ctx.arcTo(x+width, y+height, x+width-r, y+height, r);
		ctx.lineTo(x+r, y+height);
		ctx.arcTo(x, y+height, x, y+height-r, r);
		ctx.lineTo(x, y+r);
	}
}

/**
 *	画椭圆 和 圆， 画圆的话不用传 height 参数，或 height=width
 */
drawOval = function(ctx, x, y, width, height ){
	height = height || width; 
	var cterX = x + width*0.5,
		cterY = y + height*0.5;
	if(width === height){
		ctx.arc(cterX, cterY, width*0.5, 0, 2*PI, false);
	}else{
		ctx.scale(width/height, 1);
		ctx.arc(cterX, cterY, height*0.5, 0, 2*PI, false);
		ctx.scale(height/width, 1);
	}
}
/**
 *	画菱形
 */
drawDiamond  = function(ctx, x, y, width, height){
	var half_width = width * 0.5, half_height = height * 0.5;
	ctx.lineJoin = 'round';
	ctx.moveTo(x, y+half_height);
	ctx.lineTo(x+half_width, y);
	ctx.lineTo(x+width, y+half_height);
	ctx.lineTo(x+half_width, y+height);
	ctx.lineTo(x, y+half_height);
}


/**
 *	画正多边形
 * 	指定中心，再指定正多边形的一个点，就可以得到其它点了
 */
 /*
drawRegularPolygon = function(ctx, radius, sides){
	ctx.moveTo(0, 0 - radius);

    for(var n = 1; n < sides; n++) {
        var x = radius * Math.sin(n * 2 * Math.PI / sides);
        var y = -1 * radius * Math.cos(n * 2 * Math.PI / sides);
        ctx.lineTo(x, y);
    }
    ctx.closePath();
}
*/

/**
 *  Key Event
 *  David Flanagan 《JavaScript: The Definitive Guide》
 */
var KeyEvent = (function(){
	
	var maps = {},
		keyCodeToFunctionKey = {
		     8: "backspace", 9: "tab", 13: "return", 19:'pause', 27: "escape", 32: "space",
		     33: "pageup", 34: "pagedown", 35: "end", 36: "home", 37: "left", 38: "up", 
		     39:'right', 40:'down', 44:'printscreen', 45:'insert', 46:'delete',
		     112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7",
		     119: "f8", 120: "f9", 121: "f10", 122: "f11", 123: "f12",144: "numlock", 145: "scrolllock"
		    },
		 keyCodeToPrintableChar = {
		     48: "0", 49: "1", 50: "2", 51: "3", 52: "4", 53: "5", 54: "6", 55: "7", 56: "8", 57: "9", 59: ";", 61: "=",
		     65: "a", 66: "b", 67: "c", 68: "d", 69: "e", 70: "f", 71: "g", 72: "h", 73: "i", 74: "j", 75: "k", 76: "l", 77: "m",
		     78: "n", 79: "o", 80: "p", 81: "q", 82: "r", 83: "s", 84: "t", 85: "u", 86: "v", 87: "w", 88: "x", 89: "y", 90: "z",
		     107: "+", 109: "-", 110: ".", 188: ",", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\", 221: "]", 222: "\""
		 };
	function bind(element, obj){
		if(obj === undefined){obj=element; element=null}
		for(var i in obj){
			if(!isFunction(obj[i])) continue;
			// 将用户输入的按键前缀按 alt+ctrl+shift排序
			var keys,key, keyStr = i.toLowerCase();
			keys = keyStr.split('+');
			key = keys.pop();
			keys.sort().push(key);
			key = keys.join('+');
			maps[key] = obj[i];
		}
		if(element) install(element);
	}
	function unbind(name){
		delete maps[name.toLowerCase()];
	}
	function install(element){
		function handler(e){ return filter(e); }
		bindEvent(element, 'keydown', handler);
		bindEvent(element, 'keypress', handler);
	}
	/*
	 *  每次按键，一般都会有keydown,keypress全过来，用这个函数来过滤，看用户按下的到底是什么按键
	 *  keydown/deyup 是两个低层的事件，而keypress则属于用户层吧，一般只有在用户按下的键可以打印出来才会触发这个keypress
	 */
	function filter(e){
		var modifiers = '', // 表示 Alt,Ctrl,Shift这些前缀 
			keyname = null;	// 键盘上显示的名字
		if(e.type == 'keydown'){
			var code = e.keyCode;
			//  Alt,Ctrl,Shift 按下则忽略
			if(code == 16 || code == 17 || code == 18) return;
			
			keyname = keyCodeToFunctionKey[code];
			
			//按下的不是功能键，如果Alt或Ctrl按下了则就把这个键当作功能键
			if(!keyname && (e.altKey || e.ctrlKey))
				keyname = keyCodeToPrintableChar[code];
			
			if(keyname){
				if(e.altKey) modifiers += 'alt+';
				if(e.ctrlKey) modifiers += 'ctrl+';
				if(e.shiftKey) modifiers += 'shift+';
			}else{
				return;
			}
		}else if(e.type == 'keypress'){
			// keydown的时候已经处理了这两个键
			if(e.altKey || e.ctrlKey) return; 
			// 在Firefox中，不可打印的字符也会触发 keypress 事件，我们要忽略它
			if(e.charCode != undefined && e.charCode == 0) return ;
			// Firefox 把打印的字符的ASCII码保存在 charCode 上，而IE保存在 keyCode上
			var code = e.charCode || e.keyCode;
			keyname = String.fromCharCode(code);
			var lowercase = keyname.toLowerCase();
			if(keyname != lowercase){
				keyname = lowercase;
				modifiers = 'shift+';
			}
		}
		//log(modifiers+keyname)
		var func = maps[modifiers+keyname];
		if(func){
			var target = e.target, r=0;
			r = func(target, modifiers+keyname, e);
			if(r&1) e.preventDefault();
			if(r&2) e.stopPropagation();
			
		} 
	}
	return {
		bind : bind,
		unbind : unbind,
		install : install
	}
})()




/**
 * Matrix Object
 */
function Transform() {
    this.m = [1, 0, 0, 1, 0, 0];
}

Transform.prototype = {
    /**
     * Apply translation
     * @param {Number} x
     * @param {Number} y
     */
    translate: function(x, y) {
        this.m[4] += this.m[0] * x + this.m[2] * y;
        this.m[5] += this.m[1] * x + this.m[3] * y;
    },
    /**
     * Apply scale
     * @param {Number} sx
     * @param {Number} sy
     */
    scale: function(sx, sy) {
        this.m[0] *= sx;
        this.m[1] *= sx;
        this.m[2] *= sy;
        this.m[3] *= sy;
    },
    /**
     * Apply rotation
     * @param {Number} rad  Angle in radians
     */
    rotate: function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        var m11 = this.m[0] * c + this.m[2] * s;
        var m12 = this.m[1] * c + this.m[3] * s;
        var m21 = this.m[0] * -s + this.m[2] * c;
        var m22 = this.m[1] * -s + this.m[3] * c;
        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
    },
    /**
     * Returns the translation
     * @returns {Object} 2D point(x, y)
     */
    getTranslation: function() {
        return {
            x: this.m[4],
            y: this.m[5]
        };
    },
    /**
     * Transform multiplication
     * @param {Kinetic.Transform} matrix
     */
    multiply: function(matrix) {
        var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
        var m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];

        var m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
        var m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

        var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
        var dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
        this.m[4] = dx;
        this.m[5] = dy;
    },
    /**
     * Invert the matrix
     */
    invert: function() {
        var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
        var m0 = this.m[3] * d;
        var m1 = -this.m[1] * d;
        var m2 = -this.m[2] * d;
        var m3 = this.m[0] * d;
        var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
        var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
        this.m[0] = m0;
        this.m[1] = m1;
        this.m[2] = m2;
        this.m[3] = m3;
        this.m[4] = m4;
        this.m[5] = m5;
    },
    /**
     * return matrix
     */
    getMatrix: function() {
        return this.m;
    }
};

/**
 *	点
 */
function Point(x, y){
	if(isObject(x)){
		y = x.y;
		x = x.x;
	}
	this.x = x ? x : 0;
	this.y = y ? y : 0;
}

Point.prototype = {
/*
	rotate: function(theta){
		var c = cos(theta), s = sin(theta),
			x = this.x,  y = this.y;
		this.x = x*c + y*s;
		this.y = y*c - x*s;
		return this;
	},
	scale: function(x, y){
		if(isObject(x)){
			y = x.y;
			x = x.x;
		}
		this.x *= x;
		this.y *= y;
		return this;
	},
*/
	/*
	 * 到某点距离
	 */
	distance: function(p){
		var x = p.x - this.x; 
		var y = p.y - this.y;
		return Math.sqrt(x*x + y*y);
	},
	/*
	 * 点在两点区域之间
	 */
	between: function(p1,p2){
		return this.y!==p1.y && this.x!== p1.x && (p2.y-this.y)/(this.y-p1.y) > 0 && (p2.x-this.x)/(this.x-p1.x) > 0;
		
	},
	/*
	 * 点到直线距离
	 */
	toLineDistance: function(p1, p2){
		var k, b;
		k = Math.tan(atan2(p2.y-p1.y, p2.x-p1.x));
		b=p2.y-k*p2.x;
		return abs((k*this.x - this.y + b)/(sqrt(k*k + 1)));
	},
	/*
	 * 拷贝某点
	 */
	copy: function(p){
		this.x = p.x;
		this.y = p.y;
	},
	/*
	 * 判断 p 相对于此点所在的象限 ，共有 1,2,3,4四个象限，1在右下角，顺时针往后数 
	 *  返回 0表示在坐标轴上
	 * 
	 */
	getQuadrant: function(p){
		var x,y;
		x=p.x-this.x; y=p.y-this.y;
		if(x>0){
			if(y>0) return 1;
			else if(y<0) return 4;
		}else if(x<0){
			if(y>0) return 2;
			else if(y<0) return 3;
		}
		return 0;
	},
	/*
	 *  判断点是否在相对于此点的那个象限
	 *  str 是你指定的象限，总共有 'x,x+,x-,y,y+,y-,1,2,3,4'这些
	 */
	locate: function(p, str){
		str = str.toLowerCase().split(',');
		for(var i=str.length; i>0; --i){
			switch(str[i-1].replace(/^\s*|\s*$/g, '')){
				case 'x':
					if(p.y === this.y) return true; break;
				case 'y': 
					if(p.x === this.x) return true; break;
				case 'x+':
					if(p.y === this.y && p.x > this.x ) return true; break;
				case 'x-':
					if(p.y === this.y && p.x < this.x ) return true; break;
				case 'y+':
					if(p.x === this.x && p.y > this.y ) return true; break;
				case 'y-':
					if(p.x === this.x && p.y < this.y ) return true; break;
				case '1':
					if(p.x > this.x && p.y > this.y  ) return true; break;
				case '2':
					if(p.x < this.x && p.y > this.y ) return true; break;
				case '3':
					if(p.x < this.x && p.y < this.y ) return true; break;
				case '4':
					if(p.x > this.x && p.y < this.y ) return true; break;
			}
		}
		return false;
	}

};


/*
Line.ArrowType = {
	NONE_ARROW: 'none',
	NO_CLOSED_ARROW: 'line',
	// > 形式的 arrow
	EMPTY_ARROW: 'hollow',
	// 空心的 arrow
	FILL_ARROW: 'solid' // 带填充的 arrow
};
*/

/* 画带前头的线 
 *	context: canvas 的 context 属性
 *	points:  collection of point
 *	lineType:  normal / dot / dash
 *	startArrow: 0 => no arrow; 1 => '>';  2 => empty close arrow;   3 => solid arrow
 *  endArrow: just like startArrow
 *	arrowFillStyle: when startArrow/endArrow is 3, you can set the fill style, or it will be 'black'
 *	direction: when the only two point are on same point, it will draw a circle according the direction
*/

function drawLine(context, points, lineType, startArrow, endArrow, arrowFillStyle, direction){
	var len = points.length, step, p1, p2, p = new Point(), k, c, s,
		i=0, // 当前点索引
		pathDraw = arrowFillStyle === true ? true : false,
		r=0; // 圆角
	arrowFillStyle = isBoolean(arrowFillStyle) || arrowFillStyle === undefined ? '#000' : arrowFillStyle;

	var arrowMap = {'none': 0, 'line': 3, 'hollow': 2, 'solid' : 1 }
	if(!isNumber(startArrow))	startArrow = arrowMap[startArrow];
	if(!isNumber(endArrow)) 	endArrow = arrowMap[endArrow];
	
	if(len < 2) return false;
	
	switch (lineType){
		case 'normal': step = 0 ; r=6; break;
		case 'dot':	   step = 2 ; break;
		case 'dash':   step = 10; break;
		default: throw new Error('Unknown LineType in drawLine function');
	}

	p1 = points[i];
	if(!(p1 instanceof Point) ){
		p1 = new Point(p1);
	}
	
	// 起点终点在同一点上
	if(len===2 && direction){
		
		var dis = 15;
		switch(direction){
		case 'n': points.splice(1,0, new Point(p1.x-dis,p1.y-dis), new Point(p1.x+dis,p1.y-dis));
			break;
		case 's': points.splice(1,0, new Point(p1.x+dis,p1.y+dis), new Point(p1.x-dis,p1.y+dis));
			break;
		case 'w': points.splice(1,0, new Point(p1.x-dis,p1.y-dis), new Point(p1.x-dis,p1.y+dis));
			break;
		default: points.splice(1,0, new Point(p1.x+dis,p1.y-dis), new Point(p1.x+dis,p1.y+dis));
		}
		len = 4;
		r = 0;
	}
	
	context.moveTo(p1.x, p1.y);
	while(++i < len){
		p2 = new Point(points[i]);
		
		k = atan2(p2.y - p1.y, p2.x - p1.x);
		
		if(step !== 0 ){
			c = step*cos(k), s = step*sin(k);
			p.x = p1.x+c;
			p.y = p1.y+s;

			// 画虚线
			while(p.distance(p2) > step){
				context.lineTo(p.x, p.y);
				p.x += c;	p.y += s;
				context.moveTo(p.x, p.y);
				p.x += c;	p.y += s;
			}
		}
		
		// 最后一个点了 或者该点和上一点或下一点距离太近
		if(r === 0 || i === len-1 || p2.distance(p1)<8 || ( p2.distance(points[i+1])<8)){
			context.lineTo(p2.x, p2.y);
		}else{
		// 画圆角
			var k2, p3, deg, stepLen, t2, t;
			p3 = points[i+1];
			k2 = atan2(p3.y-p2.y, p3.x-p2.x);
			t2 = k2 < 0 ? k2 + PI : k2;
			t  = k  < 0 ? k  + PI : k;
			deg = (t2 - t) / 2 ;
			stepLen = abs( r/tan(deg) );

			context.lineTo(p2.x - stepLen*cos(k),  p2.y - stepLen*sin(k) );
			context.arcTo(p2.x, p2.y, p2.x + stepLen*cos(k2), p2.y + stepLen*sin(k2), r );
		}

		p1 = points[i];
	}
	
	if(!pathDraw)
		context.stroke();


	//画箭头
	if(startArrow !== 0 || endArrow !== 0){
		var deg1, deg2, arrowLen = 13, types=[startArrow, endArrow], x1,x2,y1,y2, t;
		i = types.length;
		while(i--){
			arrowLen = -arrowLen;
			if(!types[i]) continue;
			if(i === 1){ 
				p2 = points[len-1];
				p1 = points[len-2];
				p = p2;
			}else{
				p2 = points[1];
				p1 = points[0];
				p = p1;
			}

			k = atan2(p2.y - p1.y, p2.x - p1.x);
			deg1 = k - PI/10;
			deg2 = k + PI/10;

			x1 = p.x + arrowLen*cos(deg1); y1 = p.y + arrowLen*sin(deg1);
			x2 = p.x + arrowLen*cos(deg2); y2 = p.y + arrowLen*sin(deg2);

			context.beginPath();
			context.moveTo(x1, y1);
			context.lineTo(p.x, p.y);
			context.lineTo(x2, y2);

			switch(types[i]){
				case 1: break;
				case 2:
					t = context.fillStyle;
					context.fillStyle = '#FFF';
					context.closePath();
					context.fill();
					context.fillStyle = t;
					break;
				case 3:
					t = context.fillStyle;
					context.fillStyle = arrowFillStyle ;
					context.closePath();
					context.fill();
					context.fillStyle = t;
					break;
					
			}
			context.stroke();
		}
	}
}


