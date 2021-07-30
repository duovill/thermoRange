/*jshint esnext: true */
/*jshint asi:true, undef:true*/
/* global module,require,console,app,exports */

/**
 * Class for Redis and Redis pub/sub
 * Singleton class
 * for get regular Redis client use this function: getRedisClient()
 * for subscribe an event use: subscribe() or on();
 * Subscribe example
 * 		let handlerRef = redisPubSub.subscribe('test',(msg)=>{console.log("Message is JSON parsed:\n",msg)});
 * Unsubscribe example:
 *		handlerRef(optionalCallback);
 *
 * For publish/emit a message use: emit() or publish() (You can publish to ANY channel without subscribing first!)
 * Publish example:
 *		redisPubSub.publish("teszt",{a:23,b:14});
 *
 */
let redis = require("ioredis");

'use strict';
let instance;
let redisPubSub = class {
	/* options: Object
	 * {host,port,auth,url}
	 */
	constructor(options) {
		if (!instance || !instance.emitter||!instance.subscriber) {
			// if (!options) {
			// 	throw new Error("Redis options missing!");
			// }
			if (options && options.url) {
				options = options.url;
			}
			//we have to use 2 separate clients for pub/sub because of Redis
			//the emitter can be used as a regular Redis client too
			this.subscriber = global.ngivr.redisSubscriber
			this.emitter = global.ngivr.redis
			this.prefix=global.ngivr.config.redis.scope;
			this.msg_count = 0;

			//set an alias for this.on
			this.subscribe = this.on;
			//set an alias for this.publish
			this.emit = this.publish;
			//this class is a singleton
			instance = this;
		}
		return instance;

	}

	/**
	 * Return the emitter object to be used as a regular redis client (to save resources).
	 */
	getRedisClient() {
		return this.emitter;
	}

	/**
	 * Subscribe to a channel
	 * @param {String} channel The channel to subscribe to, can be a pattern e.g. 'user.*'
	 * @param {Function} handler Function to call with the received message.
	 * @param {Function} callback Optional callback to call once the handler is registered.
	 * @return {Function} removeListener Function to remove listener
	 *
	 */
	on(channel, handler, callback) {
		if (typeof handler !== 'function') {
			throw new Error('Message handler missng!');
		}
		if (channel === 'error') {
			this.errorHandler = handler;
			this.emitter.on("error", handler);
			this.subscriber.on("error", handler);
			if (typeof callback === 'function') {
				callback();
			}
			return;
		}

		var pmessageHandler = (pattern, _channel, message) => {
			if (this.prefix + channel === pattern) {
				try {
					return handler(JSON.parse(message), _channel);
				} catch (ex) {
					if (typeof this.errorHandler === 'function') {
						return this.errorHandler("Invalid JSON received! Channel: " + this.prefix + channel + " Message: " + message);
					}
				}
			}
		};

		this.subscriber.on('pmessage', pmessageHandler);

		this.subscriber.psubscribe(this.prefix + channel, callback);

		var removeListener = (callback) => {
			this.subscriber.removeListener('pmessage', pmessageHandler);
			return this.subscriber.punsubscribe(this.prefix + channel, callback);
		};

		return removeListener;
	}

	/**
	 * Publish/emit an event
	 * @param {String} channel Channel on which to emit the message
	 * @param {Object} message
	 */
	publish(channel, message) {
	  return this.emitter.publish(this.prefix + channel, JSON.stringify(message));
	};

	/**
	 * Safely close the redis connections 'soon'
	 */
	quit() {
	  this.emitter.quit();
	  this.subscriber.quit();
	};

	/**
	 * Close the redis connections immediately
	 */
	end() {
	  this.emitter.end();
	  this.subscriber.end();
	};

}

module.exports = exports = (options) => {
	return new redisPubSub(options)
}
