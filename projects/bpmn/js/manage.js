//(function(window, document, undefined){
"use strict";

// DOM节点有关方法

function nextNode(node) {
	do {
		node = node.nextSibling;
	} while (node && (node.nodeType === 3 || node.nodeType === 8)); // 3是TEXT_NODE, 8是COMMENT_NODE
	return node;
};

function prevNode(node) {
	do {
		node = node.previousSibling;
	} while (node && (node.nodeType === 3 || node.nodeType === 8)); // 3是TEXT_NODE, 8是COMMENT_NODE
	return node;
}


function isObjectSame(obj1, obj2){
	if(obj1 === obj2) return true;

	for(var key in obj1){
		if(!obj1.hasOwnProperty(key)) continue;
		if('object' == typeof obj1[key]){
			var r = isObjectSame(obj1[key], obj2[key]);
			if(r === false ) return false;
		}else{
			if(obj1[key] !== obj2[key]) return false;
		}
	}
	
	return true;
}

// global var
var StageRange = { // 这是计算出来的
	x: 209,
	y: 122,
	width: 1150,
	height: 760
};


var Stage = (function() {
	var instance, menu = 'menu',
		container = 'stage',
		view = 'view',
		viewport = 'viewport';

	function init() {
		container = container || 'stage';
		view = view || 'view';
		if (isString(container)) this.container = document.getElementById(container);
		if (isString(view)) this.view = document.getElementById(view);
		if (isString(view)) this.viewport = document.getElementById(viewport);
		if (isString(menu)) this.menu = document.getElementById(menu);

		this.target = null; // 不包括 hover 的target
		this.hverTarget = null; // 当前鼠标悬停的对象
		this.targetStatus = Component.Status.IS_FRESH;

		this._initMouseEventListen();
		this._initKeyEventListen();
		this._createMaskStage();
		this.children = [];
		this.childIndexs = {};
		this.count = 0;
		this.uidPrefix = 'xxoo-';
	}

	init.prototype = {
		getCurrentPageId: function(){
			var $li = $('li.selected', $('#page_bar ul'));
			if($li) return $li.attr('pageid');
			return null;
		},
		getCurrentPageName: function(){
			var $li = $('li.selected', $('#page_bar ul'));
			if($li) return $li.attr('pageid') +'_'+$('.body span', $li).html();
			return null;
		},
		getChild: function(uid){
			return this.childIndexs[uid];
		},
		bind: function(type, func){
			$(this.container).bind(type, func);
		},
		trigger: function(){
			var args = toArray(arguments);
			var type = args.shift(); 
			$(this.container).trigger(type, args);
		},
		_createMaskStage: function() {
			var maskdiv, s1, s2;
			maskdiv = document.createElement('div');
			s1 = maskdiv.style, s2 = this.container.style;
			s1.width = s2.width;
			s1.height = s2.height;
			s1.position = s2.position;
			s1.top = s2.top;
			s1.left = s2.left;
			maskdiv.id = 'stage-mask';
			this.view.appendChild(maskdiv);
			this.maskContainer = maskdiv;
		},
		save: function() {
			var cs = this.getChildren(),
				c, i, l = cs.length,
				data = {};
			for (i = 0; i < l; ++i) {
				c = cs[i];
				data[c.uid] = c.save();
			}
			return data;
		},
		cmdRemove: function(data){
			if(!isArray(data)) data = [data];
			var i = data.length;

			while(i--){
				log(data[i]['uid'])
				this.clean(this.getChild(data[i]['uid']), 'cmd');
			}
		},
		cmdRecover: function(data){
			if(!data) return;

			var i, l, temp = {};
			if(!isArray(data)) data = [data];
			for(i=0,l=data.length; i<l; ++i){
				temp[data[i]['uid']] = data[i];
			}

			this.recover(temp, true);

		},
		recover: function(data, noTriggleEvent) {
			//this.cleanAll();
			// TODO 处理 index， 可以肯定 data中的组件的index是按低到高排的
			if(!data) return;

			var lines = {}, linesData = {},
				id;

			var c, d, shapes = {};
			for (id in data) {
				d = data[id];
				if (d.type === 'line') {
					c = new Line(d);
					lines[c.uid] = c;
					linesData[c.uid] = {
						startCompId: d.startCompId,
						endCompId: d.endCompId
					};
				} else if (d.type === 'text') {
					c = new Text(d);
				} else {
					c = new Shape(d);
					shapes[c.getUid()] = c;
				}
				this.add(c, noTriggleEvent);
				if(noTriggleEvent && d.index !== undefined){
					this.moveCompBeforeTo(c, d.index);
				}
			}

			var line, shape, linedata;
			// 处理线条的连线
			for (id in lines) {
				line = lines[id];
				linedata = linesData[id];
				if (linedata.startCompId) {

					shape = shapes[linedata.startCompId] || this.getChild(linedata.startCompId);

					if(shape){
						shape.attachLine( line );
						line['startComp'] = shape;
					}
				}
				if (linedata.endCompId) {
					shape = shapes[linedata.endCompId] || this.getChild(linedata.endCompId);
					if(shape){
						shape.attachLine( line );
						line['endComp'] = shape;
					}
				}
			}
		},
		add: function(comp, _cmd) {
			comp.index = this.children.length;
			this.children.push(comp);
			var uid = comp.uid;
			if(!uid){
				this.count++;
				uid = this.uidPrefix+this.count;
				comp.uid = uid;
			}
			this.childIndexs[uid] = comp;

			comp.draw();
			this.container.appendChild(comp.getContent());
			var compMask = comp.getMaskContent();
			if (compMask) this.maskContainer.appendChild(compMask);
			this.choseTarget(comp);

			if(!_cmd && comp.type != 'line')
				this.trigger('add', comp.save('_cmd'));

		},
		clean: function(comp, _cmd) {
			if (!comp) return;
			if(stage.target === comp ) stage.target = null;
			if(!_cmd)
				this.trigger('delete', comp.save('_cmd') );
			comp.destory();
			try {
				this.container.removeChild(comp.content);
				this.maskContainer.removeChild(comp.maskContext.canvas);
			} catch (e) {}
			this.children.splice(comp.index, 1);
			delete this.childIndexs[comp.getUid()];
			this._modifyChildrenIndex();
		},
		getChildren: function() {
			return this.children;
		},
		getChildrenInfo: function() {
			var info = {
				children: 0,
				hidden: 0,
				frozen: 0
			};
			for (var c, l = this.children.length; l > 0; --l) {
				c = this.children[l - 1];
				++info.children;
				if (c.isHidden())++info.hidden;
				if (c.isFrozen())++info.frozen;
			}
			return info;
		},
		moveCompBeforeTo: function(c, index){
			var chs = this.children, ch=chs[index];
			if(ch && c.index <= index){
				this.container.insertBefore(c.content, ch.content);
				this._modifyChildrenIndex();
			}
		},
		/**
		 *	将 组件 上移、下移、上移到顶端、下移到底端
		 */
		changeChildPos: function(comp, type) { // type can be  'up', 'down', 'top', 'bottom'
			var i = comp.index,
				replace_i, children = this.children,
				temp, len = children.length;
			switch (type) {
			case 'up':
				replace_i = i + 1;
				break;
			case 'down':
				replace_i = i - 1;
				break;
			case 'top':
				replace_i = len - 1;
				break;
			case 'bottom':
				replace_i = 0;
				break;
			}
			if (replace_i < 0 || replace_i >= len || i === replace_i) return;
			temp = children[i];
			children[i] = children[replace_i];
			children[replace_i] = temp;
			temp = null;

			children[i]['index'] = i;
			children[replace_i]['index'] = replace_i;
			//this._modifyChildrenIndex();
		},
		cleanAll: function(_notcmd) {
			var triggerData = [];
			var cs = this.getChildren(),
				c, i, l;
			l = cs.length;
			i = -1;
			while (++i < l) {
				c = cs[i];
				triggerData.push(c.save());
				try {
					this.container.removeChild(c.content);
					this.maskContainer.removeChild(c.maskContext.canvas);
				} catch (e) {}
			}
			this.children = [];
			this.childIndexs = {};
			//if(!abc || !_notcmd)
			this.trigger('delete', triggerData);
		},
		showAll: function() {
			var cs = this.getChildren(),
				c, i, l;
			l = cs.length;
			i = -1;
			var uid = [], olddata = [], newdata = [];
			while (++i < l) {
				c = cs[i];
				if (c.isHidden()) {
					c.visible = true;
					c.draw();
					uid.push(c.getUid());
					olddata.push({visible: false});
					newdata.push({visible: true});
				}
			}
			if(uid.length > 0) this.trigger('change', uid, olddata, newdata);
		},
		unfreezeAll: function() {
			var cs = this.getChildren(),
				c, i, l;
			l = cs.length;
			i = -1;
			var uid = [], olddata = [], newdata = [];
			while (++i < l) {
				c = cs[i];
				if (c.isFrozen()) {
					c.frozen = false;
					c.draw();
					uid.push(c.getUid());
					olddata.push({frozen: true});
					newdata.push({frozen: false});
				}
			}
			if(uid.length > 0) this.trigger('change', uid, olddata, newdata);
		},
		drawLine: function(e) {
			var line = new Line(),
				xy = this.getStageXY(e);
			line.setStartPoint(xy.x, xy.y);
			this.targetStatus = Component.Status.IS_LINE;
			this.add(line);
			//this.cursor('crosshair');
			this.choseTarget(line);
		},
		/**
		 *	修改子元素的索引
		 */
		_modifyChildrenIndex: function() {
			for (var i = 0, len = this.children.length; i < len; ++i) {
				this.children[i]['index'] = i;
			}
		},
		/**
		 *	得到事件相对于画板的坐标
		 */
		getStageXY: function(e) {
			var x = e.clientX - StageRange.x + this.viewport.scrollLeft,
				y = e.clientY - StageRange.y + this.viewport.scrollTop;
			return {
				x: x,
				y: y
			}
		},
		/**
		 *	根据事件得到 事件作用的对象，如果没有则返回false
		 *	indeed 置为 true，则不管有没冻结，都会返回当前的 target
		 */
		getTarget: function(e, indeed) {
			var i, child, loc = this.getStageXY(e);
			indeed = indeed === undefined ? false : indeed;
			var lines = []; // 保存线条，线条放在最好考虑
			// 从图层的最上到最下，当然线条还是在最后处理
			for (i = this.children.length; i > 0; --i) {
				child = this.children[i - 1];
				if (child.isLine()) {
					lines.push(child);
				} else {
					if ((indeed || !child.frozen) && child.isPointOnMe(loc.x, loc.y)) {
						return child;
					}
				}
			}
			for (i = lines.length; i > 0; --i) {
				child = lines[i - 1];
				if ((indeed || !child.frozen) && child.isPointOnMe(loc.x, loc.y)) {
					return child;
				}
			}
			return false;
		},
		isPointOnStage: function(x, y) {
			return x > 0 && x <= StageRange.width && y > 0 && y <= StageRange.height;
		},
		/**
		 *	设定或取得当前鼠标的 状态
		 */
		cursor: function(str) {
			if (str === undefined) return this.view.style.cursor;
			if (str['cursor']) this.view.style.cursor = str['cursor'];
			else this.view.style.cursor = str;
		},

		/**
		 *	根据当前点坐标，及当前的 target 来计算出当前鼠标的样式
		 */
		setCursor: function(x, y) {
			var target = this.getHoverTarget() || this.target,
				cursor = 'auto';
			if (this.target === this.getHoverTarget() && Component.Status.IS_TEXT === this.targetStatus) {
				return 'text';
			}
			if (Component.Status.IS_DRAG === this.targetStatus) return 'move';
			if (Component.Status.IS_LINE === this.targetStatus) return 'cross-hair';
			if (Component.Status.IS_RESIZE === this.targetStatus) return this.resizeTag;
			if (target && target.getCursor) cursor = target.getCursor(x, y);
			this.cursor(cursor); // 设置样式
		},

		choseTarget: function(target, _mousedown) {
			if (target && !target.isFrozen()) {
				// 上一个对象和这个不同，要先清除上一个状态
				if (this.target && this.target !== target) {
					this.target.setChosed(false);
				}
				//this.targetStatus = Component.Status.IS_CHOSED
				target.setChosed(true);
				this.target = target;

				// mouse按下状态，不清除当前的 target
			} else if (_mousedown) {

				// 没有点中任何对象，如果上一次有选中的对象，则清除它
			} else {
				this.targetStatus = Component.Status.IS_FRESH;
				if (this.target) {
					this.target.setChosed(false);
					this.target = null;
				}
			}
			this.makeOptions(target);
		},
		hoverOnTarget: function(target) {
			if (target) {
				target.setHover(true);
				if (this.hoverTarget && this.hoverTarget !== target) {
					this.hoverTarget.setHover(false);
				}
				this.hoverTarget = target;
			} else {
				if (this.hoverTarget) {
					this.hoverTarget.setHover(false);
				}
				this.hoverTarget = null;
			}

		},
		cleanTarget: function() {
			if (this.target) {
				this.target.setChosed(false);
				this.target = null;
			}
			this.targetStatus = Component.Status.IS_FRESH;
		},
		cleanMenu: function() {
			this.menu.style.display = 'none';
		},
		/*
		 * 生成顶上的菜单
		 */
		makeOptions: function(target) {
			var t = target.options ? target.options() : null;
			option.enable(t);
		},

		getHoverTarget: function() {
			return this.hoverTarget;
		},
		/**
		 * 根据当前线及其所画到的点来确定线的结束点方位（结束点没有与其它target相交的话）
		 * @param line	当前的线
		 * @param x	当前点横坐标
		 * @param y	当前点纵坐标
		 * @returns
		 */
		getDirection: function(line, x, y) {
			var s, t, addX, addY, p, map = [{
				y: 's',
				x: 'e'
			}, {
				y: 'n',
				x: 'e'
			}, {
				y: 'n',
				x: 'w'
			}, {
				y: 's',
				x: 'w'
			}]; // 对应象限内x,y轴所指的方向 e,s,w,n=>东南西北
			p = line.getPoints();

			p = p[p.length - 2]; // 倒数第二个点
			if (!p) return;
			addX = x - p.x;
			addY = y - p.y;
			if (addX > 0) {
				if (addY > 0) s = 0;
				else s = 1;
			} else {
				if (addY > 0) s = 3;
				else s = 2;
			}
			t = abs(addY / addX) > 1 ? 'y' : 'x';

			return map[s][t];
		},
		_initKeyEventListen: function() {
			var stage = this,
				contextMenu = C('contextMenu'),
				binds = {},
				key, keys, cmds = {};

			function handler(target, key, e) {
				var t = stage.target,
					c = cmds[key];
				if (!t && stage[c]) {
					stage[c]();
				} else if (t && t[c]) {
					//编辑组件内的文字时不要将组件删除了
					if (stage.targetStatus === Component.Status.IS_TEXT && c == 'remove') return 0;
					t[c]().draw();
				}
				return 3;
			}

			for (var i in contextMenu) {
				var obj = contextMenu[i];
				if (obj['key'] && obj['key'] !== '') {
					keys = obj['key'].toLowerCase().split('+');
					key = keys.pop();
					keys.sort().push(key);
					key = keys.join('+');
					binds[key] = handler;
					cmds[key] = i;
				}
			}


			function directionHandler(target, key, e) {
				if (!stage.target || stage.targetStatus === Component.Status.IS_TEXT) return 0;
				var x = 0,
					y = 0;
				log(stage.targetStatus)
				switch (key) {
				case 'left':
					x = -1;
					break;
				case 'right':
					x = 1;
					break;
				case 'up':
					y = -1;
					break;
				case 'down':
					y = 1;
					break;
				}
				stage.target.moveAdd(x, y).draw();
				return 3;
			}
			KeyEvent.bind(document, binds);
			KeyEvent.bind({
				left: directionHandler,
				right: directionHandler,
				up: directionHandler,
				down: directionHandler
			});

		},
		_initMouseEventListen: function() {
			var view = this.view;
			if (view && view.addEventListener) {
				var stage = this, moved = false, oldTriggerData = {}, newTriggerData = {}, uid,
					cursor, textDiv, oldX, oldY, loc;

				//direction; // 画线是用的，线的结束点不在某一target上的话就根据鼠标判断它的方向;
				bindEvent(view, 'mousemove', function(e) {
					loc = stage.getStageXY(e); // 当前坐标
					// 先得到 hoverTarget， 它不影响 stage.target
					stage.hoverOnTarget(stage.getTarget(e));
					// 再根据当前 hoverTarget 设置鼠标状态
					stage.setCursor(loc.x, loc.y);

					//D.info(id, 'tool_box_wrap');
					var target = stage.target;
					if (target) {
						moved = true;
						stage.choseTarget(target);
						if (stage.targetStatus === Component.Status.IS_DRAG) {
							var endTarget = stage.getHoverTarget();
							target.move(loc.x, loc.y, oldX, oldY, endTarget).draw('recompute');
						} else if (stage.targetStatus === Component.Status.IS_RESIZE) {
							target.resize(cursor, loc.x - oldX, loc.y - oldY).draw('resize');
						} else if (stage.targetStatus === Component.Status.IS_LINE) {
							var endTarget = stage.getHoverTarget();
							target.endTo(oldX, oldY, endTarget);
						}
					}

					oldX = loc.x;
					oldY = loc.y;

					//e.preventDefault();
					//e.stopPropagation();
				}, false);

				bindEvent(view, 'mousedown', function(e) {
					stage.cleanMenu();
					stage.choseTarget(stage.getTarget(e), 'mousedown');
					if (stage.target) {
						cursor = stage.cursor(); // 设定 resize 要用的 cursor
						var t = stage.target;
						if (cursor === 'move') {
							stage.targetStatus = Component.Status.IS_DRAG;
							if(t.type != 'line')			
								oldTriggerData = {x: t.get('x'), y: t.get('y') };
							else 
								oldTriggerData = t.getChanges();
								//oldTriggerData = {points: t.getPoints(true) };
						} else if (cursor.indexOf('resize') !== -1) {
							if(t.type != 'line')
								oldTriggerData = {x: t.get('x'), y: t.get('y'), width: t.get('width'), height: t.get('height') };
							else 
								oldTriggerData = t.getChanges();
							stage.targetStatus = Component.Status.IS_RESIZE;
							stage.resizeTag = cursor;
						} else if (cursor === 'crosshair') {
							stage.targetStatus = Component.Status.IS_LINE;
							// 选中画出的线
							stage.choseTarget(stage.target.addLine(oldX, oldY));
						}
					} else {
						stage.cleanTarget();
					}

					//e.preventDefault();
					//e.stopPropagation();
				}, false);
				bindEvent(view, 'mouseup', function(e) {
					var t = stage.target;
					if(t && moved){
						switch(stage.targetStatus){
							case Component.Status.IS_LINE: 	stage.trigger('add', t.save('_cmd'));
								break;
							case Component.Status.IS_DRAG: 
								if(t.type != 'line') newTriggerData = { x: t.get('x'), y: t.get('y') };
								else  newTriggerData = t.getChanges();
								break;
							case Component.Status.IS_RESIZE: 
								if(t.type != 'line') newTriggerData = { x: t.get('x'), y: t.get('y'), width: t.get('width'), height: t.get('height') };
								else  newTriggerData = t.getChanges();
								//else  newTriggerData = {points: t.getPoints(true)};
								break;
						}
						if(!textDiv && oldTriggerData && newTriggerData && !isObjectSame(oldTriggerData, newTriggerData)){
							stage.trigger('change', t.getUid(), oldTriggerData, newTriggerData);
						}
						if(!textDiv)
							oldTriggerData = null; 
						newTriggerData = null;
						moved = false;

					}
					cursor = '';
					if (stage.target) {
						stage.targetStatus = Component.Status.IS_CHOSED;
					}

					//e.preventDefault();
					//e.stopPropagation();
				}, false);
				bindEvent(view, 'click', function(e) {
					// 清除文本编辑
					if (textDiv) {
						window.getSelection().removeAllRanges();
						stage.trigger('change', uid, oldTriggerData, {text: textDiv.innerHTML} );
						textDiv.blur();
						textDiv.contentEditable = false;
						textDiv = null;

						uid = null;
						oldTriggerData = null;
					}
					stage.cleanMenu();
					stage.choseTarget(stage.getTarget(e));
					//e.preventDefault();
					//e.stopPropagation();
				}, false);
				bindEvent(view, 'contextmenu', function(e) {
					var style = stage.menu.style,
						html, target;
					target = stage.getTarget(e, true);
					stage.choseTarget(target);
					html = contextMenu.make(target);
					stage.menu.innerHTML = html;
					style.top = e.clientY + 'px';
					style.left = e.clientX + 'px';
					style.display = 'block';
					e.preventDefault();
					e.stopPropagation();
				}, false);
				bindEvent(view, 'dblclick', function(e) {
					var target = stage.getTarget(e);
					if (target && (target.isShape() || target.isText())) {
						stage.targetStatus = Component.Status.IS_TEXT;
						textDiv = target.isShape() ? target.textContent : target.content;
						textDiv.contentEditable = true;
						window.getSelection().selectAllChildren(textDiv);
						textDiv.focus();
						oldTriggerData = { text: textDiv.innerHTML };
						uid = target.getUid();
		
					} else if (!target) {
						var t = new Text();
						t.x = loc.x - t.width * 0.5;
						t.y = loc.y - t.height * 0.5;
						stage.add(t);
						textDiv = t.getContent();
						textDiv.contentEditable = true;
						textDiv.focus();
						oldTriggerData = { text: textDiv.innerHTML };
						uid = t.getUid();
					}
					e.preventDefault();
					e.stopPropagation();
				}, false);
			}
		}

	};

	return {
		getInstance: function() {
			if (!instance) instance = new init();
			return instance;
		}
	}

})();


