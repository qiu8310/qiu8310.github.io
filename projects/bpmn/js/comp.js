
"use strict";


var Draw = {
	NONE:			0,
	FILL:			1,
	STROKE:			2,
	FILL_STROKE:	3,
	/**
	 * 
	 * @param func	可以是某一个函数，也可以是函数数组，一般都是些绘图函数
	 * @param ctx	context对象
	 * @param config	Object对象，包含width,height,offsetX(1),offsetY(1),rotate(0),zoom({x:1,y:1}),contextStyle,pathFunc属性，其中width,height是必须的
	 * @param content	此参数指明在哪个域上调用 func 方法
	 * @returns
	 */
	execute: function(func, ctx, config, content){
	
		if(isNotNumber(config.width) || isNotNumber(config.height)) throw new Error('Can\'t draw context without width or height property');
		var x, y, offsetX, offsetY, rotate, zoom, ctxStyle, width, height;
		
		// 图形相对于画板左上角的偏移
		offsetX = config.offsetX || 1;
		offsetY = config.offsetY || 1;
		rotate = config.rotate || 0;
		zoom = config.zoom || {x:1, y:1};
		width = config.width;
		height = config.height;
		// 图形左上角点，相对于画板中心
		x = 0 - 0.5*width, y = 0 - 0.5*height;
		func = isNotArray(func) ? [func] : func;
		ctxStyle = config.contextStyle || {};
		content = content || null;
		for(var style in ctxStyle){
			ctx[style] = ctxStyle[style];
		}

		// 将 ctx 移动画板中央
		ctx.translate(0.5*width*zoom.x + offsetX, 0.5*height*zoom.y + offsetY);
		var i,l,f,r,path=false;
		if(isFunction(config.pathFunc)){path=true; func = func.concat(config.pathFunc);} // 插入 pathFunc 到 func 中，不能用push哦，func是引用
		
		for(i=0,l=func.length; i<l; ++i){
			f = func[i];
			if(isNotFunction(f)) continue;
			
			ctx.save();
			ctx.scale(zoom.x, zoom.y);
			ctx.rotate(rotate);
			var notPath = ( !path || i!==l-1); 

			if(!notPath) ctx.beginPath();
			r = f.call(content, ctx, x, y, width, height, rotate, zoom); // 返回值指定了是否要 fill 与  stroke，因为在缩放下 stroke 会使的 stroke的线条也缩放，使得不好看
			if(!notPath) ctx.closePath();
			r = r || Draw.STROKE; // 默认是即 只 stroke 不 fill
			
			
			// fillStyle 为 null时不填充
			if(ctxStyle['fillStyle'] !== null){
				if(notPath && r&1) ctx.fill(); // 有pathFunc就绝对不要 fill 和 stroke 
			}

			ctx.scale(1/zoom.x, 1/zoom.y); // 恢复缩放
			if(ctxStyle['strokeStyle'] !== null){
				if(notPath && r&2) ctx.stroke();
			}

			ctx.restore();
		}
		
	}
}




function circleMask(ctx, x, y, width, height){

	var radius = 4;
	ctx.strokeStyle = '#ab0d0d';
	ctx.fillStyle = '#fff';
	ctx.lineWidth = 1;

	ctx.moveTo(x+radius, y+height*0.5);
	ctx.arc(x, y+height*0.5, radius, 0, PI * 2, false);	// 左

	ctx.moveTo(x+width+radius, y+height*0.5);
	ctx.arc(x+width, y+height*0.5, radius, 0, PI * 2, false); // 右

	ctx.moveTo(x+width*0.5+radius, y);
	ctx.arc(x+width*0.5, y, radius, 0, PI * 2, false); // 上

	ctx.moveTo(x+width*0.5+radius, y+height);
	ctx.arc(x+width*0.5, y+height, radius, 0, PI * 2, false); // 下
	
	ctx.fill();
	ctx.stroke();
	return Draw.NONE;

}

