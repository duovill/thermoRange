/*jshint esnext: true */
/*jshint asi:true, undef:true*/
/* global module,require,console,app,exports,ngivr */

let serverMode = process.env.NODE_ENV;
let sync = require('../../config/master.slave');
let mongoose = require('mongoose');
let ngivrString = require('../../../client/shared/ngivr-string');
let masterModel = require('../../api/synchronizer/synchronizer.model');
let syncSchema = require('../../schema/upsync');
let syncModel = mongoose.model('Upsync', require('../../schema/upsync'));
let redis = require('../redis-pub-sub/redis-pub-sub')().getRedisClient();


let _ = require('lodash');

const request = require('request');
let getPromised = (options) => {
	return new Promise((resolve, reject) => {
		if (process.env.NODE_ENV === 'dev-slave' || process.env.NODE_ENV === 'development') {
			options.agentOptions = {
				rejectUnauthorized: false,
			};
		}
		request(options, (error, response, body) => {
			if (error || response.statusCode !== 200) {
				return reject(error || new Error(response.statusCode));
			}
			let data = body;
			try {
				if (!options.json) {
					data = JSON.parse(data);
				}
			} catch (err) {
				return reject(err)
			}
			return resolve(data);
		});
	});
};


let syncSlave = class {
	static async ping() {
		//szinkornizálás folyik, nincs pingelés
		if (this.syncing || this.pinging) {
			return true;
		}
		//to prevent overlapping pings
		this.pinging = true;
		try {
			this.syncData = await sync.getSyncData();
			//ha a szerver futása alatt megváltozik a beállítás
			//NB: a a node-schedule modul nem tudja rendesen leállítani a taskot, ezért plusz ellenőrzést végzünk
			if (this.syncData.enabledAsClient) {

				let ping = await getPromised({
					url: this.syncData.masterServer.masterUrl,
					headers: {
						'x-ngivr-token': this.syncData.masterServer.masterToken
					}
				});
				this.pong = ping.pong;
				//this stops the ping
				this.syncing = true;

				let toSync = this.compare(ping.data);
				let upSync = this.getDataToUpsync(); //--> async function, start now, await later
				//lefelé szinkronizálás
				if (toSync.length > 0) {
					let syncResult = await this.startSync(toSync);
					this.lastSyncState = ping.data;
					//save succesful sync
					let u = await masterModel.findOneAndUpdate({_id:this.syncData._id},{$set:{'masterServer.syncState':this.lastSyncState,'masterServer.lastSync':Date.now()}});
				}
				//felfelé szinkron
				let upSyncData = await upSync;

				if (upSyncData.length > 0) {
					//send requests to the master one-by-one
					let upSyncResult = await this.startUpSync(upSyncData);
				}

				//this starts the ping again
				this.syncing = false;
			}
		} catch (e) {
			console.error('PING ERROR:\n', e);
			// return e;
		} finally {
			this.checkMasterState();
			this.pinging = false;
		}
	}

	static async startSync(toSync) {
		this.syncing = true;
		//szinkronizáló logika meghívása
		let promises = [];
		for (let elem of toSync) {
			let req = getPromised({
				method: 'POST',
				url: this.syncData.masterServer.masterUrl + '/pull/' + elem.schema,
				body: elem,
				json: true,
				headers: {
					'x-ngivr-token': this.syncData.masterServer.masterToken
				}
				//using .then there to use await Promise.all later...
			}).then(async (res) => {
				try {
					// let coll = _.camelCase(elem.schema);
					// coll = coll.endsWith("s") ? coll : coll + 's';
					// coll = coll.toLowerCase();
					if (res.length === 0) {
						return Promise.resolve(true);
					}

					let item = elem.schema;
					let sch= require(`../../schema/${item}`)
					let model = mongoose.model(ngivrString.pascalCase(item),sch);
					//NB: can't bypass mongoose because of objectIDs
					if (!elem.$gt) {
						// let rm = await mongoose.connection.db.collection(coll).remove({});
						// let ins = await mongoose.connection.db.collection(coll).insertMany(res)
						let z = await model.remove({});
						let x = await model.insertMany(res);
					} else {
						for (let upd of res) {
							delete upd.__v;
							let updRes = await model.findOneAndUpdate({
								_id: mongoose.Types.ObjectId(upd._id)
							}, upd, {
								upsert: true
							});
							// let updRes = await mongoose.connection.db.collection(coll).update({
							// 	_id: upd._id
							// }, upd, {
							// 	upsert: true
							// })
						}
					}
				} catch (err) {
					console.error(err)
				}
			})
			promises.push(req)
		}
		try {
			let results = await Promise.all(promises);
		} catch (err) {
			console.error(err)
		}
	}

	static async getDataToUpsync() {
		let data = await syncModel.find({});
		return data;
	}

	static async startUpSync(toSync) {
		//TODO: lock a szinkronizált elemre!!!
		let promises = [];
		try {
			for (let elem of toSync) {
				let req = getPromised({
					method: 'POST',
					url: this.syncData.masterServer.masterUrl + '/push/',
					body: elem,
					json: true,
					headers: {
						'x-ngivr-token': this.syncData.masterServer.masterToken
					}
					//using .then there to use await Promise.all later...
				}).then(async (resp) => {
					let deleted = await syncModel.deleteOne({
						_id: elem._id
					}); //remove synced doc
				}).catch((err) => {
					console.error(err)
					return false;
				});
				promises.push(req)
			}
			let resp = await Promise.all(promises)
		} catch (err) {
			console.error(err)
		}
	}

	//összehasonlít két objektumot. ha valamelyik property eltér, akkor beteszi a frissítendők közé.
	static compare(obj) {
		let toSync = [];
		//use stored state as default
		this.lastSyncState = this.lastSyncState || this.syncData.masterServer.syncState;
		let obj1 = this.lastSyncState;
		let sieve = {};
		for (let i in obj1) {
			if (obj1[i] && obj[i]) {
				sieve[i] = 1;
			}
			if (obj[i] && obj1[i] !== obj[i]) {
				toSync.push({
					schema: i,
					$gt: parseInt(obj1[i]),
					$lte: parseInt(obj[i])
				});
			}
		}
		for (let i in obj) {
			if (sieve[i]) {
				continue;
			}
			toSync.push({
				schema: i,
				$lte: parseInt(obj[i])
			});
		}
		return toSync;
	}

	static checkMasterState() {
		let oldState = this.masterOnline;
		let timeout = serverMode == 'dev-slave' ? 5 : 30;
		//10 sec puffer a kiesésre
		let timeDelta = Date.now() - ((timeout * 1000) + 10000);
		this.masterOnline = (!this.pong || this.pong < timeDelta || !this.syncData.enabledAsClient) ? false : true;
		if (oldState !== this.masterOnline) {
			let prefix = ngivr.config.redis.sccope;
			redis.set(prefix + 'syncMasterState', this.masterOnline)
			ngivr.socketio.emit('SYNCMASTERSTATE', this.masterOnline)
		}

	}
	static async getMasterState() {
		let prefix = ngivr.config.redis.sccope;
		this.masterOnline = await redis.get(prefix + 'syncMasterState');
		return this.masterOnline || false;
	}
}

module.exports = exports = syncSlave;
