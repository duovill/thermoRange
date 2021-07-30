/*jshint esnext: true */
/*jshint asi:true, undef:true*/
/* global module,require,console,app,exports,ngivr */

let redis = require('../redis-pub-sub/redis-pub-sub')().getRedisClient();
let sync = require('../../config/master.slave');
let corifeusUtils = require('corifeus-utils');
let serverMode = process.env.NODE_ENV;
let mongoose = require('mongoose');
let ngivrString = require('../../../client/shared/ngivr-string');
let clientModel = require('../../api/synchronizerClients/synchronizer.clients.model');
let User = require('../../api/user/user.model');
let auth = require('../../auth/auth.service');
let _ = require('lodash');


const schemaToSync=['contract','depot','stock-value','product','mnb-prices','service-contract','service-contract-item','order','parity','order-vehicle','ship', 'partner'];

let synchronizer = class {
	//ping-re válaszul visszaadja az utolsó adatváltozás idejét. Ha ez újabb, mint a kliensen levő idő, akkor a kliensnek szinkronizálnia kell
	static async pong(req, res) {
		try {
			let prefix=ngivr.config.redis.scope;

			//ha nincsenek alap adatok, pl szerver induláskor, akkor be kell szerezni őket...
			//a startInit egy Promise-t ad vissza, ha az init lefutott, a promise resolved, egyébként pending
			let init = await this.startInit();

			//jelenleg nem teszünk különbséget a kliensek között, mindenki megkap mindent
			let data = await redis.hgetall(prefix+'updatedCollections');

			//itt tároljuk, hogy mikor láttuk a klienst utoljára
			await redis.hmset(prefix+'online', req.clientID, Date.now().toString());
			res.send({pong:Date.now(),data})
		} catch (err) {
			return global.ngivr.handleError(res, err, 500);
		}
	}

	static async checkSlaves(supress) {
		try {
			let prefix=ngivr.config.redis.scope;
			let clientData = await redis.hgetall(prefix+'online');
			this.clientData = this.clientData||{};
			let syncData = await sync.getSyncData();
			if (!syncData.enabledAsMaster) {
				return {}
			}
			for (let elem of syncData.clientTokens) {
				if (elem.enabled) {
					this.clientData[elem.id] = this.clientData[elem.id]||{
						online: false,
						name: elem.name,
						id: elem.id
					};
				}
			}
			let change;
			let now = Date.now();
			let timeout = serverMode == 'development' ? 5 : 30
			//10 sec puffer a kiesésre
			let timeDelta = now - ((timeout * 1000) + 10000);
			let online;
			for (let i in clientData) {
				if (!this.clientData[i]) {
					continue;
				}
				if (clientData[i] < timeDelta) {
					online = false;
				} else {
					online = true;
				}
				//az előző állapothoz képest változott
				if (online !== this.clientData[i].online) {
					this.clientData[i].online = online;
					change = true;
				}
			}
			if (change && !supress) {
				ngivr.socketio.emit('SYNCCLIENTSTATE', this.clientData)
			}
		} catch (err) {
			global.ngivr.handleError(err);
		}
	}

	static async getClientData() {
		try {
			await this.checkSlaves(true);
			return this.clientData;
		} catch (err) {
			global.ngivr.handleError(err);
		}

	}

	//subscribe to the events emittedd on save/modify (specific)collections
	static attachEvents(){
		let prefix=ngivr.config.redis.scope;
		ngivr.config.eventEmitter.on('modified',(data)=>{
			redis.hset(prefix+'updatedCollections',data.schema,data.ts)
		})
	}

	static startInit() {
		//if initialized then return a resolved Promise otherwise a pending one
		return this.initStarted?this.initStarted:this.initStarted=this.initialize();
	}

	static async initialize(){
		this.attachEvents()
		let prefix=ngivr.config.redis.scope;
		try {
			let promises =[];
			for(let item of schemaToSync) {
				// item = ngivrString.kebabCase(item)
				let sch= require(`../../schema/${item}`)
				let model = mongoose.model(ngivrString.pascalCase(item),sch);
				let result = model.findOne({}, {updatedAt: 1}, {sort: {updatedAt: -1}});
				promises.push(result);
			}
			let modifications= await Promise.all(promises);
			let initData={}
			for (let i  in modifications) {
				if (!modifications[i]) {
					continue;
				} else {
					initData[schemaToSync[i]]=modifications[i].updatedAt.getTime()
				}
			}
			await redis.hmset(prefix+'updatedCollections', initData);
		} catch (err) {
			global.ngivr.handleError(err)
		}
		this.initialized=true;
	}

	//a client pull data from the master
	//a   $gt< doc.updatedAt<=$lte alapján adja vissza a dokumentumokat a kollekcióból
	//egyebet jelenleg nem figyel
	static async pull(req,res){
		try {
			console.log("Bejövő: ",req.params.schema)
			let schema=req.params.schema;
			let queryParams=req.body;
			let query ='';
			let gtParam='';
			let lteParam='';
			//!!!!! kétféle dátum megfeleltetés, mert vannak kollekciók, ahol az egyik megy, vannak, ahol a másik
			if (queryParams.$gt){
				gtParam={$or:[{updatedAt: {$gt:new Date(queryParams.$gt).toISOString()}},{updatedAt: {$gt:new Date(queryParams.$gt)}}]};
			}
			if (queryParams.$lte){
				lteParam={updatedAt: {$lte:new Date(queryParams.$lte).toISOString()}};
				lteParam={$or:[{updatedAt: {$lte:new Date(queryParams.$lte).toISOString()}},{updatedAt: {$lte:new Date(queryParams.$lte)}}]};
			}
			if (queryParams.$gt && queryParams.$lte) {
				query={$and:[gtParam,lteParam]}
			} else {
				query=gtParam||lteParam;
			}
			//TODO: bypass mongoose for speed
			//we are querying and transporting only validated docs (at least in theory)
			// let item = req.params.schema;
			// let sch= require(`../../schema/${req.params.schema}`)
			// let model = mongoose.model(ngivrString.pascalCase(item),sch);
			// let result = await model.find(query);
			console.log(JSON.stringify(query));
			let coll = _.camelCase(req.params.schema);

			// handle parity, currency etc!
			if (coll.endsWith("y")) {
				coll= coll.slice(0, -1);
				coll+='ies'
			}

			coll = coll.endsWith("s")?coll:coll+'s';
			coll =coll.toLowerCase();
			let result = await mongoose.connection.db.collection(coll).find(query).toArray();
			//log syncronization timestamp
			let updRes= await clientModel.findOneAndUpdate({id:req.clientID},{$set:{[`lastSync.${req.params.schema}`]:Date.now()}});
			if (result.length===0 && (process.env.NODE_ENV === 'dev-slave' || process.env.NODE_ENV === 'development') ) {
				console.log("EZT KÜLDÖM VISSZA: \n",req.params.schema,": ÜRES ADAT!");
			}else {
				console.log("EZT KÜLDÖM VISSZA: \n",req.params.schema,": ",result.length);
			}
			res.send(result)
		} catch (err) {
			handleError(res,err);
		}

	}

	/*
	 * Transform an incoming AUTHENTICATED synchronization request
	 * to an authenticated API request and re-route it to the proper endpoint
	 */
	static async push(req,res) {
		/*the other way without re-routing is to find route and then the attached handler
		 *If the handler function found: call it directly from this function
		 *to get t fhe routes: app._router.stack
		 */
		 try {
			 //let's create a token for the _synchronizer to access any API
	 		//this token wont'be ever sent to any client

	 		let user = await User.findOne({ name: '_synchronizer',approved:false});
	 		let token = auth.signToken(user._id,user.role);

	 		//rewrite body, url, cookies and method to pass the req to the corresponding api
	 		req.url=req.body.url;
	 		req.originalUrl=req.body.url;
	 		req.cookies.token=JSON.stringify(token);
	 		req.method = req.body.method;
	 		req.body = req.body.rawBody;
	 		//restart req at the beginning
	 		req.app.handle(req,res);
		 } catch (err) {
			 res.send(err);
			 console.error(err);
		 }

	}

};

//SINGLETON!
// synchronizer.push();
module.exports = exports = synchronizer;
