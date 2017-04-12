
"use strict";
var sock = new SockJS('http://localhost:'+C('port')+'/websocket', {debug: true, devel: true});

/*  localStorage的封装  */
var Storage = (function(){
	var ID = '___BPMN-',
		GROUP = 'defalut',
		ls = window.localStorage;
	return {
		set : function(key, val, group){
			group = group || GROUP;
			val = val === undefined ? '' : val;
			key = ID + group + '-' + key;
			ls[key] = JSON.stringify(val);
			return this;
		},
		get : function(key, group){
			group = group || GROUP;
			key = ID + group + '-' + key;
			if(ls[key])
				return JSON.parse(ls[key]);
			return null;
		},
		getGroup : function(group){
			group = group || GROUP;
			var prefix = ID + group + '-', rtn = {};
			for(var k in ls){
				if(ls.hasOwnProperty(k) && k.indexOf(prefix) === 0){
					rtn[k.substr(prefix.length)] = JSON.parse(ls[k]);
				}
			}
			return rtn;
		},
		clearGroup : function(group){
			group = group || GROUP;
			var prefix = ID + group + '-';
			for(var k in ls){
				if(ls.hasOwnProperty(k) && k.indexOf(prefix) === 0){
					ls.removeItem(k)
					//delete ls[k];
				}
			}
		},
		clearAll: function(){
			for(var k in ls){
				if(ls.hasOwnProperty(k) && k.indexOf(ID) === 0 )
					ls.removeItem(k);
			}
		},
		clear: function(key, group){
			if(key === undefined){
				for(var k in ls){
					this.clear(k, group);
				}
			}
			group = group || GROUP;
			key = ID + group + '-' + key; 
			if(ls.hasOwnProperty(key) ){
			//	ls[key] = null;
				ls.removeItem(key);
			//	delete ls[key];
			}
		}
	}
})()

function isOnline(){	return sock.readyState === 1 ;	}


function urlQuery(url, key){
	var query = url.split('?').pop();
	query.split('#').pop();
	var item, i, d, ds = query.split('&'), data={};
	i=ds.length;
	while(i--){
		d = ds[i];
		item = d.split('=');
		data[item[0]] = item[1];
	}
	if(key) return data[key];
	return data;
}

