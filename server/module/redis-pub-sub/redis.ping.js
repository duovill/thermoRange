/*NOT USED*/

/*jshint esnext: true */
/*jshint asi:true, undef:true, unused:true*/
/* global module,require,console,app,exports,setInterval,clearInterval */
'use strict';
let pubSub = require('./redis-pub-sub')();
let serverMode = process.env.NODE_ENV;
let instance;
let ping = class {
	constructor(config){
		if(!instance) {
			this.pingCount =0;
			this.clients=[];
			this.timeout=config.timeout||serverMode=='development'?5:30;
			this.pingChannel = 'ping:'+config.serverName;
			this.pongChannel = 'pong:'+config.serverName;
			this.config=config;
			this.ping(this.timeout);
			instance=this;
		}
		return instance;
	}
	ping (sec){
		sec=sec||this.timeout;
		pubSub.on(this.pongChannel,(msg)=>{
			this.updateClient(msg);
			console.log(this.pongChannel, " :PONG  RECEIVED: ",msg)
			ngivr.config.socketio.emit("VALAMI",{a:1})
		})
		this.interval = setInterval(()=>{
			pubSub.publish(this.pingChannel,'ping');
			this.pingCount++;
			this.updateClient();
			this.config.save();
			console.log('PING: ',this.pingChannel,this.pongChannel);
		},sec*1000);
	}

	stopPing(){
		if (this.interval) {
			clearInterval(this.interval);
		}
	}

	updateClient(msg) {
		let now = Date.now();
		for (let client of this.config.clientTokens) {
			if (msg && client.id===msg.id) {
				client.lastSeen = msg.ts;
				client.online=true
			}
			//a most-(előzőping +10 sec) óta nem jött válasz --> offline
			if (client.lastSeen<now-((this.timeout*1000)+10000)) {
				client.online=false;
			}
		}
	}
}
module.exports=exports  = (timeout)=>{
	return new ping(timeout);
}
