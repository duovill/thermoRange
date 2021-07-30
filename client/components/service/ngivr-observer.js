ngivr.angular.factory('ngivrObserver', () => {

    const subscriberFactory = {};

    const logSubsciption = (options) => {
        const {factory, subscriber, logInfo} = options;
        ngivr.console.group(`NGIVR-OBSERVER: ${logInfo}: ${subscriber.ngivrId}`)
        const keys = Object.keys(subscriberFactory[factory]);
        ngivr.console.log('verify that it is including now', keys.includes(subscriber.ngivrId))
        ngivr.console.log('subscribers left', keys)
        ngivr.console.log('verify subscribers is still existing', subscriberFactory[factory][subscriber.ngivrId])
        ngivr.console.group();

    }

    const ensureFactory = (factory) => {
        if (!subscriberFactory.hasOwnProperty(factory)) {
            subscriberFactory[factory] = {};
        }

    }

    return new function () {

        const self = this;

        self.get = (options) => {
            const {factory} = options;
            ensureFactory(factory);
            return Object.keys(subscriberFactory[factory]).map(function(key) {
                return subscriberFactory[factory][key];
            });
        }

        self.subscribe = (options) => {
            const {factory, subscriber} = options;

            ensureFactory(factory);

            if (subscriber.hasOwnProperty('ngivrId')) {

                ngivr.growl.error('Ez furcsa, ketto subscribe van!!! Nezzuk at.')

                logSubsciption(Object.assign({
                    logInfo: 'subscribe existing already'
                }, options))

                return false;
            }
            subscriber.ngivrId = ngivr.nextId();
            subscriberFactory[factory][subscriber.ngivrId] = subscriber;

            logSubsciption(Object.assign({
                logInfo: 'subscribe'
            }, options))

            return true;
        }

        self.unsubscribe = (options) => {
            const {factory, subscriber} = options;
            delete subscriberFactory[factory][subscriber.ngivrId];
            logSubsciption(Object.assign({
                logInfo: 'unsubscribe'
            }, options))
        }

    }

})
