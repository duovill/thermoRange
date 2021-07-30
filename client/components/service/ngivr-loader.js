ngivr.angular.service('ngivrLoader', function ($rootScope, $timeout) {

    const self = this;
    let counter = 0;
    let loaderConfig = {};

    Object.defineProperty(self, 'counter', {
        get: () => {
            return counter
        }
    })

    self.hasExclude = (config) => {
        if (!loaderConfig.hasOwnProperty('exclude')) {
            return false
        }
        const hasExclude = loaderConfig.exclude.includes(config.url);
//    console.log('hasExclude', config.url, hasExclude);
        return hasExclude;
    }

    self.setConfig = (setLoaderConfig) => {
        loaderConfig = setLoaderConfig;
    }

    self.interceptorRequest = (config) => {
        if (self.hasExclude(config)) {
            return;
        }
        if (config.headers && config.headers['ngivr-request-silent']) {
            config.ngivrRequestSilent = true
            delete config.headers['ngivr-request-silent']
            return;
        }
        counter++;
        if (counter === 1) {
            $rootScope.ngivrLoading = true
//            $timeout(() => {
//                $rootScope.$digest();
//            })
        }
    }

    self.interceptorResponse = (response) => {
        if (self.hasExclude(response.config)) {
            return;
        }
        if (response.config.ngivrRequestSilent === true) {
            return;
        }
        counter--;
        if (counter === 0) {
            $rootScope.ngivrLoading = false
//            $timeout(() => {
//                $rootScope.$digest();
//            })
        }
    }

});
