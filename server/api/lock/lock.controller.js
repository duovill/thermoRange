/*******************************
 * TTL MINIMUM: 60 seconds!!!!!!
 *******************************/

let lock = require('../../module/redis-lock/redis-lock');
let redisClient = require('../../module/redis-pub-sub/redis-pub-sub')().getRedisClient();
lock.init(redisClient);

let lockController = class {
    static async index(req, res) {
        let locks;
        try {
            locks = await lock.getLocks();
        } catch (err) {
            if (global.ngivr.config.silent === false) {
                console.error(err);
            }
            return res.status(503).send(err);
        }
        res.send(locks)
    }

    static async create(req, res) {
        let resource = req.body.resource;
        let user = req.body.user;
        let ttl = req.body.ttl;
        const id = req.body.id;
        let newLock;
        try {
            newLock = await lock.lock(resource, user, ttl, undefined, id);
        } catch (err) {
            if (global.ngivr.config.silent === false) {
                console.error(err);
            }
            return res.status(503).send(err);
        }
        res.send(newLock);
    }

    static async createMore(req, res) {
        let newLocks = [];
        for (let toLock of req.body) {
            let newLock;
            try {
                newLock = await lock.lock(toLock.resource, toLock.user, toLock.ttl, undefined, toLock.id);
                newLocks.push(newLock)
            } catch (err) {
                if (global.ngivr.config.silent === false) {
                    console.error(err);
                }
                return res.status(503).send(err);
            }
        }
        res.send(newLocks)
    }

    static async update(req, res) {
        let resource = req.body.resource;
        let user = req.body.user;
        let ttl = req.body.ttl;
        const id = req.body.id;
        let newLock;
        try {
            newLock = await lock.extend(resource, user, ttl, id);
        } catch (err) {
            if (global.ngivr.config.silent === false) {
                console.error(err);
            }
            return res.status(503).send(err);
        }
        res.send(newLock);
    }

    static async unlock(req, res) {
        let resource = req.params.resource;
        let user = req.params.user;
        //console.log('__R',req.params);
        let unlock;
        try {
            unlock = await lock.unlock(resource, user);
        } catch (err) {
            if (global.ngivr.config.silent === false) {
                console.error(err);
            }
            return res.status(503).send(err);
        }
        res.send(unlock);
    }

    static async unlockMore(req, res) {
        // let user = req.params.locks;
        let unlocks = [];
        try {
            for (let toUnlock of req.body) {
                let unlock;
                unlock = await lock.unlock(toUnlock.resource, toUnlock.user);
                unlocks.push(unlock)
            }
        } catch (err) {
            if (global.ngivr.config.silent === false) {
                console.error(err);
            }
            return res.status(503).send(err);
        }
        res.send(unlocks);
    }

};

module.exports = exports = lockController;