var test_data = {
	'___BPMN-DOCUMENT-aqnh87dt': '{"title":"BPMN Design","pages":{"dddddddd":"new page","abcdefgh":"map guide"},"time":1337945842353}',
	'___BPMN-PageData-aqnh87dt-abcdefgh': '{"time":1337946491632,"data":{"dq88j_1":{"uid":"dq88j_1","text":"","visible":true,"frozen":false,"index":0,"contextStyle":{"fillStyle":"#2cf54a","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":24.5,"y":261.5,"width":51,"height":51,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"oval","drawFuncName":"Events.StartEvent"},"dq88j_4":{"uid":"dq88j_4","text":"获取个人<div>偏好信息</div>","visible":true,"frozen":false,"index":1,"contextStyle":{"fillStyle":"#1eebd0","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":122,"y":247,"width":120,"height":80,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"rect","drawFuncName":"Tasks.Task"},"dq88j_5":{"uid":"dq88j_5","text":"查询目的地<div>信息</div>","visible":true,"frozen":false,"index":2,"contextStyle":{"fillStyle":"#1eebd0","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":284,"y":247,"width":120,"height":80,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"rect","drawFuncName":"Tasks.Task"},"dq88j_7":{"uid":"dq88j_7","text":"查询天气<div>信息</div>","visible":true,"frozen":false,"index":3,"contextStyle":{"fillStyle":"#1eebd0","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":572,"y":110,"width":120,"height":80,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"rect","drawFuncName":"Tasks.Task"},"dq88j_8":{"uid":"dq88j_8","text":"查询路况<div>信息</div>","visible":true,"frozen":false,"index":4,"contextStyle":{"fillStyle":"#1eebd0","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":578,"y":204,"width":120,"height":80,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"rect","drawFuncName":"Tasks.Task"},"dq88j_9":{"uid":"dq88j_9","text":"查询停车场<div>信息</div>","visible":true,"frozen":false,"index":5,"contextStyle":{"fillStyle":"#1eebd0","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":580,"y":297,"width":120,"height":80,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"rect","drawFuncName":"Tasks.Task"},"dq88j_10":{"uid":"dq88j_10","text":"查询酒店<div>信息</div>","visible":true,"frozen":false,"index":6,"contextStyle":{"fillStyle":"#1eebd0","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":574,"y":392,"width":120,"height":80,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"rect","drawFuncName":"Tasks.Task"},"dq88j_11":{"uid":"dq88j_11","visible":true,"frozen":false,"index":7,"points":[{"x":75.5,"y":287},{"x":98.75,"y":287},{"x":98.75,"y":287},{"x":122,"y":287}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_1","endCompId":"dq88j_4","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_12":{"uid":"dq88j_12","visible":true,"frozen":false,"index":8,"points":[{"x":242,"y":287},{"x":263,"y":287},{"x":263,"y":287},{"x":284,"y":287}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_4","endCompId":"dq88j_5","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_13":{"uid":"dq88j_13","visible":true,"frozen":false,"index":9,"points":[{"x":404,"y":287},{"x":427.5,"y":287},{"x":427.5,"y":287},{"x":451,"y":287}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_5","endCompId":"dq88j_30","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_15":{"uid":"dq88j_15","visible":true,"frozen":false,"index":10,"points":[{"x":519,"y":287},{"x":548.5,"y":287},{"x":548.5,"y":244},{"x":578,"y":244}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_30","endCompId":"dq88j_8","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_16":{"uid":"dq88j_16","visible":true,"frozen":false,"index":11,"points":[{"x":519,"y":287},{"x":549.5,"y":287},{"x":549.5,"y":337},{"x":580,"y":337}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_30","endCompId":"dq88j_9","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_20":{"uid":"dq88j_20","visible":true,"frozen":false,"index":12,"points":[{"x":698,"y":244},{"x":737,"y":244},{"x":737,"y":290},{"x":776,"y":290}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_8","endCompId":"dq88j_31","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_21":{"uid":"dq88j_21","visible":true,"frozen":false,"index":13,"points":[{"x":700,"y":337},{"x":738,"y":337},{"x":738,"y":290},{"x":776,"y":290}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_9","endCompId":"dq88j_31","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_17":{"uid":"dq88j_17","visible":true,"frozen":false,"index":14,"points":[{"x":519,"y":287},{"x":546.5,"y":287},{"x":546.5,"y":432},{"x":574,"y":432}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_30","endCompId":"dq88j_10","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_14":{"uid":"dq88j_14","visible":true,"frozen":false,"index":15,"points":[{"x":519,"y":287},{"x":545.5,"y":287},{"x":545.5,"y":150},{"x":572,"y":150}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_30","endCompId":"dq88j_7","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_25":{"uid":"dq88j_25","visible":true,"frozen":false,"index":16,"points":[{"x":692,"y":150},{"x":734,"y":150},{"x":734,"y":290},{"x":776,"y":290}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_7","endCompId":"dq88j_31","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_26":{"uid":"dq88j_26","visible":true,"frozen":false,"index":17,"points":[{"x":694,"y":432},{"x":735,"y":432},{"x":735,"y":290},{"x":776,"y":290}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_10","endCompId":"dq88j_31","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_27":{"uid":"dq88j_27","text":"制定<div>出行路线</div>","visible":true,"frozen":false,"index":18,"contextStyle":{"fillStyle":"#1eebd0","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":888,"y":250,"width":120,"height":80,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"rect","drawFuncName":"Tasks.Task"},"dq88j_28":{"uid":"dq88j_28","visible":true,"frozen":false,"index":19,"points":[{"x":844,"y":290},{"x":866,"y":290},{"x":866,"y":290},{"x":888,"y":290}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_31","endCompId":"dq88j_27","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_30":{"uid":"dq88j_30","text":"","visible":true,"frozen":false,"index":20,"contextStyle":{"fillStyle":"#e0ba21","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":451,"y":251,"width":68,"height":72,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"diamond","drawFuncName":"GateWays.InclusiveGataway"},"dq88j_31":{"uid":"dq88j_31","text":"","visible":true,"frozen":false,"index":21,"contextStyle":{"fillStyle":"#e0ba21","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":776,"y":254,"width":68,"height":72,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"diamond","drawFuncName":"GateWays.InclusiveGataway"},"dq88j_32":{"uid":"dq88j_32","text":"","visible":true,"frozen":false,"index":22,"contextStyle":{"fillStyle":"#175ba3","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":520,"y":571,"width":68,"height":72,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"diamond","drawFuncName":"GateWays.ParallerGataway"},"dq88j_33":{"uid":"dq88j_33","visible":true,"frozen":false,"index":23,"points":[{"x":1008,"y":290},{"x":1028,"y":290},{"x":1028,"y":499.5},{"x":500,"y":499.5},{"x":500,"y":607},{"x":520,"y":607}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_27","endCompId":"dq88j_32","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_36":{"uid":"dq88j_36","text":"地图显示<div>出行路线</div>","visible":true,"frozen":false,"index":24,"contextStyle":{"fillStyle":"#1eebd0","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":645,"y":522,"width":120,"height":80,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"rect","drawFuncName":"Tasks.Task"},"dq88j_37":{"uid":"dq88j_37","text":"文本显示<div>出行路线</div>","visible":true,"frozen":false,"index":25,"contextStyle":{"fillStyle":"#1eebd0","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":647,"y":623,"width":120,"height":80,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"rect","drawFuncName":"Tasks.Task"},"dq88j_38":{"uid":"dq88j_38","visible":true,"frozen":false,"index":26,"points":[{"x":588,"y":607},{"x":616.5,"y":607},{"x":616.5,"y":562},{"x":645,"y":562}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_32","endCompId":"dq88j_36","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_39":{"uid":"dq88j_39","visible":true,"frozen":false,"index":27,"points":[{"x":588,"y":607},{"x":617.5,"y":607},{"x":617.5,"y":663},{"x":647,"y":663}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_32","endCompId":"dq88j_37","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_40":{"uid":"dq88j_40","text":"","visible":true,"frozen":false,"index":28,"contextStyle":{"fillStyle":"#175ba3","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":809,"y":573,"width":68,"height":72,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"diamond","drawFuncName":"GateWays.ParallerGataway"},"dq88j_41":{"uid":"dq88j_41","visible":true,"frozen":false,"index":29,"points":[{"x":765,"y":562},{"x":787,"y":562},{"x":787,"y":609},{"x":809,"y":609}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_36","endCompId":"dq88j_40","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_42":{"uid":"dq88j_42","visible":true,"frozen":false,"index":30,"points":[{"x":767,"y":663},{"x":788,"y":663},{"x":788,"y":609},{"x":809,"y":609}],"lineKind":"bend","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_37","endCompId":"dq88j_40","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_43":{"uid":"dq88j_43","text":"提交给<div>用户</div>","visible":true,"frozen":false,"index":31,"contextStyle":{"fillStyle":"#1eebd0","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":914,"y":569,"width":120,"height":80,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"rect","drawFuncName":"Tasks.Task"},"dq88j_44":{"uid":"dq88j_44","visible":true,"frozen":false,"index":32,"points":[{"x":877,"y":609},{"x":914,"y":609}],"lineKind":"straight","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_40","endCompId":"dq88j_43","startDirection":"e","endDirection":"w","type":"line","radius":8},"dq88j_45":{"uid":"dq88j_45","text":"","visible":true,"frozen":false,"index":33,"contextStyle":{"fillStyle":"red","strokeStyle":"#000000","lineWidth":2,"globalAlpha":1},"x":1079.5,"y":583.5,"width":51,"height":51,"rotateRadian":0,"zoom":{"x":1,"y":1},"type":"oval","drawFuncName":"Events.EndEvent"},"dq88j_46":{"uid":"dq88j_46","visible":true,"frozen":false,"index":34,"points":[{"x":1034,"y":609},{"x":1079.5,"y":609}],"lineKind":"straight","lineType":"normal","startArrow":"none","endArrow":"solid","startCompId":"dq88j_43","endCompId":"dq88j_45","startDirection":"e","endDirection":"w","type":"line","radius":8}}}',
	'___BPMN-PageData-aqnh87dt-dddddddd': '{"time":1337946491632}'
};

