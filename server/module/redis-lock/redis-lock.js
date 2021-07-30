/*******************************
 * TTL MINIMUM: 60 seconds!!!!!!
 *******************************/

let util = require('util');
let utils = require('corifeus-utils');
let Promise = require('bluebird');

let socketModule;

// let redLock = require('redlock');

// constants
const lockScript = 'return redis.call("set", KEYS[1], ARGV[1], "NX", "PX", ARGV[2])';
const unlockScript = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
const extendScript = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("pexpire", KEYS[1], ARGV[2]) else return 0 end';

// defaults
var defaults = {
    driftFactor: 0.01,
    // ha nincs akkor vegtelen ciklus lesz, tehat 1 a minimum kotelezo
    retryCount: 1,
    retryDelay: 200,
    retryJitter: 100
};

const defaultTtl = (global.ngivr.config.env === 'development' ? global.ngivr.config.settings.redisLock.dev.timeout.ttl : global.ngivr.config.settings.redisLock.prod.timeout.ttl);

// LockError
// ---------
// This error is returned when there is an error locking a resource.
class LockError extends Error {
    constructor(message, attempts) {
        // Error.call(this);
        super();
        Error.captureStackTrace(this, LockError);
        this.name = 'LockError';
        this.message = message || 'Failed to lock the resource.';
        this.attempts = attempts;
    }
}

let Lock = class {
    constructor(redisLock, resource, value, expiration, attempts) {
        this.redisLock = redisLock;
        this.resource = resource;
        this.value = value;
        this.expiration = expiration;
        this.attempts = attempts;

    }

    unlock() {
        return this.redisLock.unlock(this.resource, this.value);
    }

    extend(ttl) {
        return this.redisLock.extend(this.resource, this.value, ttl);
    }

};


