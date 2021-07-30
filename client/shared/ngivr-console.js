(() => {

    let _;

    const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
    const isWindow = typeof(window) !== 'undefined';

//  console.group = console.info;
//  console.groupEnd = console.info;
//  console.groupCollapsed = console.info;
    let _console = console;
    if (isModule) {
        _ = require('lodash');
    } else {
        _ = window._;
    }

    function isPrimitive(value){
        return _.isNil(value) || _.isNumber(value) || _.isBoolean(value) || _.isString(value) ;
    }

    const apply = (method, args) => {
        for (let index = 0; index < args.length ; index++) {
            _console[method](args[index]);
            if (method === 'error' && ngivr.config.dev) {
                const message = isPrimitive(args[index]) ? args[index] : ngivr.json.stringify(args[index]);
                ngivr.growl.error(message);
                //alert(message);
            }
        }
    }

    const ngivrConsole = class {

        static init() {
            this.queue= 0
        }

        static group(header) {
            /*
             if (!ngivr.config.dev) {
                 return;
             }

             */
            if (header === undefined) {
                this.queue--;
                return _console.groupEnd();
            }
            this.queue++;
            if (typeof _console.groupCollapsed !== 'undefined') {
                return apply('groupCollapsed', arguments);
            }
            apply('group', arguments);
        }

        static error() {
            while(this.queue > 0) {
                this.group();
            }
            apply('error', arguments);
        }

        static log() {
            /*
            if (!ngivr.config.dev) {
                return;
            }

             */
            apply('log', arguments);
        }

        static info() {
            /*
            if (!ngivr.config.dev) {
                return;
            }

             */
            apply('info', arguments);
        }
    };
    ngivrConsole.init();

    if (isWindow ) {
        ngivr.console = ngivrConsole;
    } else if(isModule) {
        module.exports = ngivrConsole;
    }

})();