function Saver(opt){

	this._init = false;
	this.cmd = opt.cmd;
	this.sock = opt.sock;

	this.docsGroup = 'DOCUMENT';  //所有document的Group
	this.defalutDocTitle = 'BPMN Design'; // 默认文档名
	this.defalutPageTitle = 'new page';  // 默认文件名
	this.seperator = '_'; // id  title 分隔符

	this.docId = null; //当前文档ID
	this.docTitle = null; //当前文档保存名

	this.pageDataGroupPrefix = 'PageData-'
	this.pageDataGroup = null;  // this.pageDataGroupPrefix + this.docId

	this.stage = Stage.getInstance();

	this.$doc = $('#document_bar h1');
	this.$pages = $('#page_bar ul');

	this.init();
}
Saver.prototype = {

	getPageName: function(id){
		var $li; 
		if(id) $li = $('li[pageid='+id+']', this.$pages);
		else   $li = $('li.selected', this.$pages);
		if($li){
			return $li.attr('pageid') +this.seperator+$('.body span', $li).html();
		}
		return null;
	},
	getIdAndTitle: function(name){
		var id, ps = name.split(this.seperator);
		id = ps.shift();
		return {
			id: id,
			title: ps.join(this.seperator)
		};
	},
	getTitle: function(id, name){
		if(!id) return false;
		if(name) return name.substr( (id+this.seperator).length );

		//先检查是否是 docid
		if( this.$doc.attr('docid') == id ){
			return this.$doc.html();
		}
		// 再检查是否是 page
		var $li = $('li[pageid='+id+']', this.$pages);
		if($li) return $('.body span', $li).html();

		return false;
	},
	getPages: function(type){
		var $li, $lis = $('li', this.$pages), rtns = [], id, title, pages = {};
		for(var i=0, len=$lis.length; i<len; ++i){
			$li = $($lis[i]);
			id = $li.attr('pageid');
			title = $('.body span', $li).html();
			if(type == 'name'){
				rtns.push( id + this.seperator + title );
			// type == 'id'
			}else if(type == 'id'){
				rtns.push( id );
			}else{
				pages[id] = title;
			}
		}
		return rtns.length === 0 ? pages : rtns;
	},
	getTimeStamp: function(){
		return new Date().getTime();
	},
	addPageDom: function(id, title, selected){
		var str = selected ? 'selected' : '';
		this.$pages.append('<li pageid="'+id+'" class="' + str + '"><div class="body"><span>'+title+'</span></div><div class="l-end"><div></div></div><div class="r-end"><div></div></div></li>');
	},
	/* 首次登录调用 */
	_createDoc: function(){
		if(this._init) return;
		var docid = randomStr(8), pageid = randomStr(8);
		
		this.setDoc(docid);

		this.addPageDom('abcdefgh', this.defalutPageTitle, true);

		this.updatePageNames();
		this.addDataForNewPage(pageid);
	},
	setDoc: function(id, title){
		if(title === undefined ){
			title = this.defalutDocTitle;
		} 
		this.docId = id;
		this.docTitle = title;
		this.$doc.html(title);
		this.$doc.attr('docid', id);

		this.pageDataGroup = this.pageDataGroupPrefix + id;
	},
	init: function(docid){
		if(this._init) return ;
/*
		Storage.clearAll();
		this._createDoc();
*/
		Storage.clearAll();
		for(var key in test_data){
			window.localStorage[key] = test_data[key];
		}


		var docs = Storage.getGroup(this.docsGroup);

		// 本地没有保存任何的文档数据
		if($.isEmptyObject(docs)){
			this._createDoc();
		}else{
			//指定了文档名
			if(docid && docs[docid]){
				//TODO url 加了 文档名参数

			//没有指定文档名就取第一个
			}else{
				docid = Object.keys(docs)[0];
			}

			var doc = Storage.get(docid, this.docsGroup), pages, pageid, pagetitle;

			this.setDoc(docid, doc['title']);

			pages = doc['pages']; 

			for(pageid in pages ){
				pagetitle = pages[pageid];
				this.addPageDom( pageid, pagetitle );
			}

		}


		this._init = true;
	},
	getCurrentStageData: function(){
		var data = this.stage.save();
		if($.isEmptyObject(data)) data = '';
		return data;
	},
	updatePageNames: function(){
		var pages = this.getPages();
		Storage.set(this.docId, {title: this.docTitle, pages: pages, time: this.getTimeStamp() }, this.docsGroup);	// 保存所有文件名 pages {id => title}
	},
	addDataForNewPage: function(pageid){
		//Storage.set(pageid, {time: this.getTimeStamp(), data: {} }, this.pageDataGroup);  //不需要，当前文件名记录在 document中 ，减少IO
	},
	removeDataForDelPage: function(pageid){
		Storage.clear(pageid, this.pageDataGroup);
	},
	updateLocalPageData: function(pageid){
		pageid = pageid || this.stage.getCurrentPageId();
		var data = this.stage.save();
		log('update local ' + pageid , data)
		if(pageid && !$.isEmptyObject(data))
			Storage.set(pageid, {time: this.getTimeStamp(), data: data }, this.pageDataGroup );
	},
	recoverLocalPageData: function(pageid){
		pageid = pageid || this.stage.getCurrentPageId();
		var datas = Storage.get(pageid, this.pageDataGroup);
		if(datas && datas['data'] && !$.isEmptyObject(datas['data'])){
			var notTriggleCmd = true;
			this.stage.recover(datas['data'], notTriggleCmd);
		}
	},
	writeAllToServer: function(){
		// TODO 要先更新最后一个文件
		//this.updateLocalPageData();
		var metadata, pagesdata = {}, pageid, pagetitle, pages = this.getPages();
		metadata = {title: this.docTitle, pages: pages, time: this.getTimeStamp() };
		for(pageid in pages){
			pagesdata[pageid] = Storage.get(pageid, this.pageDataGroup );
		}

		//this.sock.send(JSON.stringify({ id:'alldata', docid: this.docId, metadata: metadata, pagesdata: pagesdata }));
	},
	getAllFromServer: function(docid, metadata, pagesdata){
		
		var samedoc = docid === this.docId,
			selectedid = null,
			curpageid = this.stage.getCurrentPageId(); 

		this.$pages.empty();

		if(!samedoc){
			this.setDoc(docid, metadata['title']);
		}
		//var localpages = this.getPages();
		var data, selected = false, pages = metadata['pages'];
		for(var pageid in pages){
			//if(!localpages[pageid]){
			data = pagesdata[pageid] && pagesdata[pageid]['data'];
			if(data){
				Storage.set(pageid, {time: this.getTimeStamp(), data: data }, this.pageDataGroup );
			}
			if(samedoc ){
				if(pageid == curpageid ){
					selectedid = pageid;
				}
			}else{
				if(!selected) selectedid = pageid;
				selected = true;
			}

			this.addPageDom( pageid, pages[pageid], selectedid === pageid );
		}
		this.stage.cleanAll('not-cmd');
		this.recoverLocalPageData(selectedid);
	},
	isDocEmpty: function(){
		this.updateLocalPageData();
		var pages = this.getPages(), page, pid;
		for(pid in pages){
			page = Storage.get(pid, this.pageDataGroup);
			if(! $.isEmptyObject( page['data']) ){
				return false;
			}
		}
		return true;
	}
}


