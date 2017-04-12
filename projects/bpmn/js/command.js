/**
	ctrl + z
	ctrl + y 
	命令回滚
**/

function Command(c){
	c = c || {};
	this.cmds = c.cmds || {};
	this.historyLength = c.historyLength || 20;
	this.stage = c.stage;
}

Command.prototype = {
	getCmd: function(pageid){
		var key = pageid || this.stage.getCurrentPageId();
		if(!this.cmds[key]){
			 this.cmds[key] = {historys: [], cursor: -1, length: 0, isbacked: false};
		};
		return this.cmds[key]
	},
	remove: function(pageid){
		this.cmds[pageid] = null;
		delete this.cmds[pageid];
	},
	install: function(pageid, data){
		if(!this.cmds[pageid]){
			if(data && data['historys']){
				//var cmd = {historys: [], cursor: -1, length: 0, isbacked: false};
				//this.cmds[pageid] = cmd;
				//TODO
				// 执行到此命令
				
			}else{
				this.cmds[pageid] = {historys: [], cursor: -1, length: 0, isbacked: false};
			}
		}
	},
	assemble: function(args){
		var type, data = {};
		type = args.shift();
		switch(type){
			case 'add': data['addShapes'] = args[0]; break;
			case 'delete': data['deleteShapes'] = args[0]; break;
			case 'change': data = {
					uid: args[0],
					oldAttrs: args[1],
					newAttrs: args[2]
				}
				break;
			case 'option': data = {
					uid: args[0],
					key: args[1],
					oldValue: args[2],
					newValue: args[3]
				}
		}
		data['type'] = type;
		return data;
	},

	add: function(data){
		var C = this.getCmd(), is_from_remote = false;

		if(arguments.length > 1){
			var args = toArray(arguments);
			data = this.assemble(args);
		// 只增加 命令长度， 当前cursor不增加， 用于接收外部命令
		}else{
			if(!data.type) return; 
			is_from_remote = true;
		}

		if(C.cursor < this.historyLength - 1){
			C.historys[++C.cursor] = data;
			C.length = C.historys.length;
		}else{
			C.historys.shift();
			C.historys.push(data);
		}

		if(is_from_remote){
			 C.cursor--;
		}else{
			if(C.isbacked){
				//清除之后命令
				C.length = C.cursor + 1;
				//log(C.length)
				C.isbacked = false;
			}
		}
	},
	forward: function(no_message){
		var C = this.getCmd(), cmd;

		if( C.cursor < C.length - 1  ){
			cmd = C.historys[++C.cursor];
			if(!no_message)
				log('forward', C.cursor, cmd)
		}

		if(cmd){
			switch(cmd.type){
				case 'add':
					//log(cmd['addShapes'])
					this.stage.cmdRecover(cmd['addShapes']);
				break;
				case 'delete':
					this.stage.cmdRemove(cmd['deleteShapes']);
				break;
				case 'change':
					var i, ns, cs = cmd['uid'];
					ns = cmd['newAttrs'];
					//log(cs)
					if(!isArray(cs)){ ns = [ns]; cs = [cs]; }
					i=cs.length;
					while(i--){this.stage.getChild(cs[i]).change(ns[i]).draw();}
				break;
				case 'option':
					this.stage.getChild(cmd['uid']).setOpt(cmd['key'], cmd['newValue'], 'fromCmd');
				break;
			}
		}
	},
	backward: function(){
		var C = this.getCmd();
		if(C.cursor > -1){
			
			var cmd = C.historys[C.cursor--];
			C.isbacked = true;
			log('back', C.cursor+1, cmd)
			switch(cmd.type){
				case 'add':
					this.stage.cmdRemove(cmd['addShapes']);
				break;
				case 'delete':
					this.stage.cmdRecover(cmd['deleteShapes']);
				break;
				case 'change':
					var cs = cmd['uid'], os = cmd['oldAttrs'], i;
					if(!isArray(cs)){ cs = [cs]; os = [os]; }
					i=cs.length;

					while(i--){ 
						//log(this.stage.getChild(cs[i]))
						this.stage.getChild(cs[i]).change(os[i]).draw(); 
					}

				break;
				case 'option':
					this.stage.getChild(cmd['uid']).setOpt(cmd['key'], cmd['oldValue'], 'fromCmd');
				break;
			}
		}
	},
	execute: function(cmd){
		this.add(cmd);
		this.forward(true);
	}
}

