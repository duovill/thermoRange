/*jshint esnext: true */
/*jshint asi:true, undef:true, unused:true*/
/* global module,require,exports */

/**
 * This static class loads and caches the server's master/slave state and related params from the database
 * returns Promise (a pending or a resolved promise)
 * use: await getSyncData()
 * to refresh use the refreshData() method
 */
'use strict';
let masterModel = require('../api/synchronizer/synchronizer.model');
let clientModel = require('../api/synchronizerClients/synchronizer.clients.model');
let redis = require('../module/redis-pub-sub/redis-pub-sub')();
// let schedule = require('../module/schedule');
let serverConfig = class {
	static async loadSyncData() {
		let result,clients;
		try {
			result = await masterModel.findOne();
			clients = await  clientModel.find();
			if (!result) {
				result={enabledAsMaster:false,enabledAsClient:false}
				// throw new Error(`Master/slave configuration is missing!`);
			} else {
				result.clientTokens= clients;
			}
		} catch (error) {
			console.log(error);
			return error;
		}
		return result;

	}

	static getSyncData(){
		return this.data? this.data:this.refreshData();
	}

	static refreshData(){
		return this.data=this.loadSyncData()
	}

	static subscribeToChanges(){
		if (this.subscribed) {
			return;
		}
		redis.subscribe("changes:synchronizer",async (msg)=>{
			let d = await this.refreshData();
			if (process.env.NGIVR_SERVER_COMMAND === 'singleton' || process.env.NGIVR_CLUSTER === undefined) {
				//újraütemezés
				let schedule = require('../module/schedule');
				schedule.BootSlaveSync();
			}
		})
		this.subscribed=true;
	}


}

serverConfig.subscribeToChanges();
module.exports=exports= serverConfig;
