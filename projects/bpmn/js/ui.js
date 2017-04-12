(function($){
	"use strict";
	if($ === undefined){
		throw new Error(' jQuery not load yet! ');
	}

	$.OptionBuild = {
		divider : function(){ return $('<div class="option-bar-divider"><div class="ld"></div><div class="rd"></div></div>'); },
		label : function(name){ return $('<div class="option-bar-label-left">'+name+':</div>'); },
		colorpicker : function(){
			return $('<div class="colorpick" ><div class="color"></div><div class="mask"></div></div>');
		},
		spinner : function(){
			return $('<div class="spinner"></div>');
		},
		radiobutton : function(items){
			var t, rtn = $('<div class="button-bar"></div>');
			for(var key in items){
				t = $('<div class="button-bar-item" option-value="'+key+'"></div>');
				t.append($('<div class="'+items[key]+'"></div>'));
				rtn.append(t);
			}
			return rtn;
		},
		selectbar : function(items){
			var wrap = $('<div class="select"></div>');
			wrap.append($('<div class="select-wrapper"><div class="select-content"></div><div class="select-button"><div class="icon-13 icon-13-select-arrows"></div></div></div>'));
			var b = $('<div class="menu-body" style="height: auto;"></div>');
			for(var key in items){
				var t = $('<div class="menuitem" option-value="'+key+'"></div>');
				t.append('<div class="menuitem-content"><div><div class="'+items[key]+'"></div></div></div>');
				b.append(t);
			}
			wrap.append($('<div class="menu small" style="display: none;" ></div>').append(b));
			return wrap;
		}
	}


	$.fn.colorpicker = function(_opt){
		var rtn = [], 
			opt = {
				width: '24px',
				value: '#000000',
				change: function(){ },
				show: function(){},
				hide: function(){}
			}
		$.extend(opt, _opt);
		if(!opt.color) opt.color = opt.value;
		delete opt.value;

		$.each(this, function(i, item){

			rtn.push((function(){

				var $item = $(item), picker, curVal, $color = $($item.find('.color')[0]),
					$mask = $($item.find('.mask')[0]);
				if(opt.width) $item.css('width', opt.width);
				opt.onChange = function(hsb, hex, rgb){
					var g = get();
					opt.change('#'+hex, g);
					$color.css('backgroundColor', '#'+hex);
				}
				opt.onShow = function(panel){ 
					curVal = get();
					opt.show(curVal);
					$(panel).fadeIn(200); return false; 
				}
				opt.onHide = function(panel){
					opt.hide(curVal);
					$(panel).fadeOut(200); return false; 
				}
				picker = $item.ColorPicker(opt);
				function clickHandler(e){ e.stopPropagation(); }
				function isDisabled(){
					return $item.hasClass('disabled');
				}
				function disable(){
					$mask.bind('click', clickHandler );
					$color.css('backgroundColor', '#CCC');
					$item.addClass('disabled');
				} 
				function enable(){
					$mask.unbind('click', clickHandler);
					$color.css('backgroundColor', curVal);
					$item.removeClass('disabled');
				}
				function set(val){
					if(!isDisabled()){
						$color.css('backgroundColor', val);
						$item.ColorPickerSetColor(val);
						if(curVal !== val){
							opt.change(val, curVal);
						}
						curVal = val;
					}
				}
				function get(){ 
					var m, rtn , c = $color.css('backgroundColor');
					if( m = c.trim().match(/^rgb\(([0-9 ,]*)\)$/i) ){
						var v, i=-1, s = m[1].split(',');
						rtn = '#';
						while(++i<3){
							v = parseInt(s[i].trim(), 10).toString(16);
							if(v.length === 1) v = '0' + v;
							rtn += v;
						}
					}
					return rtn ? rtn : c; 
				}

				set(opt.color);

				return {
					get: get,
					isDisabled: isDisabled,
					disable: function(){disable(); return this; },
					enable: function(){enable(); return this; },
					set: function(v){set(v); return this; },
				};
			})());
		});

		if(rtn.length === 0) return false;
		else if(rtn.length === 1) return rtn[0];
		return rtn;

	}

	/***
		扩展的 input 框，可以输入，也可以通过向上向下按键操作
	***/
	$.fn.spinner = function(_opt){
		var innerHtml = '<div class="spinner-textbox"><input type="text"/></div><div class="spinner-buttons"><div class="spinner-up"><div class="icon-13 icon-13-spinner-arrows"></div></div><div class="spinner-down"><div class="icon-13 icon-13-spinner-arrows"></div></div></div>',
			rtn = [],
			opt = {
				valueSuffix : ' px',
				value : 1,
				minValue: 1,
				maxValue: 100,
				width : '50px',
				change : function(){}
			};
		$.extend(opt, _opt);

		$.each(this, function(i,item){
			rtn.push((function(){
				var $item = $(item);
				$item.addClass('spinner');
				$item.html(innerHtml);
				if(opt.width) $item.css('width', opt.width);

				var input = $item.find('input')[0], tempVal;
				input.value = opt.value + opt.valueSuffix;
				function disable(){	input.disabled = true;	$item.addClass('disabled');	}
				function isDisabled(){ return input.disabled === true || input.disabled == 'disabled'; }
				function enable(){	input.disabled = false;	$item.removeClass('disabled');	}
				function get(){ return input.value ? parseFloat(input.value) : 0; }
				function set(val, _oldVal){  
					_oldVal = _oldVal !== undefined ? _oldVal : get();
					val = parseFloat(val);
					val = val === val ? val : _oldVal; // if val equal NaN , use old value
					val = val < opt.minValue || val > opt.maxValue ? _oldVal : val;
					if(val !== _oldVal){
						opt.change(val, _oldVal ); 
					}
					input.value = val + opt.valueSuffix; 
				}


				$item.delegate('.spinner-up', 'click', function(){	
					if(!isDisabled()){	set(get() + 1 );  } 
				}).delegate('.spinner-down', 'click', function(){  
					if(!isDisabled()) { set(get() - 1 ); }	
				});;

				$(input).on('focus', function(e){
					tempVal = get();
				}).on('change', function(e){
					set(get(), tempVal );
					tempVal = undefined;
				});
				return {
					isDisabled: isDisabled,
					disable: function(){ disable(); return this; },
					enable: function(){ enable(); return this; },
					set: function(val){ set(val); return this; },
					get: get
				}
			})());

		});
		if(rtn.length === 0) return false;
		else if(rtn.length === 1) return rtn[0];
		return rtn;
	}

	/***
		类似于 radio， 但这是由 button 组成的
	****/
	$.fn.radiobutton = function(_opt){
		var rtn = [],
			opt = {
				value: 'bend',
				change: function(){}
			};
		$.extend(opt, _opt);

		$.each(this, function(i, wrap){

			rtn.push((function(){
				var disabled=false, options = {}, curVal,
					$wrap = $(wrap);

				$.each($wrap.children(), function(i, t){
					var $t = $(t), key = $t.attr('option-value');
					if(!key) throw new Error('radio button has no option-value attribute');
					options[key] = $t;
				})
				if(options[opt.value]){
					curVal = opt.value;
					options[curVal].addClass('selected');
				}

				$wrap.delegate('.button-bar-item', 'click', function(e){
					if(!isDisabled()){
						var key = $(this).attr('option-value');
						set(key);
					}
				});
				function isDisabled(){ return disabled === true; }
				function set(val){
					if(options[val]){
						if(curVal !== val){
							opt.change(val, curVal);
						}
						$.each(options, function(i, t){ $(t).removeClass('selected'); } )
						options[val].addClass('selected');
						curVal = val;
					}
				}
				function get(){ return curVal; }
				function disable(){
					disabled = true;
					$.each(options, function(i, t){
						$(t).addClass('disabled');
					}); 
				}
				function enable(){
					disabled = false;
					$.each(options, function(i, t){
						$(t).removeClass('disabled');
					});
				}

				return {
					set: function(v){ set(v); return this; },
					get: get,
					disable: function(){ disable(); return this; },
					isDisabled: isDisabled,
					enable: function(){ enable(); return this; }
				};
			})());
		})

		if(rtn.length === 0) return false;
		else if(rtn.length === 1) return rtn[0];
		return rtn;
	}

	/***
		相当于 select
	****/
	$.fn.selectbar = function(_opt){
		var rtn = [], opt = {
			change: function(){},
			width: '54px'
		};
		$.extend(opt, _opt);
		var $container = $('#menu-container');
		if($container.length === 0){
			$container = $('<div id="menu-container"></div>');
			$(document.body).append($container);
		}

		$.each(this, function(i, item){
			rtn.push((function(){
				var disabled = false, curVal, menuitems={}, $check = $('<div class="icon-13 icon-13-check"></div>');
				var $item = $(item),
					$wrap = $($item.find('.select-wrapper')[0]),
					$selected = $($wrap.find('.select-content')[0]),
					$menu = $($item.find('.menu')[0]);

				if(opt.width) $item.css('width', opt.width);

				$container.append($menu);
				$.each($menu.find('[option-value]'), function(j, it){
					var $item = $(it), key = $item.attr('option-value'),
						$content = $($item.find('.menuitem-content div div')[0]).parent();
					if(key === opt.value || opt.value === undefined && j===0){
						$item.addClass('selected');
						$check.insertBefore($content);
						$selected.html($content.html());
						curVal = key;
					}
					menuitems[key] = {item: $item, content: $content};
				});

				$wrap.on('click', function(e){
					$('#menu-container .menu').css('display', 'none');
					if(!isDisabled()){
						$menu.css('display', 'block');
						var o = $wrap.offset(), h = $wrap.outerHeight();
						$menu.css({left: o.left, top: o.top + h });
						e.stopPropagation();
					}
				})
				$menu.delegate('.menuitem', 'click', function(e){
					$menu.css('display', 'none');
					var key = $(this).attr('option-value');
					set(key);
					e.stopPropagation();
				})
				$(document).bind('click.selectbar', function(){
					$menu.css('display', 'none');
				})
				function disable(){
					$item.addClass('disabled');
					disabled = true;
				}
				function isDisabled(){
					return disabled === true;
				}
				function enable(){
					$item.removeClass('disabled');
					disabled = false;
				}
				function get(){ return curVal; }
				function set(val ){

					if(val !== undefined && menuitems[val] && curVal !== undefined && curVal !== val){
						
						menuitems[curVal]['item'].removeClass('selected');
						menuitems[val]['item'].addClass('selected');

						var content = menuitems[val]['content'];
						$check.insertBefore(content);

						opt.change(val, curVal);

						curVal = val;
						$selected.html(content.html());
					}
				}
				return {
					disable: function(){ disable(); return this; },
					isDisabled: isDisabled,
					enable: function(){ enable(); return this; },
					get: get,
					set: function(v){ set(v); return this; }
				};
			})());
		})

		if(rtn.length === 0) return false;
		else if(rtn.length === 1) return rtn[0];
		return rtn;
	}

	// 水平拖动排序
	$.fn.sortable = function(){
		$.each(this, function(i, item){
			var x, y, $target, left, startX, first = true;;
			$(item).parent().delegate('li', 'mousedown', function(e){
				$target = $(this);
				first = true;
				startX = x;
				e.stopPropagation();
			}).on('mousemove', function(e){
				if($target){
					if(first){
						left = 0;
						$target.prevAll().each(function(prevId, prevLi){
							left += $(prevLi).width();
						});
						$target.css({
							'position': 'absolute',
							'z-index': 1000,
							'top': $target[0].offsetTop,
							'left': left,
							'filter': 'alpha(opacity=60)',
							'opacity': 0.6
						});
						first = false;
					}
					$target.css({
						'left': parseFloat($target.css('left')) + e.clientX - x
					});
				}
				x = e.clientX; y=e.clientY;
				e.stopPropagation();
			}).on('mouseup', function(e){
				if($target){
					if(Math.abs(startX-x) > 5){
						var left = parseFloat($target.css('left'));
						var lis = $target.parent().children();
						var j, len = lis.length, l = 0;
						for(j=0; j<len; ++j){
							if(lis[j] === $target[0]) continue;
							if( left < l  ) break;
							l += $(lis[j]).width();
						}

						if(j===len){
							$target.parent().append($target);
						}else{
							$(lis[j]).before($target);
						}
					}
					$target.attr('style', '');
					$target = null;
				}
				e.stopPropagation();
			});
			
		})
	}


	$.fn.draggable = function(config){
		config = config || {};
		var orig = this;

		$.each(this, function(i, item){

			var $item = $(item);
			var $e = config.handler ? $(config.handler, $item) : null;
			var x, y, $t, left, top, delegate = false;
			function handleDown(e){

				$t = delegate ? $(this).parentsUntil(orig.selector).parent(orig.selector) : $(this);

				$t.css('position', "absolute");
				var o = $t.offset();

				// TODO 不知道为什么，这个地方肯定有问题
				left = o.left + $t.width()/2 - 50;
				top = o.top;
				$t.css({
					left: left,
					top: top
				})
				e.stopPropagation();
			}

			if($e){
				delegate = true;
				$item.delegate(config.handler, 'mousedown.draggable'+i, handleDown);
			}else{
				$item.on('mousedown.draggable'+i, handleDown);
			}
			$(document).on('mousemove.draggable'+i, function(e){
				if($t){
					left = left + e.clientX -x; 
					top = top + e.clientY - y;
					$t.css({
						left: left,
						top : top
					});
				}
				x = e.clientX; y = e.clientY;
				e.stopPropagation();
			})
			$(document).on('mouseup.draggable'+i, function(e){
				if($t){
					$t = null;
				}
				e.stopPropagation();
			})
		});
	}

	var $dia = $('#dialog-container');
	function clearDialog(){
		$dia.css('display', 'none');
		$('.dialog', $dia).css('display', 'none');
		$dia.unbind('getvalue');
	}
	$dia.delegate('.icon-13-close', 'click.dialogclose', function(){
		$dia.trigger('getvalue', 0);
		clearDialog();
	}).delegate('.button', 'click.dialogbutton', function(){
		var v = 0;
		if($(this).hasClass('ok') ) v = 1; 
		else v = 2;
		$dia.trigger('getvalue', v);
		clearDialog();
	})

	$.dialog = function(type, msg, value, callback){
		var $e = $('.dialog.'+type);
		
		if(!callback){ callback = value ? value : msg; value = null; }

		if($e){
			if(msg) $('.dialog-message', $e).html(msg);
			var $input = $('.dialog-input', $e); 
			if(value !== undefined && $input) $input.eq(0).attr('value', value);
			else $input.attr('value', '');
			$e.css({
				display: 'block',
				left: ($(document).width()-$e.width())/2,
				top: ($(document).height()-$e.height())/2
			})

			$dia.css('display', 'block');
			$input.eq(0).focus();
			$input.eq(0).select();

			$dia.bind('getvalue', function(e, data){
				var result = {};
				result.status = data;
				$input.length ? $input.each(function(i, it){
					if(!result.value) result.value = $(it).attr('value');
					else if( !result.value.pop ) result.value = [result.value, $(it).attr('value')]; 
				}) : undefined;

				callback.call(null, result);
			})
		}
		
	}



	/*  右侧控制按键的启用函数 */
	var $controls = $('.controls', '#page_bar');
	var $direc = ($('.icon-button', $controls));

	$direc = $direc.not($direc.first()).not($direc.last());
	function controlEnable(side){
		$direc.addClass('disabled');
		if(side.indexOf('left') !== -1 ){
			$direc.eq(0).removeClass('disabled');
			$direc.eq(1).removeClass('disabled');
		}
		if(side.indexOf('right') !== -1 ){
			$direc.eq(2).removeClass('disabled');
			$direc.eq(3).removeClass('disabled');
		}
	}

	var $tabs = $('#page_bar ul'), $tabsWrap = $tabs.parent();

	function getControl(direc){
		var viewWidth = $tabsWrap.parent().width(), lisWidth = 0, 
			wrapLeft = parseFloat($tabsWrap.css('left')) || 0;

		if(direc){
			switch(direc){
				case '>':
					$tabsWrap.css('left', wrapLeft - 100 );
				break;
				case '>>':
					$tabsWrap.css('left', viewWidth - $tabsWrap.width() - 10 );
				break;
				case '<':
					var left = wrapLeft + 100;
					left = left > 0 ? 0 : left;
					$tabsWrap.css('left', left );
				break;
				case '<<':
					$tabsWrap.css('left', 0 );
				break;
			}
		}
		wrapLeft = parseFloat($tabsWrap.css('left')) || 0;

		var $li, lis = $tabs.children(), i=lis.length;
		while(i--){
			$li = $(lis[i]);
			lisWidth += $li.width();
		}
		$tabsWrap.width(lisWidth + 30);
		var side = '';
		if(wrapLeft < 0){
			side += 'left';
		}
		if(lisWidth > viewWidth - wrapLeft ){
			side += 'right';
		}
		controlEnable(side);
		//log(wrapLeft, viewWidth, lisWidth);

	}
	var curpage = null;
	function check(li, is_cmd){
		var checked = false, checkedLi = null, $close;
		var lis = $tabs.children(), i=0, len = lis.length, $li;
		var lisWidth = 0, beforeWidth, wrapLeft = parseFloat($tabsWrap.css('left')) || 0,
			viewWidth = $tabsWrap.parent().width();
		var page;
		while(i<len){
			$li = $(lis[i]);
			lisWidth += $li.width();
			$close = $('.close', $li);
			if(len > 1){
				if($close.length === 0) $('.body', $li).append($('<div class="close "><div class="icon-13 icon-13-close"></div></div>'));
			}else{
				if($close) $close.remove();
			}
			if(lis[i] === li){
				$li.addClass('selected');
				beforeWidth = lisWidth;
				checked = true;
				page = $li.attr('pageid');
			}else if($li.hasClass('selected')){
				$li.removeClass('selected');
				beforeWidth = lisWidth;
				checkedLi = $li;
			}
			++i;
		}

		if(checked === false){
			if(checkedLi){
				
			}else if(lis[0]){
				// li is undefined , chose the first one
				checkedLi = $(lis[0]);
			}
			if(checkedLi){
				checkedLi.addClass('selected');
				page = checkedLi.attr('pageid');
			}
		}

		if(page !== curpage ){
			//log(curpage, page )
			$(document).trigger('pagechange', [curpage, page] );
			curpage = page;
		}
		

		// 选中的文件在右边没有看到
		if(beforeWidth > viewWidth - wrapLeft - 30) $tabsWrap.css('left', viewWidth - beforeWidth + 30);
		// 选中的文件在左边没有看到
		else if(beforeWidth < 0 ) $tabsWrap.css('left', 0);

		$tabsWrap.width(lisWidth + 30 );
		getControl();
	}


	var UI = {
		check: check, 
		add_page: function(pageid, pagename){
			if(!pageid){
				$.dialog('prompt', '请输入文件名', 'new page', function(res){
					if(res.status === 1){
						var id = randomStr(8);
						var $li = $('<li pageid="'+id+'"><div class="body"><span>'+res.value+'</span><div class="close"><div class="icon-13 icon-13-close"></div></div></div><div class="l-end"><div></div></div><div class="r-end"><div></div></div></li>');
						$tabs.append($li);
						$(document).trigger('pageadd', [id, res.value]);
						check($li[0]);
					}
				});
			}else{
				var $li = $('<li pageid="'+pageid+'"><div class="body"><span>'+pagename+'</span><div class="close"><div class="icon-13 icon-13-close"></div></div></div><div class="l-end"><div></div></div><div class="r-end"><div></div></div></li>');
				$tabs.append($li);
				check($li[0]);
			}
		},
		delete_page: function(e, pageid){

		},
		rename_page: function(e, pageid, oldname, newname){

		}

	}
	window.UI = UI;

	$(document).ready(function(){
		check(); // 防止没有选中任意一项
	});
	$tabs.delegate('li','click', function(e){
		var $title = $('span', this), $li = $(this), oldname = $title.html();
		if($(this).hasClass('selected')){
			$.dialog('prompt', '请输入新文件名', oldname, function(rtn){
				if(rtn.status === 1){
					$title.html(rtn.value);
					$(document).trigger('pagerename', [$li.attr('pageid'), oldname, rtn.value]);
				}
			})
		}else{
			check(this);
		}
		e.preventDefault();
		e.stopPropagation();
	}).delegate('.icon-13-close', 'click', function(e){
		var that = this;
		$.dialog('confirm', '真的要删除吗？', '', function(res){
			if(res.status === 1){
				//var $li = $('li', $tabs).has(that), pageid = $li.attr('pageid');	
				var $li = $(that).parentsUntil('ul').last(),
					pageid = $li.attr('pageid');
				$li.remove();
				$(document).trigger('pagedelete', [pageid]);
				check();
			}

		})
		e.preventDefault();
		e.stopPropagation();
	})

	$tabs.sortable();
	$('.ui-draggable').draggable({handler: '.dialog-header'});

	$controls.delegate('.icon-button', 'click', function(e){
		var $t = $(this), type;
		if(!$t.hasClass('disabled')){
			type = $t.children()[0].className;
			// 添加新文件
			if(type.indexOf('plus') !== -1){
				UI.add_page();

			// 左移
			}else if(type.indexOf('tri-l') !== -1){
				getControl('<');
				
			// 左移至顶
			}else if(type.indexOf('tri-dbl-l') !== -1){
				getControl('<<');

			//右移
			}else if(type.indexOf('tri-r') !== -1){
				getControl('>');
			// 右移至顶
			}else if(type.indexOf('tri-dbl-r') !== -1){
				getControl('>>');

			// 文件列表下拉菜单
			}else if(type.indexOf('tri-d') !== -1){
			/*
				var name, lis = $tabs.children(), l=lis.length, i=0;
				var u, m, b, t;
				u = $('<div class="up-button"><div class="icon-13 icon-13-toggle-up"></div></div>');
				b = $('<div class="down-button"><div class="icon-13 icon-13-toggle-down"></div></div>');
				m = $('<div class="menu-body noScrollBars"></div>');
				while(i<l){
					name = $('.body>span', lis[i]).html();
					t = $('<div class="menuitem"><div class="menuitem-content"><span>'+name+'</span></div></div>');
					if($(lis[i]).hasClass('selected')){
						t.addClass('selected');
						$('span', t).before($('<div class="icon-13 icon-13-check"></div>'));
					}
					m.append(t);
					i++;
				}
				var all = $('<div class="menu dropdown"></div>');
				all.empty();
				all.append(u);
				all.append(m);
				all.append(m);

				var o = $t.offset();
				all.css({
					position: 'absolute',
					left: o.left - all.width() + $t.width(),
					top: o.top + $t.height()
				});
			*/
			}
		}
		e.preventDefault();
		e.stopPropagation();
	})

	

	//$.dialog('confirm', '真的要删除吗?', 'abcd', function(data){})

	//$.dialog('prompt', '真的要删除吗?', 'abcd', function(data){})

	//$.dialog('login', function(d){ log(d) })

})(jQuery)