function squareMask(ctx, x, y, width, height){

	var	s = 8, r = s*0.5; //正方形边长及它的一半

	// 组件选中时的状态
	
	ctx.lineWidth = 3;
	ctx.strokeStyle = '#ab0d0d';
	ctx.rect(x, y, width, height);
	ctx.stroke();

	ctx.lineWidth = 1;
	// 4个小方形
	ctx.beginPath();
	ctx.rect(x-r, y-r, s, s);	
	ctx.rect(x+width-r, y-r, s, s);
	ctx.rect(x+width-r, y+height-r, s, s);	
	ctx.rect(x-r, y+height-r, s, s);	
	ctx.closePath();
	ctx.strokeStyle = '#ab0d0d';
	ctx.fillStyle = 'white';
	ctx.fill();
	ctx.stroke();
	return Draw.NONE;
};


/*
 * 	组件
 *
 *	组件书写说明： 
 *		1、组件内必须有一个 drawFunc， 它可以是一个函数，也可以是一个函数数组
 *		2、每个drawFunc有五个参数，ctx, x, y, width, height， ctx表示context， x,y表示要绘制图形的左上角坐标， width,height表示要绘制图形的宽高
 *		3、组件内可以加上其它的配置，可以配置的属性可以查看 Component 类，该类所有的属性都可以配置，没有的属性你配置了也不会起作用
 *		4、再说下drawFunc函数参数中的ctx， 它加上了一些默认的属性，同时它的原点也移到了画布的中心，这要注意
 *		5、如果drawFunc中的函数返回false，则表示它不会调用ctx.stroke()，当然你可以手动调用，默认是会调用的，所以每次你可以不写ctx.stroke()
 *		6、在drawFunc的函数中，最好不要用 beginPath()，默认的情况下系统会在第一个函数上调用beginPath、ClosePath，因为第一个函数一般都是最下层的组件，
 *		   同时也是最大的，所以用它来检测点是否在此组件上再好不过了。如果你在其它的函数上调用了beginPath，那么先确认下系统能不能正确检测到此组件，不能
 *		   的话在drawFunc数组的最后专门添加一个带beginPath的函数，当然不要使它fill、stroke
 *
 */
