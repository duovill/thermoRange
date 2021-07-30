(() => {
    const dbouncePath = _.debounce(($location, path) => {
        const $body = angular.element(document.body);            // 1
        const $rootScope = $body.injector().get('$rootScope');   // 2b
        $rootScope.$apply(function () {                        // 3
            $location.path(path);
        });
    }, ngivr.settings.debounce)

    ngivr.referrer = class {
        static clear() {
            ngivr.state.referrer = {};
        }

        static get path() {
            const state = ngivr.state.referrer;
            return state.pathname + state.search + state.hash;
        }

        static get isUnique() {
            const state = ngivr.state.referrer;
            if (typeof(state) === 'undefined' || !state.hasOwnProperty('pathname')) {
                return false;
            }
            if (state.pathname.startsWith('/login') || state.pathname === '/') {
                return false;
            }
            return true;
        }

        static forward($location) {
            const path = this.path;
            this.clear();
//        console.warn($location, path)
            dbouncePath($location, path)
        }
    };

})()
