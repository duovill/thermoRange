ngivr.angular.factory('ngivrHttpInterceptor', function(ngivrLoader) {

    return {
        'request': function(config) {
            ngivrLoader.interceptorRequest(config);
            return config;
        },

        // optional method
        'response': function(response) {
            ngivrLoader.interceptorResponse(response);
            return response;
        },

        'responseError': function(responseError) {
            ngivrLoader.interceptorResponse(responseError);
            return Promise.reject(responseError);
        }
    };
});