var stage=Stage.getInstance(),
	cmd = new Command({stage: stage}), 
	saver = new Saver({cmd: cmd, sock: sock });

/*  更换页面后 */
$(document).bind('pagechange', page_change_handler) ;
// 页面添加后
$(document).bind('pageadd', page_add_handler) ;
// 页面删除后
$(document).bind('pagedelete', page_delete_handler) ;
$(document).bind('pagerename', page_rename_handler) ;

/* 组件的变化全在这了 */
stage.bind('change', cmd_change_handler) ;
stage.bind('add', cmd_add_handler) ;
stage.bind('delete', cmd_delete_handler) ;
stage.bind('option',cmd_option_handler) ;


socktalk.init({sock: sock, group: urlQuery(location.href, 'id') });


var $tabs = $('#page_bar ul');
function choose_page(pageid){
	$('li', $tabs).removeClass('selected');
	$('li[pageid='+pageid+']', $tabs).addClass('selected');
}


socktalk.on('pc', function(d){
	console.log('get group cmd: page change' , d);
	page_change_handler(null, d.o, d.n );
});

function page_change_handler(e, oldpageid, newpageid){
	//log('page change : ' + oldpageid + ' => ' + newpageid )
	
	// 非第一次
	if(oldpageid){
		if(e){
			console.log('send cmd pagechange to group ')
			socktalk.sendToGroup('pc', {o:oldpageid, n: newpageid});
		}else{
			$( 'li[pageid='+oldpageid+']',  $tabs ).removeClass('selected');
			$( 'li[pageid='+newpageid+']',  $tabs ).addClass('selected');
		}
		saver.updateLocalPageData(oldpageid);
		stage.cleanAll('not-cmd');
	}
	saver.recoverLocalPageData(newpageid);
}