/**
 *  config 要指定 name 属性，或直接指定它的 drawFunc
 */

function Component(config) {
	config = config || {};

	this.uid = config.uid || getUid();
	this.text = undefined; // 文本，放在组件中间
	this.visible = true;
	this.frozen = false; // 是否冻结，即不能编辑
	this.index = -1; // 在stage上的排序，0 表示在最低层
	this.contextStyle = extend({}, C('contextStyle'), extend.OVERRIDE_ADD);

	this.hover = false; // 鼠标是否悬停在此组件上
	this.chosed = false; // 此组件是否选中了
	//this.parent = null; // 父元素， 一般是stage
	this.content = null; // 此组件的DIV 元素
	this.canvas = null;
	this.context = null;
	this.maskContext = null; // 在组件最上面，用于绘制鼠标悬停及点击效果
	extend(true, this, config, 1); //不添加config新属性，只更新this中存在的属性，防止属性泛滥
	this._buildDOM();
}

// 目标组件状态
Component.Status = {
	IS_FRESH: 0,
	IS_CHOSED: 1,
	IS_DRAG: 2,
	IS_RESIZE: 3,
	IS_LINE: 4,
	IS_HOVER: 5,
	IS_TEXT: 6
};


Component.prototype = {
	get: function(key){
		var func = 'get' + upFirst(key);
		if(isFunction(this[func])) return this[func]();
		else if( this.hasOwnProperty(key) ) return this[key];
		else info('not find ' + key );
	},
	set: function(key, val){
		var func = 'set' + upFirst(key);
		if(isFunction(this[func])) return this[func](val);
		else if( this.hasOwnProperty(key) ) return this[key] = val;
		else info('not find ' + key );
	},
	getUid: function(){ return this.uid; },
	isShape: function() {
		return this instanceof Shape
	},
	isLine: function() {
		return this instanceof Line
	},
	isText: function() {
		return this instanceof Text
	},
	getMaskContext: function() {
		return this.maskContext;
	},
	getMaskContent: function() {
		if (this.maskContext) return this.maskContext.canvas;
		return null
	},
	getContent: function() {
		return this.content;
	},
	getContext: function() {
		return this.context;
	},
	getCanvas: function() {
		return this.canvas;
	},
	getStage: function() {
		return Stage.getInstance();
	},
	getMaskStage: function() {
		return this.getStage().maskContainer;
	},
	hide: function() {
		this.visible = false;
		stage.trigger('change', this.uid, {visible: true}, {visible: false} );
		return this;
	},
	show: function() {
		this.visible = true;
		stage.trigger('change', this.uid, {visible: false}, {visible: true} );
		return this;
	},
	isHidden: function() {
		return this.visible === false
	},
	freeze: function() {
		this.frozen = true;
		stage.trigger('change', this.uid, {frozen: false}, {frozen: true} );
		return this;
	},
	unfreeze: function() {
		this.frozen = false;
		stage.trigger('change', this.uid, {frozen: true}, {frozen: false} );
		return this;
	},
	isFrozen: function() {
		return this.frozen;
	},
	isTop: function() {
		return this.index === this.getStage().getChildren().length - 1
	},
	isBottom: function() {
		return this.index === 0
	},
	setHover: function(t) {
		t = t || false;
		if (this.hover !== t) {
			this.hover = t;
			// 如果是选中的，则不用画了
			if (!this.chosed) this.mask();
		}
	},
	setChosed: function(t) {
		t = t || false;
		if (this.chosed !== t) {
			if (t === false) { // 新状态是 false，则也要将原来的 hover 状态也清除了
				this.hover = false;
			}
			this.chosed = t;
			this.mask();
		}
	},
	getStatus: function() {
		if (this.chosed) return Component.Status.IS_CHOSED;
		if (this.hover) return Component.Status.IS_HOVER;
		return Component.Status.IS_FRESH;
	},
	isHover: function() {
		return this.hover;
	},
	isChosed: function() {
		return this.chosed;
	},
	down: function() {
		var stage = this.getStage(),
			beforeNode = prevNode(this.content);
		if (beforeNode) {
			stage.container.insertBefore(this.content, beforeNode);
		}
		stage.changeChildPos(this, 'down');
		return this;
	},
	up: function() {
		var stage = this.getStage(),
			node = nextNode(this.content);
		if (node) {
			stage.container.insertBefore(node, this.content);
		}
		stage.changeChildPos(this, 'up');
		return this;
	},
	upToTop: function() {
		var stage = this.getStage();
		stage.container.appendChild(this.content);
		stage.changeChildPos(this, 'top');
		return this;
	},
	downToBottom: function() {
		var stage = this.getStage();
		stage.container.insertBefore(this.content, stage.container.firstChild);
		stage.changeChildPos(this, 'bottom');
		return this;
	},
	remove: function() {
		this.getStage().clean(this);
		return this;
	},

	_buildDOM: function() {

		this.content = document.createElement('div');
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');

		this.content.id = this.uid;
		this.content.style.position = 'absolute';
		this.canvas.style.position = 'absolute';
		this.canvas.style.top = 0;
		this.canvas.style.left = 0;

		if (!this.isLine()) {
			var mask = make('canvas', 0, 0, 0, 0, 'absolute');
			this.maskContext = mask.getContext('2d');
		}
		//		this.content.appendChild(mask);
		this.content.appendChild(this.canvas);

	},
	/**
	 *	子类继承此方法，表示销毁此对象
	 */
	destory: function() {},
	moveAdd: function(addX, addY) {
		this.x += addX;
		this.y += addY;
		return this;
	},
	//响应键盘方向控制
	getCursor: function() {},
	getEdgePoint: function() {},
	/**
	 * 	TODO 图形图绘制函数，子类要实现，每次调用此函数组件要更新，注意当组件状态是 frozen是请不要重绘
	 */
	draw: function() {},
	mask: function() {
		/* 
		 *	TODO 子类请重写此方法
		 */
		if (this.chosed) {
			// 此组件选中时状态
		} else if (this.hover) {
			// 此组件悬停时状态
		} else {
			// 默认状态
		}
	},
	isPointOnMe: function(x, y) {},
	save: function() {},
	options: function() {},
	setOpt: function(k, val) {
		this.set(k, val);
	},
	change: function(config){
		for(var k in config){
			if(this.hasOwnProperty(k)){
				this.set(k, config[k])
			}
		}
		return this;
	}

};

