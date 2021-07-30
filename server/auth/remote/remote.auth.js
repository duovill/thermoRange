/*jshint esnext: true */
/*jshint asi:true, undef:true*/
/* global module,require,console,app,exports */

'use strict';
let serverMode = process.env.NODE_ENV; //ha develop módban vagyunk, a kliens kap hibaüzenetet, egyébként nem
let syncData=require('../../config/master.slave');
let instance;
let externalAuthController = class {
	constructor(){
		if (!instance) {
			instance = this;
		}
		return instance;
	}
	async auth(req,res,next) {
		try {
			let token = req.get('x-ngivr-token');
			let authenticated;
			if (!token) {
				return res.status(403).send('Forbidden');
			}
			let data = await syncData.getSyncData();
			if (!data.enabledAsMaster) { //master működés nem engedélyezett!
				throw new Error('Master functionality disabled!');
			}
			//CHECK token validity
			for (let client of data.clientTokens) {
				if (client.enabled && client.token===token) {
					req.clientID= client.id;
					authenticated=true;
					break;
				}
			}
			if (!authenticated) {
				throw new Error('Client disabled or token mismatch!')
			}

		} catch (error) {
			console.log(error);
			if (serverMode==="development"|| serverMode==="dev-slave" ||token) {
				return res.status(500).send(error).end();
			} else {
				return res.sendStatus(500).end();
			}
		}
		console.log('AUTH OK')
		next();
	}
}

module.exports = exports = ()=>{
	return new externalAuthController();
};
