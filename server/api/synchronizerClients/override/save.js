/*jshint esnext: true */
/*jshint asi:true, undef:true, unused:true*/
let masterSlaveConfig = require('../../../config/master.slave');
let redis = require('../../../module/redis-pub-sub/redis-pub-sub')();
module.exports = (request, response) => {
//TIMEOUT!!! mivel ezek még nem elmentett értékek, ezért kell egy timeout!
	setTimeout(()=>{
		redis.publish("changes:synchronizer",'SYNC data changed');
		masterSlaveConfig.refreshData(); //returns a Promise!
	},3000)
}