/**
 *	图形类  Conponent的子类
 *	confing 中至少要有一个 drawFuncName
 */

function Shape(config) {
	// x,y 是相对于 stage 的
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
	this.rotateRadian = 0; // 旋转角度， 此属性还没完全实现，所以先别用
	this.zoom = {
		x: 1,
		y: 1
	}; // 此属性也最好先别用
	this.type = 'rect'; // rect, oval, diamond, icon
	this.drawFuncName = config.drawFuncName; // 方便从保存中恢复
	//以下属性不需要保存
	this.pathFunc = undefined;
	this.drawFunc = undefined;

	var com = nameToComp(this.drawFuncName);
	config = extend({}, config, com, extend.ADD); //将com中的新属性添加进config

	if (!config.drawFunc) throw new Error('Cann\'t find draw function !');

	Component.apply(this, [config]); // 定义在此前面会被 Component 覆盖，后面会覆盖 Component
	var pathFuncName = '_inner_.defaultPathFunc.' + this.type + 'Path';
	this.pathFunc = this.pathFunc || nameToComp(pathFuncName);
	// 设置默认大小
	var size = C('shapeSize.' + this.type);
	if (size) {
		this.width = this.width === 0 ? size.width : this.width;
		this.height = this.height === 0 ? size.height : this.height;
	}
	this._buildTextDom();
	this.content.className = 'shape-content';
	this.lines = {}; // 与其关联的所有 线   // TODO 再实现相关方法
}
Shape.prototype = {
	save: function(_cmd) {
		if(_cmd){
			return { uid: this.uid, type: this.type, index: this.index, x: this.x, y: this.y, drawFuncName: this.drawFuncName }
		}
		return {
			uid: this.uid,
			text: this.textContent.innerHTML,
			visible: this.visible,
			frozen: this.frozen,
			index: this.index,
			contextStyle: this.contextStyle,

			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height,
			rotateRadian: this.rotateRadian,
			zoom: this.zoom,
			type: this.type,
			drawFuncName: this.drawFuncName,
		}
	},
	getCanvasXY: function(x, y) {
		return {
			x: x - this.x + this.offsetX,
			y: y - this.y + this.offsetY
		}
	},
	getWidth: function() {
		return this.width * this.zoom.x
	},
	getHeight: function() {
		return this.height * this.zoom.y
	},
	setWidth: function(w){
		this.zoom.x = w/this.width;
	},
	setHeight: function(h){
		this.zoom.y = h/this.height;
	},
	getRotate: function() {
		return this.rotateRadian;
	},
	rotateTo: function(r) {
		this.rotateRadian = r;
		return this;
	},
	rotate: function(r) {
		this.rotateRadian += r;
		return this;
	},
	hide: function() {
		this.visible = false;
		var c = this.maskContext.canvas,
			t = this.textContent.style;
		c.width = c.width;
		t.display = 'none';
		stage.trigger('change', this.uid, {visible: true}, {visible: false} );
		return this;
	},
	show: function() {
		this.visible = true;
		this.textContent.style.display = 'block';
		stage.trigger('change', this.uid, {visible: false}, {visible: true} );
		return this;
	},
	move: function(x, y, oldX, oldY) {
		x = x - oldX, y = y - oldY;
		this.x += x;
		this.y += y;
		return this;
	},

	/**
	 * 	图形绘制函数，调用了Draw.execute方法
	 */
	draw: function() {

		this._changeStyle(); //此处用了 canvas.width = canvas.width => 清空了画板
		if (!this.visible) return;

		Draw.execute(this.drawFunc, this.context, {
			width: this.width,
			height: this.height,
			offsetX: this.offsetX,
			offsetY: this.offsetY,
			contextStyle: this.contextStyle,
			rotate: this.rotateRadian,
			pathFunc: this.pathFunc,
			zoom: this.zoom
		}, this);
		this.updateLines();
		this.mask();
		if(this.text) this.textContent.innerHTML = this.text; 
		else this.textContent.innerHTML = ''; 
		return this;

	},
	resize: function(cursor, addX, addY, zoom) { // zoom，默认false，表示通过 context的缩放来控制元素的resize
		//zoom = zoom === undefined ? false : zoom;
		zoom = true; // 先打开zoom模式吧，怕有问题
		cursor = cursor.substr(0, 2);
		var x = this.x,
			y = this.y,
			w = this.getWidth(),
			h = this.getHeight();
		if (cursor.indexOf('w') !== -1) {
			w -= addX;
			x += addX;
		}
		if (cursor.indexOf('e') !== -1) {
			w += addX;
		}
		if (cursor.indexOf('n') !== -1) {
			h -= addY;
			y += addY;
		}
		if (cursor.indexOf('s') !== -1) {
			h += addY;
		}

		if (w < 25) {
			w = 25;
			x = this.x;
		}
		if (h < 25) {
			h = 25;
			y = this.y;
		}

		if (zoom) {
			this.zoom.x *= w / this.getWidth();
			this.zoom.y *= h / this.getHeight();
		} else {
			this.width = w;
			this.height = h;
		}
		this.x = x;
		this.y = y;

		// 重绘 mask
		return this;
	},
	mask: function() {
		if (this.chosed) {
			this._changeStyle(true);
			Draw.execute([squareMask, circleMask], this.maskContext, {
				// mask 没有缩放，用实际大小
				width: this.getWidth(),
				height: this.getHeight(),
				offsetX: this.offsetX,
				offsetY: this.offsetY
			});
		} else if (this.hover) {
			this._changeStyle(true);
			Draw.execute([circleMask], this.maskContext, {
				width: this.getWidth(),
				height: this.getHeight(),
				offsetX: this.offsetX,
				offsetY: this.offsetY
			});
		} else {
			var canvas = this.maskContext.canvas;
			canvas.width = canvas.width; // 清空画板
		}
	},
	/**
	 *	点是否在 图形上
	 */
	isPointOnMe: function(x, y) {
		var p = this.getCanvasXY(x, y);
		return this.context.isPointInPath(p.x, p.y);
	},
	isPointOnMymask: function(x, y) {
		var p = this.getCanvasXY(x, y);
		return this.maskContext.isPointInPath(p.x, p.y);
	},
	getCursor: function(x, y) {
		var cursor = 'auto';
		if (this.isPointOnMymask(x, y)) {
			var left, top, right, bottom, str, count = 0,
				range = 5;

			left = x - this.x;
			top = y - this.y;
			right = this.getWidth() - left;
			bottom = this.getHeight() - top;

			if (top < range) {
				++count;
				str = 'n';
			}
			if (bottom < range) {
				++count;
				str = 's';
			}
			if (left < range) {
				++count;
				str += 'w';
			}
			if (right < range) {
				++count;
				str += 'e';
			}

			cursor = count === 0 ? 'move' : count === 2 ? str + '-resize' : 'crosshair';

		} else if (this.isPointOnMe(x, y)) {
			cursor = 'move';
		}
		return cursor;
	},
	/**
	 *	根据靠近组件的点得到其边缘上的点，及此边缘的方位
	 */
	getEdgePoint: function(x, y, _distance) {
		_distance = _distance || 5;
		var p = {
			x: x,
			y: y
		},
			edge = 0,
			width = this.getWidth(),
			height = this.getHeight();
		if (abs(x - this.x) < _distance) p.x = x, edge += 1;
		else if (abs(x - this.x - width * 0.5) < _distance) p.x = this.x + width * 0.5, edge += 2;
		else if (abs(x - this.x - width) < _distance) p.x = this.x + width, edge += 4;

		if (abs(y - this.y) < _distance) p.y = y, edge += 8;
		else if (abs(y - this.y - height * 0.5) < _distance) p.y = this.y + height * 0.5, edge += 16;
		else if (abs(y - this.y - height) < _distance) p.y = this.y + height, edge += 32;
		var str;
		switch (edge) {
		case 10:
			str = 'n';
			break;
		case 20:
			str = 'e';
			break;
		case 34:
			str = 's';
			break;
		case 17:
			str = 'w';
			break;
		default:
			str = undefined;
		}
		return {
			point: p,
			edge: str
		};
	},
	getPointFromEdge: function(edge) {
		var width = this.getWidth(),
			height = this.getHeight();
		switch (edge) {
		case 'n':
			return {
				x: this.x + 0.5 * width,
				y: this.y
			};
			break;
		case 'e':
			return {
				x: this.x + width,
				y: this.y + 0.5 * height
			};
			break;
		case 's':
			return {
				x: this.x + 0.5 * width,
				y: this.y + height
			};
			break;
		case 'w':
			return {
				x: this.x,
				y: this.y + 0.5 * height
			};
			break;
		}
	},
	_buildTextDom: function() {
		var textDiv = document.createElement('div');
		this.textContent = textDiv;
		if (this.text) textDiv.innerHTML = this.text;
		textDiv.className = 'inner-text';
		textDiv.spellcheck = false;
		this.content.appendChild(textDiv);
	},
	_changeStyle: function(mask) {
		var target = mask ? this.maskContext.canvas : this.content;
		var cosR = abs(cos(this.rotateRadian)),
			sinR = abs(sin(this.rotateRadian)),
			realW = this.getWidth(),
			realH = this.getHeight();
		this.contentWidth = 100 + realW * cosR + realH * sinR;
		this.contentHeight = 80 + realH * cosR + realW * sinR;
		this.offsetX = 0.5 * (this.contentWidth - realW);
		this.offsetY = 0.5 * (this.contentHeight - realH);


		make(target, this.x - this.offsetX, this.y - this.offsetY, this.contentWidth, this.contentHeight);

		this.text = this.textContent.innerHTML;
		// change the text style
		var style = this.textContent.style,
			w, h;
		if (this.type == 'rect') {
			w = realW - 20;
			h = realH / 2;
		} else if (this.type == 'oval') {
			w = realW * 6 / 9;
			h = realH * 4 / 9;
		} else if (this.type == 'diamond') {
			w = realW * 0.5 - 4;
			h = realH * 0.5 - 4;
		}
		style.width = w + 'px';
		style.height = h + 'px';

		if (!mask) {
			var canvas = this.context.canvas;
			canvas.width = this.contentWidth;
			canvas.height = this.contentHeight;
		}
	},
	// Stage 的 remove 方法在清除组件前会调用此方法
	destory: function() {
		for (var uid in this.lines) {
			this.detachLine(this.lines[uid]);
		}
	},
	addLine: function(x, y) {
		var ep = this.getEdgePoint(x, y),
			line;
		var p = ep.point,
			e = ep.edge;
		line = new Line();
		this.getStage().add(line); // 添加线上去后，stage会调用一次 line 的 draw 方法
		line.setStartPoint(p.x, p.y, this, e);
		return line;
	},
	getLine: function(uid) {
		return this.lines[uid];
	},
	attachLine: function(l) {
		this.lines[l.uid] = l;
	},
	detachLine: function(l) {
		if (l.startComp === this) {
			l.cleanStartTarget();
		} else if (l.endComp === this) {
			l.cleanEndTarget();
		}
		delete this.lines[l.uid];
		l = null;
		return this;
	},
	updateLines: function(addX, addY) {
		var uid, line, p;

		for (uid in this.lines) {

			line = this.lines[uid];

			if (line.startComp === this && line.endComp === this) {
				p = this.getPointFromEdge(line.startDirection);
				if (p) line.setStartPoint(p.x, p.y).draw('recompute');
				p = this.getPointFromEdge(line.endDirection);
				if (p) line.setEndPoint(p.x, p.y).draw('recompute');
			} else if (line.startComp === this) {

				p = this.getPointFromEdge(line.startDirection);

				if (p) line.setStartPoint(p.x, p.y).draw('recompute');

			} else if (line.endComp === this) {
				p = this.getPointFromEdge(line.endDirection);
				if (p) line.setEndPoint(p.x, p.y).draw('recompute');

			} else {
				this.detachLine(line);
			}
		}
	},
	options: function() {
		var s = this.contextStyle;
		return {
			fillcolor: s.fillStyle,
			strokecolor: s.strokeStyle,
			strokesize: s.lineWidth
		}
	},
	setOpt: function(k, val) {
		var s = this.contextStyle;
		switch (k) {
		case 'fillcolor':
			s['fillStyle'] = val;
			break;
		case 'strokecolor':
			s['strokeStyle'] = val;
			break;
		case 'strokesize':
			s['lineWidth'] = val;
			break;
		}
		this.draw();
	}
};
extend(Shape.prototype, Component.prototype, extend.ADD);

