ngivr.angular.factory('ngivrArabesque', (ngivrObserver /*, socket */, $rootScope, ngivrDebounce) => {

    let currentSettings = ngivr.electron.arabesque.currentSettings;

    console.log('NGIVR-ARABESQUE: init')

    /*
    // ez maradjon ide, mert lehet majd kell ez

    socket.subscribe((ioClient) => {
        console.log('NGIVR-ARABESQUE: subscribe to ioClient socket')
        ioClient.on('ngivr-c2c-arabesque', function(actionData) {
            factory.update(actionData)
//            console.log('ngivr-io-arabesque socket connection', arguments)
        })
    })
    */

    const factory = new function() {

        currentSettings = ngivr.electron.arabesque.currentSettings;

        const self = this;

        self.update = (data) => {
            /*
            ngivr.console.group(`ngivr-arabesque update`)
            ngivr.console.log(data)
            ngivr.console.group()
            */

            ngivrObserver.get({
                factory: 'ngivrArabesque',
            }).forEach(subscriber => {
                subscriber(data);
            })
            if (!ngivr.json.equals(data, currentSettings)) {
                currentSettings = data;
                ngivrDebounce.scope.digest($rootScope)
            }
        }

        self.subscribe = (subscriber)  => {
            ngivrObserver.subscribe({
                factory: 'ngivrArabesque',
                subscriber: subscriber,
            })
            subscriber(currentSettings)
        }

        self.unsubscribe = (subscriber) => {
            ngivrObserver.unsubscribe({
                factory: 'ngivrArabesque',
                subscriber: subscriber,
            })
        }

    }
    return factory;
});
