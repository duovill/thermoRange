ngivr.list = class {

    static clear($scope, cb) {
        ngivr.event.on.list.clear($scope, cb);
    }


    static requery($scope, args) {
        ngivr.$timeout.cancel(this.requeryDebounce);
        this.requeryDebounce = ngivr.$timeout(() => {
            ngivr.event.broadcast($scope, ngivr.settings.event.client.list.requery, args);
        }, ngivr.settings.debounce);

    }


}