function Text(config) {
	this.x = 0;
	this.y = 0;
	this.width = 100;
	this.height = 30;
	this.fillcolor = '#FFFF00';
	this.textcolor = '#0000FF';
	this.textsize = '16';
	this.type = 'text';

	Component.apply(this, [config]);

	this.text = '';

}
Text.prototype = {
	save: function(_cmd) {
		if(_cmd){
			return { uid: this.uid, index: this.index, x: this.x, y: this.y, type: this.type }
		}
		return {
			uid: this.uid,
			text: this.content.innerHTML,
			visible: this.visible,
			frozen: this.frozen,
			index: this.index,

			x: this.x,
			y: this.y,
			type: this.type,
			width: this.width,
			height: this.height,
			fillcolor: this.fillcolor,
			textcolor: this.textcolor,
			textsize: this.textsize,

		}
	},
	options: function() {
		return {
			fillcolor: this.fillcolor,
			textcolor: this.textcolor,
			textsize: this.textsize
		}
	},
	setOpt: function(k, val) {
		var s = this.contextStyle;
		switch (k) {
		case 'fillcolor':
			this.fillcolor = val;
			break;
		case 'textcolor':
			this.textcolor = val;
			break;
		case 'textsize':
			this.textsize = val;
			break;
		}
		this.draw();
	},
	getHeight: function() {
		return this.height + 20
	},
	// 20 is for the padding
	getWidth: function() {
		return this.width + 20
	},
	_changeStyle: function() {
		this.style.left = this.x + 'px';
		this.style.top = this.y + 'px';
		this.style.width = this.width + 'px';
		this.style.height = this.height + 'px';
		this.style.display = 'block';
		this.style.backgroundColor = this.fillcolor;
		this.style.color = this.textcolor;
		this.style.textsize = this.textsize + 'px';
		this.text = this.content.innerHTML;
	},
	_buildDOM: function() {

		this.content = document.createElement('div');
		if (this.text) this.content.innerHTML = this.text;
		this.content.id = this.uid;
		this.content.className = 'text-content';
		this.content.spellcheck = false;
		this.style = this.content.style;
		this.style.position = 'absolute';
		this.style.display = 'none';
	},
	clean: function() {
		this.style.display = 'none'
	},
	draw: function() {
		this.clean();
		if (this.isHidden()) return;
		this._changeStyle();
		if(this.text) this.content.innerHTML = this.text; 
		else this.content.innerHTML = ''; 
	},
	move: function(x, y, oldX, oldY) {
		this.x += x - oldX;
		this.y += y - oldY;
		return this;
	},
	mask: function() {
		if (this.chosed) {
			//this._changeStyle();
			this.style.border = '2px dotted red';
		} else if (this.hover) {
			//this._changeStyle();
			this.style.border = '1px dotted red';
		} else {
			this.style.border = 'none';
			//this.style.backgroundColor = 'yellow';
		}
	},
	resize: function(cursor, addX, addY) {
		var w = this.width,
			h = this.height,
			x = this.x,
			y = this.y;
		cursor = cursor.substr(0, 2);
		if (cursor.indexOf('w') !== -1) {
			w -= addX;
			x += addX;
		}
		if (cursor.indexOf('e') !== -1) {
			w += addX;
		}
		if (cursor.indexOf('n') !== -1) {
			h -= addY;
			y += addY;
		}
		if (cursor.indexOf('s') !== -1) {
			h += addY;
		}

		if (w < 10) {
			w = 10;
			x = this.x;
		}
		if (h < 10) {
			h = 10;
			y = this.y;
		}
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;

		return this;
	},
	getCursor: function(x, y) {
		if (!this.isPointOnMe(x, y)) return 'auto';
		var left, top, right, bottom, str, count = 0,
			range = 4,
			cursor = 'auto';

		left = x - this.x;
		top = y - this.y;
		right = this.getWidth() - left;
		bottom = this.getHeight() - top;

		if (top < range) {
			++count;
			str = 'n';
		}
		if (bottom < range) {
			++count;
			str = 's';
		}
		if (left < range) {
			++count;
			str += 'w';
		}
		if (right < range) {
			++count;
			str += 'e';
		}

		cursor = count === 0 ? 'move' : str + '-resize';
		return cursor;
	},
	isPointOnMe: function(x, y) {
		var d = 2;
		return x > this.x - d && x < this.x + this.getWidth() + d && y > this.y - d && y < this.y + this.getHeight() + d;
	}
}
extend(Text.prototype, Component.prototype, extend.ADD);


