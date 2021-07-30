/*NOT USED*/

/*jshint esnext: true */
/*jshint asi:true, undef:true*/
/* global module,require,console,app,exports */
'use strict';
let pubSub = require('./redis-pub-sub')();
let serverMode = process.env.NODE_ENV;
let instance;
let pong = class {
	constructor(config){
		if(!instance) {
			this.pingCount =0;
			this.pingChannel = 'ping:'+config.masterServer.masterName;
			this.pongChannel = 'pong:'+config.masterServer.masterName;
			this.timeout=config.timeout||serverMode=='development'?5:30;
			this.config=config;
			this.pong();
			instance=this;
			console.log(this.pingChannel,this.pongChannel);
		}
		return instance;
	}
	pong (){
		pubSub.on(this.pingChannel,(msg)=>{
			console.log(this.pingChannel, ":PING  RECEIVED");
			this.config.masterServer.lastSeen=Date.now();
			this.config.masterServer.online=true;
			this.pingCount++;
			this.config.save(); //fire and forget
			pubSub.publish(this.pongChannel,{id:this.config.id,ts:this.config.masterServer.lastSeen})
		})
	}

	checkOnLineState(){
		let now = Date.now();
		this.interval = setInterval(()=>{
			if (this.config.masterServer.lastSeen<now-((this.timeout*1000)+10000)) {
				this.config.masterServer.online=false;
				this.config.save();
			}
		},this.timeout*1000)
	}

	stopOnLineCheck(){
		clearInterval(this.interval);
	}
}

module.exports=exports  = (config)=>{
	return new pong(config);
}