let RedisLock = class {
    static init(connections, options) {
        socketModule = require('./redis-lock.socket');
        if (this.initialized) {
            return;
        }
        if (!Array.isArray(connections)) {
            connections = [connections]
        }

        this.servers = connections;
        // set the redis servers from additional arguments
        if (this.servers.length === 0) {
            throw new Error('RedisLock must be instantiated with at least one redis server.');
        }
        // set default options
        options = options || {};
        this.driftFactor = typeof options.driftFactor === 'number' ? options.driftFactor : defaults.driftFactor;
        this.retryCount = typeof options.retryCount === 'number' ? options.retryCount : defaults.retryCount;
        this.retryDelay = typeof options.retryDelay === 'number' ? options.retryDelay : defaults.retryDelay;
        this.retryJitter = typeof options.retryJitter === 'number' ? options.retryJitter : defaults.retryJitter;
        this.lockScript = typeof options.lockScript === 'function' ? options.lockScript(lockScript) : lockScript;
        this.unlockScript = typeof options.unlockScript === 'function' ? options.unlockScript(unlockScript) : unlockScript;
        this.extendScript = typeof options.extendScript === 'function' ? options.extendScript(extendScript) : extendScript;

        this.lockError = LockError;
        // the number of votes needed for consensus
        this.quorum = Math.floor(this.servers.length / 2) + 1;
        //redis prefix
        this.prefix = ngivr.config.redis.scope;
        this.initialized = true;

        console.log('redis-lock: default ttl', defaultTtl, 'in environment', global.ngivr.config.env)

        socketModule.sendLocks();
    }

    static async lock(resource, user, ttl, extended, id, noemit = false, instanceId = 'fix') {
        //construct a unique value for each lock username field used to identify locking user
//console.log('locking', 'resource', resource, 'user', user, 'extended', extended);

        user = user || '';
        user = user.split(':');
        let value;
        let extend = false;
        if (user[1]) {
            value = user[0] + ':' + user[1];
            extend = true;
        } else {
            if (id === undefined) {
                console.warn(`redis-lock: socket.lockId is missing`)
                id = await utils.random(16);
            }
            value = user[0] + ':' + id
        }
        if (user[2] !== undefined) {
            value = `${value}:${user[2]}`;
        } else {
            const userModel = require('../../api/user/user.model');
//      console.log('find user', user, user[0])
            const userData = await userModel.findOne({
                _id: user[0],
            })
            value = `${value}:${userData.nickName.replace(/:/g, '-')}`;
        }
        if (id !== undefined && extended === true) {
            extend = true;
        }
//console.log('data', data, 'extend', extend)
        //original resource passed back to the client as a reference
        let origResource = resource;
        //prefix resource
        resource = resource || "";
        resource = this.prefix + 'lock:' + resource;

        //default lock timeout
        ttl = ttl || defaultTtl
        // minimum 30 seconds
        ttl = Math.max(ttl, 30);
        value = `${value}:${ttl}:${instanceId}`;

        //convert to ms
        ttl *= 1000;
        //ennyi ervenyes szavazat erkezett
        let votes = 0;
        //ennyi kell a megegyezeshez
        let quorum = this.quorum;
        //ide mennek szerverenkent a requestek
        let requests = [];


        // Add 2 milliseconds to the drift to account for Redis expires precision, which is 1 ms,
        // plus the configured allowable drift factor
        let drift = Math.round(this.driftFactor * ttl) + 2;
        let timeout = Date.now() + ttl - drift;

        //a konszenzus eléréséig, vagy a próbálkozások max. számáig próbál lockot szerezni minden szerveren
        let acqLock = async (resource, value, ttl, retryCount, server, extend) => {
            let vote = false;
            let delay;
            for (let attempts = 0; attempts < retryCount; attempts++) {
                if (votes > quorum || timeout <= Date.now()) {
                    //megvan már a konszenzus, vagy timeout-olt a kérés
                    throw new LockError('timeout and/or consensus reached')
                }
                try {
                    if (attempts > 0) { //ha ez nem az első próbálkozás, akkor késleltetjük a köv. hívást.
                        delay = await this.delayNextReq();
                    }
                    if (!extend) {
                        vote = await server.eval(this.lockScript, 1, resource, value, ttl);
                    } else {
                        vote = await server.eval(this.extendScript, 1, resource, value, ttl);
                    }
                    if (vote && timeout > Date.now()) {
                        votes++;
                        break;
                    }
                } catch (err) {
                    throw (err);
                }
            }
            if (vote) {
                return vote
            } else {
                throw new LockError('Exceeded ' + this.retryCount + ' attempts to lock the resource "' + resource + '".');
            }
        };

        for (let server of this.servers) {
            requests.push(acqLock(resource, value, ttl, this.retryCount, server, extend));
        }
        //KZ: Do not use this, as full stack needs to be async!
        // requests = this.servers.map((server)=>{
        // 	acqLock(resource,data,ttl,this.retryCount,server,extend)
        // });
        try {
            //wait for the required votes only!
            //(locks will be executed on all servers regardless of waiting all resposes)
            let lock = await Promise.some(requests, quorum)
        } catch (err) {
            throw new LockError(`Can't lock resource: ${resource}. Please try again later.Error:${err}`);
        }
        if (!noemit) {
            socketModule.sendLocks();
        }
        return new Lock(this, origResource, value, timeout);
    }

    static extend(resource, user, ttl, id, noemit = false, instanceId = 'fix') {
        // if (ttl < Date.now()) {
        // 	throw new LockError('Cannot extend lock on resource "' + resource + '" because the lock has already expired.', 0);
        // }
        return this.lock(resource, user, ttl, true, id, noemit, instanceId)
    }

    static async unlock(resource, value, noemit = false) {
        let origResource = resource;
        resource = resource || "";
        value = value || '';
        if (!value.split(":")[1]) {
            throw new LockError("Locking user doesn't have the attached value sent by the server on successful lock.")
        }
        let votes = 0;
        let quorum = this.quorum;
        let requests = [];
        resource = this.prefix + 'lock:' + resource;
        let releaseLock = async (resource, value, server) => {
            let unlocked = await server.eval(this.unlockScript, 1, resource, value);
            // - if the lock was released by this call, it will return 1
            // - if the lock has already been released, it will return 0
            //    - it may have been re-acquired by another process
            //    - it may hava already been manually released
            //    - it may have expired
            if (typeof unlocked === 'number' && (unlocked === 0 || unlocked === 1)) {
                votes++;
            }
        };

        for (let server of this.servers) {
            requests.push(releaseLock(resource, value, server));
        }
        let result;
        try {
            //wait for the required votes only!
            result = await Promise.some(requests, quorum);
        } catch (err) {
            throw new LockError('Unable to fully release the lock on resource "' + resource + '".');

        }
        if (!noemit) {
            socketModule.sendLocks();
        }
        return {resource: origResource, deleted: true};
    }

    static getLocks() {
        return new Promise((resolve, reject) => {
            const stream = this.servers[0].scanStream({
                match: `${this.prefix}lock:*`,
            });
            let keys = [];
            stream.on('data', (resultKeys) => {
                keys = keys.concat(resultKeys);
            });

            stream.on('end', async () => {
                try {

                    let requests = [];
                    let ttls = [];
                    let ret = [];
                    for (let key of keys) {
                        requests.push(this.servers[0].get(key));
                        ttls.push(this.servers[0].ttl(key))
                    }
                    const resultsAll = await Promise.all([
                        Promise.all(requests),
                        Promise.all(ttls)
                    ])
                    let results = resultsAll[0];
                    let ttr = resultsAll[1];
//console.log('results', results, 'ttl', ttr)
                    for (let i in results) {
//                        console.log(results[i])
                        if (results[i] === null) {
                            continue;
                        }
                        const resultData = results[i].split(':');
                        ret.push({
                            doc: keys[i].split(this.prefix + 'lock:')[1],
                            user: resultData[0],
                            timeout: ttr[i],
                            nickName: resultData[2],
                            ttl: resultData[3],
                            id: resultData[1],
                            instanceId: resultData[4],
                        })
                    }
                    resolve(ret);

                } catch (e) {
                    console.error(e);
                    reject(e)
                }

            });
        })
    }

    /*
    static async getLocks () {
        let keys =await  this.servers[0].keys(this.prefix+'lock:*');
        let requests=[];
        let ttls=[];
        let ret = [];
         for (let key of keys){
            requests.push(this.servers[0].get(key));
            ttls.push(this.servers[0].ttl(key))
        }
        let results = await Promise.all(requests);
        let ttr= await Promise.all(ttls);

        for (let i in results) {
            ret.push({
                doc: keys[i].split(this.prefix+'lock:')[1],
                user: results[i].split(':')[0],
                timeout: ttr[i]
            })
        }
        return ret;
    }
  */

    static delayNextReq() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, Math.max(0, this.retryDelay + Math.floor((Math.random() * 2 - 1) * this.retryJitter)))
        })
    }

};

module.exports = RedisLock;