socktalk.on('pa', function(d){
	console.log('get group cmd: page add' , d);
	page_add_handler(null, d.p, d.n );
});
function page_add_handler(e, pageid, pagename){
	//log('add page : ' + pageid )
	if(e){
		console.log('send cmd pageadd to group ')
		socktalk.sendToGroup('pa', {p: pageid, n: pagename});
	}else{
		UI.add_page(pageid, pagename);
		choose_page(pageid);
	}
	saver.updatePageNames();
	saver.addDataForNewPage(pageid);
}

socktalk.on('pd', function(d){
	console.log('get group cmd: page delete' , d);
	page_delete_handler(null, d );
});
function page_delete_handler(e, pageid){
	if(e){
		console.log('send cmd pagedelete to group ')
		socktalk.sendToGroup('pd', pageid);
	}else{
		var $d = $( 'li[pageid='+pageid+']',  $tabs );
		$d.remove();
		//if(d.hasClass('selected')) $('li', $tabs).first().addClass('selected');
		UI.check(null, true);
		
	}
	saver.removeDataForDelPage(pageid);
	saver.updatePageNames();
	// socket send cmd

	cmd.remove(pageid);
}

socktalk.on('pr', function(d){
	console.log('get group cmd: page rename' , d);
	page_rename_handler(null, d.p, d.o, d.n );
});
function page_rename_handler(e, pageid, oldname, newname){
	log('page ' + pageid +' rename "'+ oldname +'" to "' + newname  + '"')
	if(e){
		console.log('send cmd pagerename to group ')
		socktalk.sendToGroup('pr', {p:pageid,o:oldname,n:newname});
	}else{
		$( 'li[pageid='+pageid+'] .body span',  $tabs ).html(newname);
	}

	saver.updatePageNames();

	// for test
	//saver.updateLocalPageData();
	//saver.writeAllToServer();
	// socket send cmd
}