Line.ArrowType = {
	NONE_ARROW: 'none',
	NO_CLOSED_ARROW: 'line',
	// > 形式的 arrow
	EMPTY_ARROW: 'hollow',
	// 空心的 arrow
	FILL_ARROW: 'solid' // 带填充的 arrow
};

/**
 *	线条类 Component的子类
 *  给线条一个起点
 */

function Line(config) {
	this.points = [];

	this.lineKind = 'bend'; // straight, bend  直线，折线
	this.lineType = 'normal'; // normal  dot  dash
	this.startArrow = Line.ArrowType.NONE_ARROW;
	this.endArrow = Line.ArrowType.FILL_ARROW;

	this.startComp = null; // 记录线的起始组件，可以是其它的线条
	this.endComp = null; // 线的结束组件
	this.startDirection = undefined;
	this.endDirection = undefined;

	this.type = 'line';
	this.radius = 8; //点到线的距离在此以内就算点在线上了
	Component.apply(this, [config]); // 定义在此前面会被 Component 覆盖，后面会覆盖 Component
	this.content.className = 'line-content';
}

Line.prototype = {
	change: function(cgs){
		var shape; 
		if (cgs.startCompId) {
			shape =  this.getStage().getChild(cgs.startCompId);
			if(shape){
				shape.attachLine( this );
				this['startComp'] = shape;
			}
		}else{
			if(this.startComp){
				this.startComp.detachLine(this);
				this.cleanStartTarget();
			}
		}
		if (cgs.endCompId) {
			shape =  this.getStage().getChild(cgs.endCompId);
			if(shape){
				shape.attachLine( this );
				this['endComp'] = shape;
			}
		}else{
			if(this.endComp){
				this.endComp.detachLine(this);
				this.cleanEndTarget();
			}
		}
		if(cgs.startDirection) this.startDirection = cgs.startDirection;
		if(cgs.endDirection) this.endDirection = cgs.endDirection;
		this.setPoints(cgs.points);
		return this;
	},
	getChanges: function(){
		return {
			points: this.getPoints(true),
			startCompId: this.startComp ? this.startComp.uid : false,
			endCompId: this.endComp ? this.endComp.uid : false,
			startDirection: this.startDirection,
			endDirection: this.endDirection
		}
	},
	save: function(_cmd) {
		if(_cmd){
			return { 
				uid: this.uid, points: this.getPoints(true), type: this.type, index: this.index,
				startCompId: this.startComp ? this.startComp.uid : false,
				endCompId: this.endComp ? this.endComp.uid : false,
				startDirection: this.startDirection,
				endDirection: this.endDirection
			}
		}
		return {
			uid: this.uid,
			text: this.text,
			visible: this.visible,
			frozen: this.frozen,
			index: this.index,

			points: this.getPoints(true),
			lineKind: this.lineKind,
			lineType: this.lineType,
			startArrow: this.startArrow,
			endArrow: this.endArrow,

			startCompId: this.startComp ? this.startComp.uid : false,
			endCompId: this.endComp ? this.endComp.uid : false,
			startDirection: this.startDirection,
			endDirection: this.endDirection,
			type: this.type,
			radius: this.radius,
		}
	},
	getPoints: function(_copy) {

		var ps = this.points;
		if(_copy === true){
			var i=0, rtn =[], p, l=ps.length;
			while(i<l){
				p = new Point(ps[i]);
				rtn.push(p);
				++i;
			}
			return rtn; 
		}
		return ps;
	},
	setPoints: function(pots, _reference) {
		if(_reference) this.points = pots;
		else{
			this.points = [];
			for(var i=0,l=pots.length; i<l; ++i){
				this.points[i] = new Point(pots[i]);
			}
		}
	},
	setStartArrow: function(type) {
		this.startArrow = type;
		return this;
	},
	setEndArrow: function(type) {
		this.endArrow = type;
		return this;
	},
	setLineType: function(type) {
		this.lineType = type;
		return this;
	},
	getCanvasXY: function(x, y) {
		return {
			x: x - this.contentX,
			y: y - this.contentY
		};
	},
	getStartPoint: function() {
		return this.points[0];
	},
	getEndPoint: function() {
		return this.points[this.points.length - 1];
	},
	cleanStartTarget: function() {
		this.startComp = null;
		this.startDirection = undefined;
	},
	cleanEndTarget: function() {
		this.endComp = null;
		this.endDirection = undefined;
	},
	cleanTarget: function(comp) {
		if (comp === this.endComp) this.cleanEndTarget();
		else if (comp === this.startComp) this.cleanStartTarget();
	},
	/*
	 * 直接设置开始点，不修改开始目标， 供Shape组件更新状态时调用
	 */
	setStartPoint: function(x, y, target, direction) {
		this.points[0] = new Point(x, y);
		if (target && target.attachLine) {
			target.attachLine(this);
			this.startComp = target;
		}
		if (direction) this.startDirection = direction;
		return this;
	},
	/*
	 * 直接修改结束点
	 */
	setEndPoint: function(x, y, target, direction) {
		//先将后面的点删除，只保留第一个
		this.points.splice(1);
		this.points[1] = new Point(x, y);
		if (target && target.attachLine) {
			target.attachLine(this);
			this.endComp = target;
		}
		if (direction) this.endDirection = direction;
		return this;
	},
	getCanvasPoints: function() {
		var p, points = [];
		for (var i = 0, len = this.points.length; i < len; ++i) {
			p = this.points[i];
			points.push(this.getCanvasXY(p.x, p.y));
		}
		return points;
	},
	/*
	 * 拖动起点
	 */
	startTo: function(startX, startY, startComp) {
		var ep, e, p;
		if (startComp) {
			ep = startComp.getEdgePoint(startX, startY);
			if (ep) {
				e = ep.edge;
				p = ep.point;
				startX = p.x;
				startY = p.y;
			}
		}
		var startDirection = e || undefined;
		this.setStartPoint(startX, startY, startComp, startDirection);
		this.draw('recompute');
	},
	/*
	 * 拖动终点
	 */
	endTo: function(endX, endY, endComp) {

		var ep, e, p;
		if (endComp) {
			ep = endComp.getEdgePoint(endX, endY);
			if (ep) {
				e = ep.edge;
				p = ep.point;
				endX = p.x;
				endY = p.y;
			}
		}
		var endDirection = e || undefined;

		this.setEndPoint(endX, endY, endComp, endDirection);

		this.draw('recompute');
	},
	_changeStyle: function() {
		var len, i = 0,
			p = this.points[0],
			minX = p.x,
			minY = p.y,
			maxX = p.x,
			maxY = p.y; // min X,y 是画板的坐标
		for (len = this.points.length, i = 1; i < len; ++i) {
			p = this.points[i];
			minX = minX > p.x ? p.x : minX;
			minY = minY > p.y ? p.y : minY;
			maxX = maxX < p.x ? p.x : maxX;
			maxY = maxY < p.y ? p.y : maxY;
		}

		// 相对于 所有点中的 minX, minY 的偏移，用来计算 舞台坐标 相对于组件坐标的实际位置
		this.offsetX = 60;
		this.offsetY = 45;
		this.contentX = minX - this.offsetX;
		this.contentY = minY - this.offsetY;

		var width = maxX - minX + 2 * this.offsetX,
			height = maxY - minY + 2 * this.offsetY;

		var style = this.content.style,
			canvas = this.context.canvas;
		style.width = width + 'px';
		style.height = height + 'px';
		style.left = this.contentX + 'px';
		style.top = this.contentY + 'px';
		canvas.width = width; //清空了画板
		canvas.height = height;

	},
	clean: function() {
		var c = this.context.canvas;
		c.width = c.width;
	},
	draw: function(type) {
		if (this.points.length < 2) return;
		var p1 = this.getStartPoint(),
			p2 = this.getEndPoint();

		// 起点终点是否在同一点上
		var samePoint = this.endComp && this.endComp === this.startComp && this.endDirection && this.endDirection === this.startDirection;

		/*
		 *	修复一个 BUG
		 *	有时线条的起点和终点重合时，它们的 endComp 和 startComp就会相同，但你继续拖开终点，奇怪的是endComp并不会清除
		 */
		if (samePoint) {
			p1 = new Point(p1);
			if (p1.distance(p2) > 10) {
				this.cleanEndTarget();
				samePoint = false;
			}
		}

		this.clean();
		if (this.visible === false) return this;

		//TODO 根据线的类型画对应的线
		if (this.lineKind === 'bend') {
			if (type == 'recompute' && !samePoint) // hover和chosed就不用重新计算点，只有标明了recompute才重新计算点
			this._computePoints();
		} else {
			this.points.splice(1, this.points.length - 2);
		}
		this._changeStyle(); // 根据当前线上的点重置画板大小及位置
		extend(this.context, this.contextStyle, 2); // 重置context属性，最后一个参数本来应该是1 的，但在火狐下 context 的 hasOwnProperty 总返回 false
		var points = this.getCanvasPoints(),
			// 将所有点坐标转换成当前画板的实际坐标
			ctx = this.context,
			fillStyle = this.contextStyle.strokeStyle;
		if (type == 'hover') {
			ctx.shadowBlur = 2;
			ctx.shadowColor = '#ab0d0d';
		} else if (type == 'chose') {
			ctx.shadowBlur = 4;
			ctx.shadowColor = '#ab0d0d';
		}

		var direction = samePoint ? this.startDirection : undefined;

		drawLine(ctx, points, this.lineType, this.startArrow, this.endArrow, fillStyle, direction);

		/* 在两个端点上画上 path， 方便检测 */
		var pathDraw = true;
		ctx.beginPath();
		ctx.lineWidth = 10;
		ctx.arc(points[0].x, points[0].y, this.radius, 0, 2 * PI, false);
		drawLine(ctx, points, 'normal', Line.ArrowType.NONE_ARROW, Line.ArrowType.NONE_ARROW, pathDraw, direction);
		ctx.arc(points[points.length - 1].x, points[points.length - 1].y, this.radius, 0, 2 * PI, false);
		ctx.closePath();

	},
	destory: function() {
		// 注意清除与它关联的 组件 的引用
		this.startComp = null;
		this.endComp = null;
	},
	mask: function() {
		if (this.chosed) {
			// 此组件选中时状态
			this.draw('chose');

		} else if (this.hover) {
			// 此组件悬停时状态
			this.draw('hover');
		} else {
			// 默认状态
			this.draw();
		}
	},
	moveAdd: function(addX, addY) {
		if (!this.startComp && !this.endComp) {
			var ps = this.getPoints(),
				p;
			for (var l = ps.length; l > 0; l--) {
				p = ps[l - 1];
				p.x += addX;
				p.y += addY;
			}
		}
		return this;
	},
	move: function(x, y, oldX, oldY, comp) {
		if (this.isPointOnStart(oldX, oldY)) {
			if (this.startComp) this.startComp.detachLine(this);
			this.startTo(x, y, comp);
		} else if (this.isPointOnEnd(oldX, oldY)) {
			if (this.endComp) {
				this.endComp.detachLine(this);
			}
			this.endTo(x, y, comp);
		}
		return this;
	},
	resize: function(cursor, addX, addY) {
		var ps = this.getPoints(),
			i = this.resizeIndex;
		if (!i) return this;
		var p = ps[i];

		if (cursor == 'w-resize') {
			//for (var k = i - 1; k != i + 3; k += 2) {
			//	var t = ps[k];
			//	if (!t) continue;
			//	if (p.x > t.x && p.x + addX - 20 < t.x || p.x < t.x && p.x + addX + 20 > t.x) return this;
			//}
			ps[i].x += addX;
			ps[i + 1].x += addX;
		} else if (cursor == 'n-resize') {
			//for (var k = i - 1; k != i + 3; k += 2) {
			//	var t = ps[k];
			//	if (!t) continue;
			//	if (p.y > t.y && p.y + addY - 20 < t.y || p.y < t.y && p.y + addY + 20 > t.y) return this;
			//}
			ps[i].y += addY;
			ps[i + 1].y += addY;

		}
		return this;
	},
	/*
	 * 某点在当前线上的话，得到鼠标的 cursor
	 */
	getPointCursor: function(x, y) {
		if (this.isPointOnMe(x, y)) {
			var ps = this.getPoints(),
				i = 0,
				l = ps.length - 1,
				p = new Point(x, y);
			if (this.startComp) i = 1;
			if (this.endComp) l = l - 1;
			for (; i < l; ++i) {
				if (p.toLineDistance(ps[i], ps[i + 1]) < 15) {
					this.resizeIndex = i;
					if (ps[i].x === ps[i + 1].x) return 'w-resize';
					return 'n-resize';
				}
			}
		}
	},
	getCursor: function(x, y) {
		var cursor = 'auto';
		if (this.isPointOnEnds(x, y)) {
			cursor = 'move';
		} else {
			cursor = this.getPointCursor(x, y) || cursor;
		}
		return cursor;
	},
	isPointOnStart: function(x, y) {
		if (this.isPointOnMe(x, y)) {
			var p1 = this.getStartPoint(),
				p = new Point(x, y);
			return (p.distance(p1) < 20);
		}
		return false;
	},
	isPointOnEnd: function(x, y) {
		if (this.isPointOnMe(x, y)) {
			var p2 = this.getEndPoint(),
				p = new Point(x, y);
			return (p.distance(p2) < 20);
		}
		return false;
	},
	isPointOnEnds: function(x, y) {

		if (this.isPointOnMe(x, y)) {
			var p2 = this.getEndPoint(),
				p1 = this.getStartPoint(),
				p = new Point(x, y);
			return (p.distance(p1) < 20 || p.distance(p2) < 20);
		}
		return false;
	},
	isPointOnMe: function(x, y) {
		var p = this.getCanvasXY(x, y);
		if (this.context.isPointInPath(p.x, p.y)) {
			//log(123)
			return true;
		}
		return false;
	},
	options: function() {
		var s = this.contextStyle;
		return {
			//fillcolor: s.fillStyle,
			strokecolor: s.strokeStyle,
			strokesize: s.lineWidth,
			linetype: this.lineType,
			linekind: this.lineKind,
			startarrow: this.startArrow,
			endarrow: this.endArrow
		}
	},
	setOpt: function(k, val) {
		var s = this.contextStyle, key;
		switch (k) {
		case 'fillcolor':
			//if (val.charAt(0) !== '#') val = '#' + val;
			s['fillStyle'] = val;
			break;
		case 'strokecolor':
			//if (val.charAt(0) !== '#') val = '#' + val;
			s['strokeStyle'] = val;
			break;
		case 'strokesize':
			s['lineWidth'] = parseInt(val);
			break;
		case 'linetype':
			this.lineType = val;
			break;
		case 'linekind':
			this.lineKind = val;
			break;
		case 'startarrow':
			this.startArrow = val;
			break;
		case 'endarrow':
			this.endArrow = val;
			break;
		}
		this.draw('recompute');
	},
	/*
	 * 画折线时，计算两点之间的折点
	 * 这里显得有点傻了，完全可以用对称的思想来做的，就想已经用了的 reverse，还可以根据坐标轴对称来的。。。。
	 */
	_computePoints: function() {
		var p = new Point(),
			mx, my, //mx,my是两点间中点的x,y坐标
			x1, x2, y1, y2, //临时用的
			dis = 20,
			mids, // 所有中间的点
			reverse = false,
			// 最后设置点的时候根据它判断要不要反转
			p1, p2, d1, d2, t1, t2; // 起、终点， 起、终方向， 起、终目标
		p1 = new Point(this.getStartPoint()), p2 = new Point(this.getEndPoint()); // 不要引用上次的点
		d1 = this.startDirection;
		d2 = this.endDirection;
		t1 = this.startComp;
		t2 = this.endComp;
		mx = (p1.x + p2.x) * 0.5;
		my = (p1.y + p2.y) * 0.5;

		if (d2 && !t2) d2 = undefined;
		if (d1 && !t1) d1 = undefined;

		// 起始方向都有, target也就都有了
		if (d1 && d2 && t1 && t2) {

			// 同向
			if (d1 === d2) {
				if (d1 == 'n' || d1 == 's') {
					if (p1.y < p2.y) { // 反转
						p.copy(p1);
						p1.copy(p2);
						p2.copy(p);
						t2 = t1;
						reverse = true;
					}
					var w = t2.getWidth(),
						h = t2.getHeight(),
						x = t2.x,
						y = t2.y;
					if (p1.x > x - dis && p1.x < x + w + dis) {
						x1 = p1.x > p2.x ? x + w + dis : x - dis;
						var d = d1 == 'n' ? dis : 0 - dis;
						mids = [new Point(p1.x, p1.y - d), new Point(x1, p1.y - d), new Point(x1, p2.y - d), new Point(p2.x, p2.y - d)];
					} else {
						y1 = d1 == 'n' ? (min(p2.y, p1.y) - dis) : (max(p2.y, p1.y) + dis);
						mids = [new Point(p1.x, y1), new Point(p2.x, y1)];
					}
					// 'w' and 'e'
				} else {
					if (p2.x < p1.x) { //反转
						p.copy(p1);
						p1.copy(p2);
						p2.copy(p);
						t2 = t1;
						reverse = true;
					}
					var w = t2.getWidth(),
						h = t2.getHeight(),
						x = t2.x,
						y = t2.y;
					if (p1.y > y - dis && p1.y < y + h + dis) {
						y1 = p1.y > p2.y ? y + h + dis : y - dis;
						var d = d1 == 'e' ? dis : 0 - dis
						mids = [new Point(p1.x + d, p1.y), new Point(p1.x + d, y1), new Point(p2.x + d, y1), new Point(p2.x + d, p2.y)];
					} else {
						x1 = d1 == 'e' ? (x1 = max(p1.x, p2.x) + dis) : (min(p1.x, p2.x) - dis);
						mids = [new Point(x1, p1.y), new Point(x1, p2.y)];
					}
				}
				// 南北反向
			} else if ((d1 == 's' || d1 == 'n') && (d2 == 's' || d2 == 'n')) {
				if (d1 == 'n') { // d2一定会等于 s ,  p1,p2反向 
					var temp = d1;
					d1 = d2;
					d2 = temp;
					p.copy(p1);
					p1.copy(p2);
					p2.copy(p);
					temp = t1;
					t1 = t2;
					t2 = temp;
					reverse = true;
				}
				if (p2.x < p1.x) {
					if (p2.y < p1.y + 2 * dis) {
						if (p1.x - p2.x > (t2.getWidth() + t1.getWidth()) * 0.5 + 2 * dis) {
							x1 = (p2.x + p1.x - (t2.getWidth() + t1.getWidth()) * 0.5) * 0.5 + 3 * dis;
							mids = [new Point(p1.x, p1.y + dis), new Point(x1, p1.y + dis), new Point(x1, p2.y - dis), new Point(p2.x, p2.y - dis)];
						} else {
							x1 = p2.x - t2.getWidth() * 0.5 - dis;
							mids = [new Point(p1.x, p1.y + dis), new Point(x1, p1.y + dis), new Point(x1, p2.y - dis), new Point(p2.x, p2.y - dis), ];
						}
					} else {
						mids = [new Point(p1.x, my), new Point(p2.x, my)];
					}
				} else {
					if (p2.y < p1.y + 2 * dis) {
						if (p2.x - p1.x > (t2.getWidth() + t1.getWidth()) * 0.5 + 2 * dis) {
							//x1 = p2.x-t2.getWidth()*0.5-dis;
							x1 = (p2.x + p1.x - (t2.getWidth() + t1.getWidth()) * 0.5) * 0.5 + dis;
							mids = [new Point(p1.x, p1.y + dis), new Point(x1, p1.y + dis), new Point(x1, p2.y - dis), new Point(p2.x, p2.y - dis)];
						} else {
							x1 = p2.x + t2.getWidth() * 0.5 + dis;
							mids = [new Point(p1.x, p1.y + dis), new Point(x1, p1.y + dis), new Point(x1, p2.y - dis), new Point(p2.x, p2.y - dis)];
						}
					} else {
						mids = [new Point(p1.x, my), new Point(p2.x, my)];
					}
				}
				// 东西反向
			} else if ((d1 == 'w' || d1 == 'e') && (d2 == 'w' || d2 == 'e')) {
				if (d1 == 'e') { // d2一定会等于 w ,  p1,p2反向 
					var temp = d1;
					d1 = d2;
					d2 = temp;
					p.copy(p1);
					p1.copy(p2);
					p2.copy(p);
					temp = t1;
					t1 = t2;
					t2 = temp;
					reverse = true;
				}
				var h1 = t1.getHeight(),
					h2 = t2.getHeight(),
					h = (h1 + h2) * 0.5;
				if (p2.x + 2 * dis < p1.x) {
					mids = [new Point(mx, p1.y), new Point(mx, p2.y)];
				} else if (p1.y - p2.y > 2 * dis + h) {
					y1 = p2.y + h2 * 0.5 + (p1.y - p2.y - h) * 0.5;
					mids = [new Point(p1.x - dis, p1.y), new Point(p1.x - dis, y1), new Point(p2.x + dis, y1), new Point(p2.x + dis, p2.y)];
				} else if (p2.y - p1.y > 2 * dis + h) {
					y1 = p2.y - h2 * 0.5 - (p2.y - h - p1.y) * 0.5;
					mids = [new Point(p1.x - dis, p1.y), new Point(p1.x - dis, y1), new Point(p2.x + dis, y1), new Point(p2.x + dis, p2.y)];
				} else {
					y1 = min(p1.y, p2.y) - dis - h2 * 0.5;
					mids = [new Point(p1.x - dis, p1.y), new Point(p1.x - dis, y1), new Point(p2.x + dis, y1), new Point(p2.x + dis, p2.y)];
				}

				// 两者方向垂直
			} else {
				if (d2 == 'n' || d2 == 's') { // d2 在南北方向就将点反转，只考虑 d1 在南北方向的情况
					var temp = d1;
					d1 = d2;
					d2 = temp;
					p.copy(p1);
					p1.copy(p2);
					p2.copy(p);
					temp = t1;
					t1 = t2;
					t2 = temp;
					reverse = true;
				}
				var h1 = t1.getHeight(),
					h2 = t2.getHeight(),
					w1 = t1.getWidth(),
					w2 = t2.getWidth();
				if (d1 == 'n') {
					if (d2 == 'w') {
						if (p1.x + dis < p2.x) {
							if (p1.y - h2 * 0.5 > p2.y) mids = [new Point(p1.x, p2.y)];
							else if (p1.y + h1 + h2 * 0.5 < p2.y) mids = [new Point(p1.x, p1.y - dis), new Point(p1.x - w1 * 0.5 - dis, p1.y - dis), new Point(p1.x - w1 * 0.5 - dis, p2.y)];
							else {
								if (p1.x + 0.5 * w1 + dis < p2.x) {
									x1 = p2.x - 0.5 * (p2.x - p1.x - w1 * 0.5);
									mids = [new Point(p1.x, p1.y - dis), new Point(x1, p1.y - dis), new Point(x1, p2.y)];
								} else {
									mids = [new Point(p1.x, p2.y)];
								}
							}
						} else {
							mids = [new Point(p1.x, p1.y - dis), new Point(p2.x - dis, p1.y - dis), new Point(p2.x - dis, p2.y)];
						}
					} else {
						if (p2.y < p1.y) {
							if (p2.x + dis < p1.x) mids = [new Point(p1.x, p2.y)];
							else {
								if (p1.y - dis - h2 * 0.5 - p2.y > 0) {
									y1 = p1.y - 0.5 * (p1.y - h2 * 0.5 - p2.y);
									mids = [new Point(p1.x, y1), new Point(p2.x + dis, y1), new Point(p2.x + dis, p2.y)];
								} else {
									y1 = p2.y - dis - h2 * 0.5;
									mids = [new Point(p1.x, y1), new Point(p2.x + dis, y1), new Point(p2.x + dis, p2.y)];
								}
							}
						} else if (p2.x + dis + w1 * 0.5 < p1.x) {
							x1 = p2.x + 0.5 * (p1.x - p2.x - w1 * 0.5);
							mids = [new Point(p1.x, p1.y - dis), new Point(x1, p1.y - dis), new Point(x1, p2.y)];
						} else {
							x1 = max(p1.x + dis + w1 * 0.5, p2.x + dis);
							mids = [new Point(p1.x, p1.y - dis), new Point(x1, p1.y - dis), new Point(x1, p2.y)];
						}
					}
				} else if (d1 == 's') {
					if (d2 == 'w') {
						if (p2.x > p1.x && p2.y > p1.y) mids = [new Point(p1.x, p2.y)];
						else if (p2.y - h2 * 0.5 < p1.y) {
							if (p2.x > p1.x + w1 * 0.5) {
								mids = [new Point(p1.x, p1.y + dis), new Point(mx, p1.y + dis), new Point(mx, p2.y)];
							} else {
								x1 = min(p2.x - dis, p1.x - w1 * 0.5 - dis);
								mids = [new Point(p1.x, p1.y + dis), new Point(x1, p1.y + dis), new Point(x1, p2.y)];
							}
						} else {
							mids = [new Point(p1.x, my), new Point(p2.x - dis, my), new Point(p2.x - dis, p2.y)];
						}
					} else {
						if (p2.x < p1.x && p2.y > p1.y) mids = [new Point(p1.x, p2.y)];
						else if (p2.x > p1.x && p2.y > p1.y) {
							mids = [new Point(p1.x, my), new Point(p2.x + dis, my), new Point(p2.x + dis, p2.y)];
						} else if (p2.x + dis + w1 * 0.5 > p1.x) {
							mids = [new Point(p1.x, p1.y + dis), new Point(p2.x + dis, p1.y + dis), new Point(p2.x + dis, p2.y)];
						} else {
							mids = [new Point(p1.x, p1.y + dis), new Point(mx, p1.y + dis), new Point(mx, p2.y)];
						}
					}
				}
			}

			// 只有一个方向
		} else if (d1 || d2) {
			// 有一个方向，最多只能有一个 target，也可能没有target
			if (d1) {
				var temp = d1;
				d1 = d2;
				d2 = temp;
				p.copy(p1);
				p1.copy(p2);
				p2.copy(p);
				temp = t1;
				t1 = t2;
				t2 = temp;
				reverse = true; /* 好了，现在可以确定了，只有d2有方向， d1没有方向， 减少考虑的次数 */
			}

			// 该方向上的点是不是在组件上
			if (t2) {
				var w = t2.getWidth(),
					h = t2.getHeight();
				if (d2 == 'n') {
					// 再来判断 p2 相对 p1 的方向
					if (p1.locate(p2, '3,4,y-,x')) {
						if (p1.x > t2.x - dis && p1.x < t2.x + w + dis) {
							x1 = p1.x > p2.x ? p2.x - w * 0.5 - dis : p2.x + w * 0.5 + dis;
							mids = [new Point(x1, p1.y), new Point(x1, p2.y - dis), new Point(p2.x, p2.y - dis)];
						} else {
							y1 = p2.y - dis;
							mids = [new Point(p1.x, y1), new Point(p2.x, y1)];
						}
					} else {
						if (p1.locate(p2, 'y+')) mids = [];
						else {
							mids = [new Point(p1.x, my), new Point(p2.x, my)];
						}
					}
				} else if (d2 == 'e') {
					if (p1.locate(p2, '1,4,x+,y')) {
						if (p1.y < t2.y + h + dis && p1.y > t2.y - dis) {
							y1 = p2.y > p1.y ? t2.y - dis : t2.y + h + dis;
							mids = [new Point(p1.x, y1), new Point(p2.x + dis, y1), new Point(p2.x + dis, p2.y)];
						} else {
							x1 = p2.x + dis;
							mids = [new Point(x1, p1.y), new Point(x1, p2.y)];
						}
					} else {
						if (p1.locate(p2, 'x-')) mids = [];
						else mids = [new Point(mx, p1.y), new Point(mx, p2.y)];
					}
				} else if (d2 == 's') {
					if (p1.locate(p2, '1,2,y+,x')) {
						if (p1.x > t2.x - dis && p1.x < t2.x + w + dis) {
							x1 = p2.x < p1.x ? t2.x - dis : t2.x + w + dis;
							mids = [new Point(x1, p1.y), new Point(x1, p2.y + dis), new Point(p2.x, p2.y + dis)];
						} else {
							y1 = p2.y + dis;
							mids = [new Point(p1.x, y1), new Point(p2.x, y1)];
						}
					} else {
						if (p1.locate(p2, 'y-')) mids = [];
						else mids = [new Point(p1.x, my), new Point(p2.x, my)];
					}
				} else {
					if (p1.locate(p2, '2,3,x-,y')) {
						if (p1.y > t2.y - dis && p1.y < t2.y + h + dis) {
							y1 = p2.y > p1.y ? t2.y + h + dis : t2.y - dis;
							mids = [new Point(p1.x, y1), new Point(p2.x - dis, y1), new Point(p2.x - dis, p2.y)];
						} else {
							x1 = p2.x - dis;
							mids = [new Point(x1, p1.y), new Point(x1, p2.y)];
						}
					} else {
						if (p1.locate(p2, 'x+')) mids = [];
						else mids = [new Point(mx, p1.y), new Point(mx, p2.y)];
					}
				}
			} else {
				if (d2 == 'n' || d2 == 's') mids = [new Point(p1.x, my), new Point(p2.x, my)];
				else mids = [new Point(mx, p1.y), new Point(mx, p2.y)];
			}

			// 没有方向 
		} else {
			mids = [new Point(mx, p1.y), new Point(mx, p2.y)];
		}


		/* 判断是否要反转结果 */
		mids = mids || [];
		mids.unshift(p1);
		mids.push(p2);
		if (reverse) {
			mids.reverse();
		}
		this.setPoints(mids, 'reference');
	}
};

