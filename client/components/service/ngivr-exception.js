'use strict';
ngivr.angular.factory('ngivrException', function ($interpolate) {

    const ngivrException = class {
        static handler(error) {
            if (error === undefined) {
                return;
            }
            console.error(error);
            console.trace();

            if (error instanceof Error || error.hasOwnProperty('message')) {

                if (error.hasOwnProperty('ngivrErrorHandled')) {
                    return;
                }
                error.ngivrErrorHandled = true;

                if (error.hasOwnProperty('name') && error.name === 'LockError') {
                    return;
                }
            }

            if (error instanceof Error) {
                if (error.hasOwnProperty('ngivrHandled')) {
                    return;
                }
            }
            let template;
            //console.warn(typeof (error.status) !== 'undefined' ,typeof error.xhrStatus === 'string')
            if (typeof (error.status) !== 'undefined' || typeof error.xhrStatus === 'string') {
                if (error.xhrStatus === 'timeout') {
                    template = ngivr.strings.exception.httpTimeout
                } else if (error.status === 404) {
                    template = ngivr.strings.exception.http404
                } else {
                    template = ngivr.strings.exception.http
                }
            } else {
                template = ngivr.strings.exception.error;
            }
            //console.warn(template)
            const growl = $interpolate(template)(error);
            ngivr.growl.error(growl);
            /*
             self.exception = class {
             static template(exception) {
             console.error(exception);
             const growlText = $interpolate(ngivrStrings.template.error.compile)(exception);
             ngivrGrowl(growlText, 'error');
             }

             static http(result) {
             console.error(result);
             const growlText = $interpolate(ngivrStrings.http.exception)(result);
             self.growl(growlText, 'error');
             }
             }
             */

        }
    }

    ngivr.exception = ngivrException;

    return ngivrException;

})

