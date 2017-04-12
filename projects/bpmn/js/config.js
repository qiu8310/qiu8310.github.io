(function(w){
	
	var CONFIG = {
		// 根据形状不同，组件大小也不同，下面是默认的大小
		shapeSize : {
			rect: {width: 120, height: 80},
			oval: { width: 51, height: 51},
			diamond: {width: 68, height: 72}
		},

		port : 8888,
		
		
		// 默认绘图样式
		contextStyle : {
		    fillStyle : '#FFFFFF',
		    strokeStyle : '#000000',
		    lineWidth : 2,
		    globalAlpha : 1,
		    //shadowBlur : 1,
		    //shadowColor : '#CCEECC'
		},
		
		// 项目中用到的要提前加载的图片
		preLoadImgs: [
			'gears.png', 'hand.png'
		],
			
		
		// 所有鼠标右键点击后能弹出的命令
		contextMenu : {
			freeze: 		{key: 'Ctrl+L',		  	label: '锁定'},
			unfreeze: 		{ label: '解除锁定'},
			unfreezeAll: 		{key: 'Ctrl+Alt+U',	  	label:'解锁所有'},
			hide: 			{key:'Ctrl+H', 		 	label:'隐藏'},
			showAll: 		{key:'Ctrl+Alt+S', 	 	label:'显示所有'},
			cleanAll: 		{key:'Ctrl+Alt+C', 	 	label:'清空画板',	confirm:'真的要清空吗？'},
			remove: 		{key:'Delete', 		 	label:'删除'},
			up: 			{key:'Ctrl+Up',	 	 	label:'上移一层'},
			down: 			{key:'Ctrl+Down', 	 	label:'下移一层'},
			upToTop: 		{key:'Ctrl+Alt+Up',  		label:'移至顶层'},
			downToBottom: 		{key:'Ctrl+Alt+Down', 		label:'移至底层'},
			drawLine:		{  label:'画线'	}		
		},
		
		// 根据当前所选组件的不同而所能使用的命令， '|'表示菜单上的分界线
		contextMenuGroup: {
			stage: 'drawLine,|,unfreezeAll,showAll,cleanAll',	// 鼠标点在画板上
			frozenObj:'unfreeze',								// 鼠标点在冻结的组件
			component:'freeze,hide,remove,|,up,down,upToTop,downToBottom'	// 鼠标点在非冻结组件上
		},

		topOptions : {
			label_1: 'Text',
			textsize: {func: 'spinner', params: {value: 16} },
			textcolor: { func: 'colorpicker',params: {}	},
			divider_1: true,
			label_2: 'Line',
			strokesize: {func: 'spinner', params: {value: 2}	}, 
			strokecolor: {func: 'colorpicker',	params: {} },
			linetype: {	func: 'selectbar', params: { width: '54px' }, items: {
								normal: 'icon-13 icon-13-line-style-solid-lg',
								dash: 'icon-13 icon-13-line-style-dashed-lg',
								dot: 'icon-13 icon-13-line-style-dotted-lg'
							}},
			divider_2: true,
			linekind: {	func: 'radiobutton', params: {}, items: {
								bend: 'icon-13 icon-13-line-shape-straight',
								straight: 'icon-13 icon-13-line-shape-direct'
							}},
			startarrow: { func: 'selectbar', params: {	width: 35,	value: 'none'	}, items: {
								'none': 'icon-13 icon-13-arrow-start-none',
								'solid': 'icon-13 icon-13-arrow-start-solid',
								'hollow': 'icon-13 icon-13-arrow-start-hollow',
								'line': 'icon-13 icon-13-arrow-start-line'
							}},
			endarrow: {	func: 'selectbar', params: { width: 35, value: 'solid'	}, items: {
								'none': 'icon-13 icon-13-arrow-end-none',
								'solid': 'icon-13 icon-13-arrow-end-solid',
								'hollow': 'icon-13 icon-13-arrow-end-hollow',
								'line': 'icon-13 icon-13-arrow-end-line'
							}},
			divider_3: true,
			label_3: 'Fill',
			fillcolor: { func: 'colorpicker', params: {} },
		}

	};
	
	
	function C(name){
		return get(CONFIG, name);
	};

	function get(obj, name){
		name = name.split('.');
		var i=-1,l=name.length, item=obj;
		while(++i<l){
			if(item[name[i]] === undefined) return null
			item = item[name[i]];
		}
		return item;
	}
	
	w.C = C;
})(window)