var Library = {
	_inner_: {
		defaultPathFunc: {
			rectPath: function(ctx, x, y, width, height){
				drawRoundRect(ctx, x, y, width, height, 0);
			},
			ovalPath: function(ctx, x, y, width, height){
				drawOval(ctx, x, y, width, height);
			},
			diamondPath: function(ctx, x, y, width, height){
				drawDiamond(ctx, x, y, width, height);
			}
		}
	},
	Events : {
		StartEvent: {
			type: 'oval',
			drawFunc : function(ctx, x, y, width, height){
				ctx.beginPath();
				drawOval(ctx, x, y, width, height);
				ctx.closePath();
				return Draw.FILL_STROKE;
			}
		},
		IntermediateEvent: {
			type: 'oval',
			drawFunc : [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawOval(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					var i = 5;
					drawOval(ctx, x+i, y+i, width-i*2, height-i*2);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
			]
		},
		EndEvent: {
			type: 'oval',
			contextStyle: {
				fillStyle: 'red'
			},
			drawFunc : function(ctx, x, y, width, height){
				ctx.beginPath();
				drawOval(ctx, x, y, width, height);
				ctx.closePath();
				ctx.lineWidth = 4;
				return Draw.FILL_STROKE;
			}
		},
		IntermediateCancelEvent: {
			type: 'oval',
			drawFunc : [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawOval(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					var i = 5;
					drawOval(ctx, x+i, y+i, width-i*2, height-i*2);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					ctx.lineWidth = 4;
					var g = 15, w=width-2*g, h=height-2*g;
					x=x+g; y=y+g;
					ctx.moveTo(x, y);
					ctx.lineTo(x+w, y+h);
					ctx.moveTo(x+w, y);
					ctx.lineTo(x, y+h);
					return Draw.STROKE;
				},
			]
		},
		EndCancelEvent: {
			type: 'oval',
			drawFunc : [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawOval(ctx, x, y, width, height);
					ctx.closePath();
					ctx.lineWidth = 4;
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					ctx.lineWidth = 4;
					var g = 15, w=width-2*g, h=height-2*g;
					x=x+g; y=y+g;
					ctx.moveTo(x, y);
					ctx.lineTo(x+w, y+h);
					ctx.moveTo(x+w, y);
					ctx.lineTo(x, y+h);
					return Draw.STROKE;
				},
			]
		},
	},
	GateWays : {
		ExclusiveDataBasedGateway:{
			type: 'diamond',
			drawFunc: function(ctx, x, y, width, height){
				ctx.beginPath();
				drawDiamond(ctx, x, y, width, height);
				ctx.closePath();
				return Draw.FILL_STROKE;
			}
		},
		DataBasedGateway:{
			type:'diamond',
			drawFunc: [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawDiamond(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					ctx.lineWidth = 4;
					var g = 23, w=width-2*g, h=height-2*g;
					x=x+g; y=y+g;
					ctx.moveTo(x, y);
					ctx.lineTo(x+w, y+h);
					ctx.moveTo(x+w, y);
					ctx.lineTo(x, y+h);
					return Draw.STROKE;
				},
			],
		},
		InclusiveGataway: {
			type: 'diamond',
			drawFunc: [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawDiamond(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					ctx.lineWidth = 4;
					var g = 20, w=width-2*g;
					x=x+g; y=y+g+2;
					drawOval(ctx, x, y, w);
					return Draw.STROKE;
				},
			],
		},
		ParallerGataway: {
			type: 'diamond',
			drawFunc: [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawDiamond(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					ctx.lineWidth = 4;
					var g = 20;
					ctx.moveTo(x+width*0.5, y+g);
					ctx.lineTo(x+width*0.5, y+height-g);
					ctx.moveTo(x+g, y+height*0.5);
					ctx.lineTo(x+width-g, y+height*0.5);
					return Draw.STROKE;
				},
			],
		},

	},
	Tasks : {
		Task : {
			type: 'rect',
			drawFunc : function(ctx, x, y, width, height){
				ctx.beginPath();
				drawRoundRect(ctx, x, y, width, height);
				ctx.closePath();
				return Draw.FILL_STROKE;
			}
		},
		LoopTask : {
			
		},
		MultipleInstanceParallelTask:{
			type: 'rect',
			drawFunc: [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					ctx.lineWidth = 2;
					ctx.lineCap = 'round';
					var len = height / 4, gapW = width / 10, gapH = height / 10,
					startX = x+width*0.5, startY = y+height-gapH;
					ctx.moveTo(startX, startY);
					ctx.lineTo(startX, startY-len);
					ctx.moveTo(startX-gapW, startY);
					ctx.lineTo(startX-gapW, startY-len);
					ctx.moveTo(startX+gapW, startY);
					ctx.lineTo(startX+gapW, startY-len);
					ctx.stroke();
					return Draw.NONE;
				},
			]
		},
		MultipleInstanceSequenceTask:{
			type: 'rect',
			drawFunc: [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					var len = width / 5, gapH = height / 8,
					startX = x+(width-len)*0.5, startY = y+height-gapH*1.6;
					ctx.moveTo(startX, startY);
					ctx.lineTo(startX+len, startY);
					ctx.moveTo(startX, startY+gapH);
					ctx.lineTo(startX+len, startY+gapH);
					ctx.moveTo(startX, startY-gapH);
					ctx.lineTo(startX+len, startY-gapH);
					ctx.lineWidth = 2;
					ctx.lineCap = 'round';
					ctx.stroke();
					return Draw.NONE;
				},
			]
		},
		BusinessRuleTask: {
			type: 'rect',
			drawFunc: [ 
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					var gap=width*0.1, w=width*0.3, h=height*0.3;
					x = x+gap, y=y+gap;
					drawRoundRect(ctx, x, y, w, h, 0);
					ctx.moveTo(x, y+h/3);
					ctx.lineTo(x+w, y+h/3);
					ctx.moveTo(x, y+h*2/3);
					ctx.lineTo(x+w, y+h*2/3);
					ctx.moveTo(x+w/3, y);
					ctx.lineTo(x+w/3,y+h);
					ctx.lineWidth = 1;

					return Draw.STROKE;
				},
				function(ctx, x, y, width, height){
					var gap=width*0.1, w=width*0.3, h=height*0.3;
					x = x+gap, y=y+gap;
					ctx.beginPath();
					drawRoundRect(ctx, x, y, w, h/3, 0);
					ctx.lineWidth = 1;
					ctx.fillStyle = '#CCC';
					return Draw.FILL_STROKE;
				}
			]
		},
		ScriptTask: {
			type: 'rect',
			drawFunc: [ 
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					var r=8,hr=r*0.5, gap=width*0.1, w=width*0.2, sqrt_3 = sqrt(3);
					x = x+gap, y=y+gap;
					ctx.beginPath();
					ctx.arc(x+hr, y+hr*sqrt_3, r, -2*PI/3, -4*PI/3, true);
					ctx.arc(x-hr, y+hr*sqrt_3*3, r, -PI/3, PI/3, false);
					ctx.lineTo(x+w, y+hr*sqrt_3*4);
					ctx.arc(x-hr+w, y+hr*sqrt_3*3, r, PI/3, -PI/3, true);
					ctx.arc(x+w+hr, y+hr*sqrt_3, r, -4*PI/3, -2*PI/3, false);
					ctx.lineTo(x, y);
					ctx.moveTo(x-1,y+hr*sqrt_3);
					ctx.lineTo(x+w-6,y+hr*sqrt_3);
					ctx.moveTo(x+2, y+hr*2*sqrt_3);
					ctx.lineTo(x+w-3, y+hr*2*sqrt_3);
					ctx.moveTo(x+5, y+hr*3*sqrt_3);
					ctx.lineTo(x+w, y+hr*3*sqrt_3);
					ctx.lineWidth = 1;
					return Draw.STROKE;
				}
			]
		},
		ReceiveTask: {
			type: 'rect',
			drawFunc: [ 
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					var r=8, gap=width*0.1, w=width*0.25, h=height*0.25;
					x=x+gap, y=y+gap;
					drawRoundRect(ctx, x, y, w, h, 1);
					ctx.moveTo(x,y);
					ctx.lineTo(x+w*0.5, y+h*0.4);
					ctx.lineTo(x+w, y);
					ctx.lineWidth = 1;
					return Draw.STROKE;
				}
			]
		},
		ReceiveStartTask: {
			type: 'rect',
			drawFunc: [ 
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					var gap=width*0.05, w=width*0.3;
					x=x+gap, y=y+gap;
					ctx.beginPath();
					drawOval(ctx, x, y, w);
					drawRoundRect(ctx, x+gap, y+gap+3, w-2*gap, w-2*gap-6, 1);
					ctx.moveTo(x+gap, y+gap+3);
					ctx.lineTo(x+w*0.5, y+gap+10);
					ctx.lineTo(x+w-gap, y+gap+3);
					ctx.lineWidth = 1;
					return Draw.STROKE;
				}
			]
		},
		SendTask: {
			type: 'rect',
			drawFunc: [ 
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					var gap=width*0.1, w=width*0.3, h=height*0.3;
					x=x+gap, y=y+gap;
					ctx.beginPath();
					drawRoundRect(ctx, x, y, w, h);
					ctx.fillStyle = 'black';
					return Draw.FILL;
				},
				function(ctx, x, y, width, height){
					var gap=width*0.1, w=width*0.3, h=height*0.3;
					x=x+gap, y=y+gap;
					ctx.beginPath();
					ctx.lineCap = 'round';
					ctx.strokeStyle = ctx.fillStyle;
					ctx.lineWidth = 3;
					ctx.moveTo(x,y);
					ctx.lineTo(x+w*0.5, y+h*0.6);
					ctx.lineTo(x+w, y);
					ctx.stroke();
					return Draw.NONE;
				}
			]
		},
		UserTask: {
			type: 'rect',
			drawFunc: [ 
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					var gap=width*0.1, w=width*0.25, h=height*0.3;
					x=x+gap, y=y+gap+10;
					ctx.beginPath();
					ctx.moveTo(x, y+h*3/5);
					ctx.arcTo(x, y+h*3/10, x+w/3, y+h*3/10, w/3);

					ctx.moveTo(x+w/4, y+h);
					ctx.lineTo(x+w/4, y+h-5);
					ctx.moveTo(x+w*3/4, y+h);
					ctx.lineTo(x+w*3/4, y+h-5);

					ctx.moveTo(x+w/3, y+h*3/10+4);
					ctx.lineTo(x+w/3, y+h*3/10-3);

					ctx.moveTo(x, y+h*3/5);
					ctx.lineTo(x, y+h);
					ctx.lineTo(x+w, y+h);
					ctx.lineTo(x+w, y+h*3/5);
					ctx.arcTo(x+w, y+h*3/10, x+w*2/3, y+h*3/10, w/3)
					ctx.moveTo(x+w*2/3, y+h*3/10+4);
					ctx.lineTo(x+w*2/3, y+h*3/10-3);
					var r = w/3;
					ctx.arc(x+w/2, y+h*3/10-3-sqrt(3)*r/2, w/3, PI/6, -4*PI/3, true);
					ctx.lineWidth = 1;
				}, 
				function(ctx, x, y, width, height){
					var gap=width*0.1, w=width*0.25, h=height*0.3;
					x=x+gap, y=y+gap+10;
					ctx.beginPath();
					ctx.moveTo(x+w/2, y+h*3/10-3-sqrt(3)*w/6);
					ctx.arc(x+w/2, y+h*3/10-3-sqrt(3)*w/6, w/3, 0, -PI, true);
					ctx.closePath();
					ctx.fillStyle = 'black';
					return Draw.FILL_STROKE;
				}
			]
		},
		SubProcess: {
			type: 'rect',
			drawFunc: [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					var w=width*0.3, h=height*0.3;
					x = x+(width-w)*0.5;
					y = y+height - h;
					drawRoundRect(ctx, x, y, w, h, 0);
					ctx.moveTo(x+8, y+h*0.5)
					ctx.lineTo(x+w-8, y+h*0.5);
					ctx.moveTo(x+w*0.5, y+2);
					ctx.lineTo(x+w*0.5, y+h-4);
				}
			],
		},
		ServiceTask: {
			type: 'rect',
			drawFunc: [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					var img = new Image();
					img.src = 'image/gears.png';
					ctx.drawImage(img, x+6, y+6);
				}
			],
			iconFunc: [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawOval(ctx, x+6, y+6, 20);
					drawOval(ctx, x+26, y+26, 10);
					ctx.closePath();
					ctx.fillStyle = 'gray';
					return Draw.FILL_STROKE;
				}
			],
		},
		ManualTask: {
			type: 'rect',
			drawFunc: [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					var img = new Image();
					img.src = 'image/hand.png';
					ctx.drawImage(img, x+6, y+6);
				}
			],
			iconFunc: [
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x, y, width, height);
					ctx.closePath();
					return Draw.FILL_STROKE;
				},
				function(ctx, x, y, width, height){
					ctx.beginPath();
					drawRoundRect(ctx, x+12, y+12, 40,20);
					ctx.closePath();
					ctx.fillStyle = '#E3C787';
					return Draw.FILL;
				}
			],
		}
	},
	
};



function nameToComp(name){
	if(!name) return undefined;
	var com, names = name.split('.'), i=0, len=names.length;
	try{
		com = Library[names[i]];
		while(++i<len){
			com = com[names[i]];
		}
	}catch(e){}
	if(!com) throw new Error('Can\'t find drawFunc ' + name );
	return com;
}