socktalk.on('cc', function(d){
	console.log('get group cmd: change shape property' , d);
	cmd_change_handler(null, d.u, d.o, d.n );
});
function cmd_change_handler(e, uid, oldattrs, newattrs){
	if(e){
		socktalk.sendToGroup('cc', {u:uid, o:oldattrs, n:newattrs});
		cmd.add('change', uid, oldattrs, newattrs ); //包括 修改文本、显/隐、冻结、位置、大小
		log('change ' + uid)
	}else{
		var data = cmd.assemble(['change', uid, oldattrs, newattrs]);
		cmd.execute(data)
	}
}


socktalk.on('ca', function(d){
	console.log('get group cmd: add shape' , d);
	cmd_add_handler(null, d );
});
function cmd_add_handler(e, addshapes){
	if(e){
		socktalk.sendToGroup('ca', addshapes);
		cmd.add('add', addshapes);
		log('add ' + addshapes['uid'])
	}else{
		var data = cmd.assemble(['add', addshapes]);
		cmd.execute(data)
	}
}


socktalk.on('cd', function(d){
	console.log('get group cmd: delete shape' , d);
	cmd_delete_handler(null, d );
});
function cmd_delete_handler(e, deleteshapes){
	if(e){
		socktalk.sendToGroup('cd', deleteshapes);
		cmd.add('delete', deleteshapes);
		log('delete ' + deleteshapes['uid'])
	}else{
		var data = cmd.assemble(['delete', deleteshapes]);
		cmd.execute(data)
		//cmd.execute({type: 'delete'});
	}
}