extend(Line.prototype, Component.prototype, extend.ADD);


/**
 * 顶端菜单
 */
var option = (function() {


 	var options = C('topOptions'), OptManager = {}, builder = $.OptionBuild, stage = Stage.getInstance(),
		$container = $('#options');

	if(!$container) throw new Error('no container for options');

	for(var key in options ){
		var opt = options[key]
		if(key.indexOf('divider') === 0) $container.append(builder.divider());
		else if(key.indexOf('label') === 0) $container.append(builder.label(opt));
		else{
			var $dom = builder[opt.func](opt.items);
			$dom.attr('id', key);
			$container.append($('<div class="option"></div>').append($dom));
			var params = opt.params;
			params = params ? params : {};
			params.key = key;

			if(opt.func == 'colorpicker'){
				var colorValue = null;
				opt.params.show = function(v){
					colorValue = v;
				}
				opt.params.hide = function(v){
					if(colorValue && v !== colorValue ){
						if(stage.target)
							stage.trigger('option', stage.target.getUid(), this.key, colorValue, v);
					}
					colorValue = null;
				}
			}

			opt.params.change = function(n, o){
				if(stage.target){
					if(this.key.indexOf('color') < 0 && o !== n)
						stage.trigger('option', stage.target.getUid(), this.key, o, n);
					stage.target.setOpt(this.key, n);
				}
			}

			var u = $dom[opt.func](opt.params);
			u.disable();
			OptManager[key] = u;
		}
	}


	return {
		enable: function(vals) {

			var key, opt, keys = vals ? Object.keys(vals) : [];
			// 先禁用所有
			for (key in OptManager) {
				opt = OptManager[key];
				if(keys.indexOf(key) > -1){
					opt.enable();
					opt.set(vals[key]);
				}else{
					opt.disable();
				}
			}


		}
	}
})()


