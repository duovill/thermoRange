/*jshint esnext: true */
/*jshint asi:true, undef:true*/
/* global module,require,console,app,exports */
'use strict';
const request = require('request');
const seeMe = require('../../config/environment/index').seeMe;
const utils = require('corifeus-utils');
let smsLog = require('./sendSms.model');

// LÁSD: https://seeme.hu/tudastar/reszletek/sms-gateway-parameterek
// LÁSD: https://seeme.hu/tudastar/reszletek/sms-gateway-callback


let sendSmsPromised = (msg, tel, msgId, cbType, cbFormat) => {
	return new Promise((resolve, reject) => {
		let cbUrl = encodeURIComponent(seeMe.callbackDomain + seeMe.callbackPath);
		request(`${seeMe.gateway}?key=${seeMe.apiKey}&message=${msg}&number=${tel}&callback=${cbType}&format=${cbFormat}&callbackurl=${cbUrl}&reference=${msgId}`, (error, response, body) => {
			if (error || response.statusCode !== 200) {
				return reject(new Error(error || response.statusCode));
			}
			return resolve(JSON.parse(body));
		});
	});
};

let sendSmsController = class {
	static async sendSms(msg, telNo, cbType = seeMe.callbackType, cbFormat = seeMe.callbackFormat) {
		let error;
		if (!msg || !telNo) {
			return Promise.reject(new Error('Parameter(s) missing!'));
		}
		let id, smsStatus, log, encodedMsg;
		encodedMsg = encodeURIComponent(msg);

		try {
			//remove all characters but numbers
			//seeMe consumes international numbers without the leading "+" too
			let telType = typeof telNo;
			if (telType === "string") {
				//telNo = telNo.replace(/[^0-9]/g, '');
				telNo = telNo.replace(/[+]/g,'00').replace(/[^0-9]/g, '')
			} else if (telType === "number") {
				//cast to Int
				telNo = telNo | 0;
			} else { //other, throw error
				throw "Wrong number format";
			}
			//messageID
			id = await utils.random(16);
			//note the catch function used to log failed requests too
			smsStatus = await sendSmsPromised(encodedMsg, telNo, id, cbType, cbFormat).catch((err)=>{smsStatus=err;});
			log = new smsLog({
				id,
				msg,
				sentToGateway: new Date(),
				telNo,
				statusMsg:smsStatus.message
			});
			log = await log.save();
		} catch (err) {
			err = err.name==="error"?err:new Error(err);
			return Promise.reject(err);
		}
		return smsStatus;
	}

	static async handleCallback(req, res) {
		if (!req || !res) {
			return false;
		}
		//forrás IP ellenőrzése
		if (req.ip !== seeMe.callbackIp) {
			res.sendStatus(403);
		}
		let logItem;
		try {
			//messageID ellenőrzése - ha nincs ilyen id, akkor 403!
			logItem = await smsLog.findOne({
				id: req.query.reference
			});
			if (!logItem) {
				res.sendStatus(403);
				throw "Invalid message ID";
			}
			logItem.statusCode = req.query.code;
			logItem.statusTimestamp = req.query.timestamp;
				logItem.statusMsg = decodeURIComponent(req.query.message);
			logItem = await logItem.save();

		} catch (err) {
			res.sendStatus(500);
			console.error(err);
		}
	}
}

module.exports = exports = sendSmsController;
