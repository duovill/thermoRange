'use strict';
ngivr.angular.factory('authInterceptor', function ($rootScope, $location, jwtHelper, $injector, $cookies) {
    return {
        // Add authorization token to headers
        request: function (config) {
            config.headers = config.headers || {};
            if ($cookies.get('token')) {
                var act = new Date().getTime() / 1000;
                var tokenData = jwtHelper.decodeToken($cookies.get('token'));
                var exp = tokenData.exp;
                //console.log("time till token expire: ", exp-act);
                //if((exp-act) < 17980) {
                const differenceExpireMinutes = (exp - act) / 60;
                if (differenceExpireMinutes < ngivr.settings.session.minimumRefreshMinutes) {
                    $rootScope.$emit('refreshToken');
                }
                config.headers.Authorization = 'Bearer ' + $cookies.get('token');
            }
            return config;
        },

        // Intercept 401s and redirect you to login
        responseError: function (response) {
            if (response.status === 401) {
                const Auth = $injector.get('Auth');
                Auth.logout();
                return Promise.reject(response);
            } else {
                return Promise.reject(response);
            }
        }
    };
});