/**
 * 	contextmenu 生成的一个封装
 * 	直接调用 contextMenu.make(target);
 * 	target 是鼠标右击到的物件
 */
var contextMenu = (function() {
	var item = '<div class="menuitem {disable}" id="{id}"><div class="menuitem-content"><div class="menuitem-key">{key}</div><span>{label}</span></div></div>',
		seperator = '<div class="menuseparator"></div>',
		menu = C('contextMenu'),
		group = C('contextMenuGroup'),
		targetObj = null,
		curItems;

	function check(item, condition) {
		var i, l, items = item.split(','),
			reverse;
		l = items.length, i = -1;

		while (++i < l) {
			reverse = false;
			item = items[i];
			if (item.charAt(0) == '!') {
				reverse = true;
				item = item.substr(1);
			}
			if (curItems.indexOf(item) > -1) {
				if (menu[item]) {
					if (condition) menu[item]['disable'] = reverse ? false : true;
					else menu[item]['disable'] = reverse ? true : false;
				}
			}
		}
	}
	initEvent();

	function initEvent() {
		var stage = Stage.getInstance();
		if (stage.menu.eventAdded) return;
		bindEvent(stage.menu, 'click', function(e) {
			stage.cleanMenu();
			var target = e.target;

			// 当点到seperator时它的parentNode直接等于this
			while (target != this && target.parentNode !== this) {
				target = target.parentNode;
			}
			var cls = target.getAttribute('class'),
				id;
			if (cls && cls.indexOf('menuitem') > -1) {
				id = target.getAttribute('id');
				if (menu[id]['disable'] !== true) {
					var answer;
					if (menu[id]['confirm']) answer = confirm(menu[id]['confirm']);
					if (answer !== false) {
						if (targetObj && targetObj[id]) {
							targetObj[id]().draw();
						} else {
							if (stage[id]) stage[id](e, 'trigge_clean_all');
						}
					}
				}
			}

			stage.menu.eventAdded = true;
			e.preventDefault();
			e.stopPropagation();
		});
	}
	return {
		make: function(target) {
			targetObj = target;

			var info = Stage.getInstance().getChildrenInfo(),
				result = '';
			if (!target) {
				curItems = group['stage'];
			} else {
				curItems = target.isFrozen() ? group['frozenObj'] : group['component'];
			}

			check('cleanAll', info['children'] === 0);
			check('unfreezeAll', info['frozen'] === 0);
			check('showAll', info['hidden'] === 0);

			if (target) {
				check('freeze,!unfreeze', target.isFrozen());
				//check('unfreeze', !target.isFrozen()); 
				check('hide', target.isHidden());
				check('down,downToBottom', target.isBottom());
				check('up,upToTop', target.isTop());
			}

			curItems = curItems.split(',');
			for (var m, i = 0, l = curItems.length; i < l; ++i) {
				if (curItems[i] == '|') {
					result += seperator;
					continue;
				}
				m = menu[curItems[i]];
				result += item.replace(/{.+?}|\|/g, function(text) {
					if (text == '{disable}') {
						if (m['disable'] === true) return 'disable';
						return '';
					} else if (text == '{key}') {
						return m['key'] || '';
					} else if (text == '{label}') {
						return m['label'];
					} else if (text == '{id}') {
						return curItems[i];
					}
				})
			}
			return result;
		}
	}
})()


Stage.getInstance();

//})(window, document, void 0)
