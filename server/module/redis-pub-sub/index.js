/*jshint esnext: true */
/*jshint asi:true, undef:true*/
/* global module,require,console,app,exports,ngivr */
'use strict';
let pubSub = require('./redis-pub-sub');
let syncData=require('../../config/master.slave');
module.exports=async()=>{
	let data =	await syncData.getSyncData(); //returns cached data
	if (data.enabledAsMaster) {
		require('./redis.ping')(data)
	};
	if (data.enabledAsClient) {
		require('./redis.pong')(data)
	};
}
