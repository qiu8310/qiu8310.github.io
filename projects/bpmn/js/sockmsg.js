(function(){

"use strict";

var root = this,
	DEBUG = true;


var sockmsg = (function(){

	var	SOCK_READY_STATE = {
			CONNECTING: 	0,
			OPEN: 			1,
			CLOSING: 		2,
			CLOSED: 		3
		},
		MSG_TYPE = {
			NEED_SEND_ON_OPEN: 	1,
			BUFFERED : 			2,
			SENT: 				3,
			HANDLED: 			4
		},

		GROUP_KEY = '__groupid__',

		TRANSPRANT_TYPE = {
			NORMAL_MSG: 	0,
			GROUP_MSG: 	  	1
		};


	// method 
	var encode, decode, toString, isFunction, isArray, isObject, each, indexOf,
		sockSendWrap, sockReceiveUnwrap,
		sock_funcs = {
			sock_open_funcs   : [],  // {func, context}
			sock_close_funcs  : [],
			sock_error_funcs  : [],
			sock_message_funcs : [],

			conn_on_data : [],
			conn_on_close: []
		};

	encode = function(msg){
		var d;
		try{
			d = JSON.stringify(msg);
		}catch(e){	console.log('JSON stringify failed for msg ' + msg);	}
		return d; // if failed, d === undefined
	}
	decode = function(msg){
		var d; 
		try{
			d = JSON.parse(msg);
		}catch(e){ console.log('JSON parse failed for msg ' + msg ); }
		return d;
	}
	toString 	= function(o   ){ return Object.prototype.toString.call(o);     }
	isFunction  = function(func){ return toString(func) == '[object Function]';	}
	isArray     = function(arr ){ return toString(arr)  == '[object Array]';    }
	isObject	= function(obj ){ return toString(obj)  == '[object Object]';   }
	each        = function(arr, func, context ){	for(var i=0,l=arr.length; i<l; ++i ){	func.call(context, arr[i], i );	}	}
	indexOf		= function(arr, ele){
		if(arr['indexOf'] && isFunction(arr['indexOf']) ) return arr.indexOf(ele);
		for(var i=0, l=arr.length; i<l; ++i){
			if(ele === arr[i]) return i;
		}
		return -1;
	}


	function UniqueObjsArray(){
		this.objs_array = []; //  {modified_id:'', obj: obj}
		this.obj_index = {};  //  modified_id => index
		this.id_count = {};	 //   id => count
	}
	UniqueObjsArray.prototype = (function(){
		var id_count_seperate = '_';

		return {
			add: function(id, obj, is_modify_id){

				if( obj === undefined ) return false;  // no need for add a empty id
				var m_id, count, index = this.objs_array.length;
				is_modify_id = id == GROUP_KEY ? false : (is_modify_id === false ? false : true) ;
				if(is_modify_id){
					count = this.id_count[id];
					count = count ? count+1 : 1;

					this.id_count[id] = count;
					m_id = id + id_count_seperate + count;
				}else{
					m_id = id;
				}
				
				this.objs_array.push({modified_id: m_id, obj: obj, is_modify_id: is_modify_id});
				this.obj_index[m_id] = index;

				return m_id;
			},
			/**
			 * better not use this function
			 */
			remove: function(modified_id){
				var ids;
				if(isArray(modified_id))  ids = modified_id;
				else ids = [modified_id];

				if(ids.length === this.objs_array.length ){
					 this.empty(); 
					 return;
				}

				for(var i=0,l=ids.length; i<l; ++i){
					modified_id = ids[i];
					this.objs_array.splice(this.obj_index[modified_id], 1);
					delete this.obj_index[modified_id];
				}

				// can't modefied this.id_count, id_count only can be cleared by process function
				for(var i=0,l=this.objs_array.length; i<l; ++i){
					this.obj_index[this.objs_array[i]['modified_id']] = i;
				}
			},
			get: function(modified_id){


				var obj = this.objs_array[this.obj_index[modified_id]];
			//if(modified_id == 'bug_1') console.log(this.objs_array)
				if(obj !== undefined)
					return obj['obj'];
				return obj;
			},
			has: function(){
				return this.objs_array[this.obj_index[modified_id]] !== undefined;
			},
			getId: function(modified_id){
				if(!modified_id) return;
				if(modified_id === GROUP_KEY ) return modified_id;
				var index = this.obj_index['modified_id'];
				if( index && this.objs_array[index] && this.objs_array[index]['is_modify_id'] === false) return modified_id;

				var count, id, parts = modified_id.split(id_count_seperate);
				//count = parts.pop();
				parts.pop();
				id = parts.join(id_count_seperate);
				return id;
			},
			process: function(func, context){
				if( !isFunction(func) ) return ;
				context = context || this;
				var result = [], t;
				for(var obj,i=0,l=this.objs_array.length; i<l; ++i ){
					obj = this.objs_array[i];
					t = func.call(context, obj['modified_id'], obj['obj']);
					if(t !== undefined )
						result.push( t );
				}
				return result;
			},
			empty: function(){
				this.objs_array.length = 0;
				this.obj_index = {};
				this.id_count = {};
			}
		}
	})();

	/*	 
		//simple test for UniqueObjsArray 
		var a = new UniqueObjsArray();
		a.add('test', 'message');
		a.add('test', 'message');
		a.add('test', 'message');
		a.add('qiu', 'message');
		a.add('qiu', 'message');
		a.remove('test_2');
		a.remove('test_1');
		console.log(a.objs_array, a.id_count)
		a.process(function(m_id, obj){
			console.log(m_id, obj)
		});
		console.log(a.objs_array, a.id_count)
	*/

	/*  for server sock msg  */
	function SockGroup(){
		this.groups = {};
		this.masters = {}; // group create sock
	}
	SockGroup.prototype = {
		add: function(groupid, sock){
			if(this.groups[groupid]){
				this.groups[groupid].push(sock);
				console.log('add ' + sock.id + ' to group ' + groupid);
			}else{
				this.groups[groupid] = [sock];
				this.masters[groupid] = sock;
				console.log('new group ' + groupid + ', the group owner is ' + sock.id )
			}
			sock.groupid = groupid;
		},
		get: function(groupid){
			return this.groups[groupid];
		},
		has: function(groupid){
			return this.groups[groupid] !== undefined;
		},
		getMaster: function(sock){
			return this.masters[sock.groupid];
		},
		isMaster: function(sock){
			return this.masters[sock.groupid] !== undefined;
		},
		remove: function(sock){
			var groupid = sock.groupid,
				group = this.groups[groupid];
			if(isArray(group)){
				console.log('remove sock ' + sock.id + ' from group ' + groupid)
				group.splice( indexOf(group, sock), 1);
				if(this.isMaster(sock) && group[0]){
					// if master was delete, then should pick up another master
					this.masters[groupid] = group[0]['id'];
					console.log('groupo owner was left, pick ' + group[0]['id'] + ' as owener')
				}
				sock = null;
				
				if(group.length === 0){
					delete this.groups[groupid];
					delete this.masters[groupid];
					console.log( 'remove group ' + groupid)
				}
			}
		}
	}

	var msg_queue = {},
		static_handler = {},
		is_server_sock = false,
		sock_group = new SockGroup(),
		sock = {};	// websocket
	
	sockSendWrap = function(id, data, sock, transprant_type){

		transprant_type = transprant_type || TRANSPRANT_TYPE.NORMAL_MSG;
		if(data === undefined){
			// msgs group
			var msg_group = id;
			data = encode( [msg_group] ) ;
		}else{
			data = encode( [id,data,transprant_type] ); // notice: if data is undefined, then `d` property will not send
		}

		if(is_server_sock) sock.conn.write(data);
		else sock.send(data);
	}
	sockReceiveUnwrap = function(datas){
		datas = decode(datas);
		if(datas.length === 1 ){
			// msgs group
			return datas[0];
		}
		return {
			id: datas[0],
			data: datas[1],
			type: datas[2]
		}
	}


	function SockMsg(){	}
	SockMsg.prototype = {
		/**
		 *	cfg.sock
		 *  cfg.groupid  => group connection
		 */
		init: function(cfg){
			var temp_sock = cfg['sock'];

			if( !(temp_sock && (temp_sock['send'] || temp_sock['write']) ) ) throw new Error(' sockmsg need websocket to initialize ');

			is_server_sock = temp_sock['write'] !== undefined && (typeof exports !== 'undefined');

			if( is_server_sock ){
				//each(['close', 'data'])
				var sock_id = temp_sock.id, servermsg ;
				if(sock_id === undefined ) throw new Error( 'wrong server socket' )
				servermsg = new ServerSockMsg();
				servermsg.id = sock_id;
				msg_queue[sock_id] = new UniqueObjsArray();
				static_handler[sock_id] = {};
				
				servermsg.conn = temp_sock;
				sock[sock_id] = servermsg;

				temp_sock.on('data', function(d){
					servermsg.on(GROUP_KEY, function(groupid){
						sock_group.add(groupid, servermsg);
					});
					servermsg.receive(d);
				})

				temp_sock.on('close', function(){
					if(servermsg['groupid'] !== undefined ){
						sock_group.remove(servermsg);
					}
					delete sock[sock_id];
					delete static_handler[sock_id];
					delete msg_queue[sock_id];
				})

				return servermsg;
			}else{
				msg_queue = new UniqueObjsArray();
				static_handler = {};
				sock = temp_sock;

				each(['open','message','close','error'], function(it,i){
					var func = 'on' + it,
						sock_funcs_id = 'sock_' + it + '_funcs' ;

					// save sock func [ sock.open, sock.message, .... ] to local
					if( isFunction(sock[func]) ){
						sock_funcs[sock_funcs_id].push( {func: sock[func], context: sock} );
					}

					// re-define sock func [ sock.open, sock.message, .... ] 
					sock[func] = function(e){
						for( var i=0, l=sock_funcs[sock_funcs_id]['length']; i<l; ++i){
							var f = sock_funcs[sock_funcs_id][i];
							f['func'].call(f['context'], e);
						}
					}

					var install_func = 'on' + 'sock' + it;
					// this.onsockopen, onsockclose, onsockmessage, onsockerror
					this[install_func] = function(f, c){
						if(isFunction(f)){
							sock_funcs[sock_funcs_id].push( {func: f, context: c} );
						}else if(isArray(f)){
							for(var i=0,l=f.length; i<l; ++i ) this[install_func](f[i], c);
						}
					}

				}, this);


				var groupid = cfg['group'];

				// add default 
				this.onsockopen(function(e){
					if(groupid){
						this.send(GROUP_KEY, groupid);
					}
					// send no send msgs in intime msgs
					this.sendMsgGroup( MSG_TYPE.NEED_SEND_ON_OPEN );
				}, this );

				this.onsockerror(function(e){

				}, this );

				this.onsockclose(function(e){

				}, this );

				this.onsockmessage(function(e){
					this.receive(e.data);
				}, this );
			}
		},
		getSock: function(){
			if(!is_server_sock) return sock;
			return sock[this.id];
		},
		getGroupMaster: function(){
			if(!this.groupid) return;
			return sock_group.getMaster(this);
		},
		getMsgQueue: function(){
			if(!is_server_sock) return msg_queue;
			return msg_queue[this.id];
		},
		getStaticHandler: function(){
			if(!is_server_sock) return static_handler;
			return static_handler[this.id];
		},
		addListener: function(id, handler){
			this.getStaticHandler()[id] = handler;
		},
		removeListener: function(id){
			delete this.getStaticHandler()[id]
		},
		on: function(id, handler){
			this.addListener(id, handler);
			return this;
		},
		emptyMsgs: function(msg_type){
			if(msg_type === undefined ){
				this.getMsgQueue().empty();
			}else{
				var uids = []; 
				this.getMsgQueue().process(function(u_id, data){
					if( msg_type === data['msg_type'] ){
						uids.push(u_id);
					}
				})
				this.getMsgQueue().remove(uids);
			}
		},
		getReadyState: function(){
			return is_server_sock ? this.getSock().conn.readyState : this.getSock().readyState;
		},
		closeSock: function(){ 
			var c = is_server_sock ? this.getSock().conn : this.getSock();
			c.close(); 
		},
		canSend: function(){	
			return this.getReadyState() <= SOCK_READY_STATE.OPEN;	
		},
		send: function(msg_id, data, callback, context, transprant_type){

			var args_len = arguments.length;

			if(args_len === 0 || (args_len === 1 && isFunction(msg_id)) ){
				// execute send buffer data;
				this.sendBuffer(msg_id);
			}

			if( args_len < 2 || ! this.canSend()  ) return; 

			if(isFunction(data)){
				context = callback;
				callback = data;
				data = undefined;
			}

			var is_modify_id = isFunction(callback) ? true : false ;

			var u_id;
			if(this.getReadyState() < SOCK_READY_STATE.OPEN){ // can't send data, save it to queue with data

				u_id = this.getMsgQueue().add( msg_id, { callback:callback, data: data, msg_type: MSG_TYPE.NEED_SEND_ON_OPEN, context: context, type: transprant_type }, is_modify_id);

			}else if(this.getReadyState() === SOCK_READY_STATE.OPEN){ // can direct send data, but need save callback function for callback in receive message

				u_id = this.getMsgQueue().add( msg_id, { callback:callback, msg_type: MSG_TYPE.SENT, context: context, type: transprant_type }, is_modify_id);

				sockSendWrap(u_id, data, this.getSock(), transprant_type);
			}
		},
		sendToGroup: function(msg_id, data, callback, context){

			if(is_server_sock){

				if(this.groupid === undefined) return ;

				var sock, socks = sock_group.get(this.groupid);
				for(var i=0,l=socks.length; i<l; ++i ){
					sock = socks[i];
					if(sock !== this){
						sock.send(msg_id, data, callback, context, TRANSPRANT_TYPE.GROUP_MSG);
					}
				}
			}else{

				this.send(msg_id, data, callback, context, TRANSPRANT_TYPE.GROUP_MSG);
			}
		},
		sendMsgGroup: function(msg_type, user_process_func){
			if( msg_type === MSG_TYPE.SENT) return ;
			if( this.getReadyState() === SOCK_READY_STATE.CONNECTING ) throw new Error('not connected to server yet')
			var msgs = [];
			this.getMsgQueue().process(function(u_id, msg){
				if(msg['msg_type'] === msg_type){
					msg['msg_type'] = MSG_TYPE.SENT;
					msgs.push({id: u_id, data: msg['data'], type:msg['type'] });
				}
			}, this);
			if(msgs.length > 0){
				if(isFunction(user_process_func))
					user_process_func.call(null, msgs);
				sockSendWrap(msgs, undefined, this.getSock());
			}
		},
		sendBuffer: function(user_process_func){
			this.sendMsgGroup(MSG_TYPE.BUFFERED, user_process_func);
		},
		sendToBuffer: function(msg_id, data, callback, context, transprant_type){
			var args_len = arguments.length;
			if(args_len < 2 ) return; 
			if(isFunction(data)){
				context = callback;
				callback = data;
				data = undefined;
			}
			var is_modify_id = isFunction(callback) ? true : false;
			var u_id = this.getMsgQueue().add(msg_id, {callback: callback, data: data, msg_type: MSG_TYPE.BUFFERED, context: context, type: transprant_type}, is_modify_id);
		},

		receive: function(datas){

			datas = sockReceiveUnwrap(datas);

			if(!isArray(datas)) datas = [datas];

			// msg group
			var receive_msg, receive_id, receive_type, receive_data, local_msg, need_removed_ids = [], func, id, is_group_info;
			for(var i=0,l=datas.length; i<l; ++i){
				receive_msg  = datas[i];
				receive_id   = receive_msg['id'];
				receive_data = receive_msg['data'];
				receive_type = receive_msg['type'] || TRANSPRANT_TYPE.NORMAL_MSG ;

				is_group_info = receive_type === TRANSPRANT_TYPE.GROUP_MSG;
				if(is_server_sock && is_group_info){
					this.sendToGroup(receive_id, receive_data);
				}else{
					local_msg = this.getMsgQueue().get(receive_id);

					if(local_msg && isFunction( local_msg['callback'] ) ) local_msg['callback'].call(local_msg['context'], receive_data );

					id = is_group_info ? receive_id : this.getMsgQueue().getId(receive_id);
					func = this.getStaticHandler()[id];

					if(func && isFunction(func)){
						var write_back_msg = func.call(this.getStaticHandler()['context'], receive_data);
						if(write_back_msg !== undefined && !is_group_info ){
							this.send(receive_id, write_back_msg);
						}
					}

					if(receive_id !== GROUP_KEY && !is_group_info)
						need_removed_ids.push( receive_id );
				}
			}

			this.getMsgQueue().remove(need_removed_ids);
		},
		debug: function(){
			if(DEBUG)
				console.log( {msg_queue:this.getMsgQueue(), static_handler: this.getStaticHandler(), sock: this.getSock()} );
		}
	}


	function ServerSockMsg(){}
	ServerSockMsg.prototype = {	
	}
	function extend(a, b, except_list){
		except_list = except_list || [];
		for(var key in b){
			if(b.hasOwnProperty(key) && indexOf(except_list, key) === -1 ){
				a[key] = b[key];
			}
		}
	}

	extend(ServerSockMsg.prototype, SockMsg.prototype , ['init']);

	return new SockMsg();


})()





if (typeof exports !== 'undefined') {
	if (typeof module !== 'undefined' && module.exports) {
	  exports = module.exports = sockmsg;
	}
	exports.sockmsg = sockmsg;
} else {
	root['socktalk'] = sockmsg;
}


}).call(this);