socktalk.on('co', function(d){
	console.log('get group cmd: change shape ui option ' , d);
	cmd_option_handler(null, d.u, d.k, d.o, d.n );
});
function cmd_option_handler(e, uid, key, oldvalue, newvalue){
	if(e){
		socktalk.sendToGroup('co', {u:uid,k:key,o:oldvalue,n:newvalue});
		cmd.add('option', uid, key, oldvalue, newvalue);
		log('option ' + uid + ' ' + key)
	}else{
		var data = cmd.assemble(['option', uid, key, oldvalue, newvalue]);
		cmd.execute(data)
		//cmd.execute();
	}
}

socktalk.on('cb', function(){
	cmd.backward();
})
socktalk.on('cf', function(){
	cmd.forward();
})

KeyEvent.bind({
	'ctrl+z': function(){
		socktalk.sendToGroup('cb', '');
		cmd.backward();
	},
	'ctrl+y': function(){
		socktalk.sendToGroup('cf', '');
		cmd.forward();
	}
});



/*
sock.onopen = function() {
	var auth = Storage.get('auth');
	if(auth){	sock.send(JSON.stringify({id:'auth-req', auth: auth }));	}

	var uid = urlQuery(location.href, 'id');
	if(uid){
		sock.send( JSON.stringify( {id:'urlid', urlid: uid } ) );
	}
};
sock.onmessage = function(e) {
	var data = JSON.parse(e.data);
	switch(data.id){
		case 'login':
			loginResult(data);
			break;
		case 'auth-res':
			authResult(data);
			break;
		case 's-all-data':
			log('server send data ' + data.docid, data.metadata, data.pagesdata);
			saver.getAllFromServer(data.docid, data.metadata, data.pagesdata);
			break;
	}
};

sock.onclose = function() {
	saver.updateLocalPageData();
};

*/


/*

var login = false, $signBtn = $('.sign', '#document_bar');
function sign(type){
	if(type == 'in'){	// 登录成功
		login = true;
		$signBtn.html('退出');
		$signBtn.addClass('login');

	}else if(type == 'out'){		// 用户登出
		login = false;
		$signBtn.html('登录');
		$signBtn.removeClass('login');
	}else{
		$signBtn.html('断线');
		$signBtn.addClass('offline');
	}
}
*/
/* 类cookie 登录验证 */
/*
function authResult(data){
	if(data.status == 'success'){
		sign('in');
		alert('欢迎' + data['username']);
		//sock.send(JSON.stringify('id:getdoc'));
		if(saver.isDocEmpty()){
			// get from server
			//sock.send
		}else{
			// merge with server

		}
	}else{

	}
}
*/
/* 登录验证 */
/*
function loginResult(data){
	if(data.status == 'success'){
		Storage.set('auth', data.auth);
		sign('in');
		alert('登录成功');
	}else{
		sign('out');
		alert('登录失败');
	}
}
*/






/*  登录登出事件 */
/*
$('#document_bar .sign-bar').on('click', function(){
	if(isOnline()){
		if(!login){
			$.dialog('login', function(d){
				if(d.status === 1){
					var user = d.value[0], pass = d.value[1];
					sock.send( JSON.stringify({id:'login', user:user, pass: pass}) );
				}
			});
		}else{
			Storage.clear('auth');
			sign('out');
			alert('退出成功');
		}
	}else{
		sign('offline');
	}
})
*/


