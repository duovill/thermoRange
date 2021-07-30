'use strict';
/**
 * It is the major ngivr object.
 *
 * @type {object}
 */
if (!Date.prototype.addHours) {
    Date.prototype.addHours = function (h) {
        this.setTime(this.getTime() + (h * 60 * 60 * 1000));
        return this;
    };
}
if (!Date.prototype.toLocalISOString) {
    (function () {

        function pad(number) {
            if (number < 10) {
                return '0' + number;
            }
            return number;
        }

        Date.prototype.toLocalISOString = function () {
            return this.getFullYear() +
                '-' + pad(this.getMonth() + 1) +
                '-' + pad(this.getDate()) +
                'T' + pad(this.getHours()) +
                ':' + pad(this.getMinutes()) +
                ':' + pad(this.getSeconds()) +
                '.' + (this.getMilliseconds() / 1000).toFixed(3).slice(2, 5) +
                'Z';
        };

    }());
}

String.prototype.reverse = function () {
    return this.split('').reverse().join('')
};

if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length !== array.length)
        return false;

    for (let i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] !== array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

const ngivr = {
    settings: ngivrSettings,
    $timeout: undefined,
    currentId: 0,
    currentTime: Date.now(),

    nextId: () => {
        const now = Date.now();
        if (ngivr.currentTime !== now) {
            ngivr.currentId = 0;
            ngivr.currentTime = now
        }
        const comingId = ++ngivr.currentId;

//      console.trace();
        const randomHex = ngivr.random().reverse().padStart(15, '0');

        const timeHex = ngivr.currentTime.toString(16).padStart(12, '0').reverse()

        const comingIdHex = comingId.toString(16).padStart(3, '0').reverse();

//        console.log(randomHex)
//        console.log(timeHex)
//        console.log(comingIdHex)

        const newId = `NGIVRID${timeHex}${comingIdHex}${randomHex}`;
//        console.log('ngivr.nextId() generated new id:', newId);

        return newId
    },

    isElectron() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf(' electron/') > -1) {
            // alert('electron')
            return true
        }
        // alert('not electron')
        return false
    },

    boot() {

        moment.locale(ngivrSettings.currentTranslation);

        ngivr.strings = ngivr.translate[ngivrSettings.currentTranslation];

        tinyMCE.baseURL = '/bower_components/tinymce';

        if (typeof(window.karmaHack) === 'undefined') {
            $.jGrowl.defaults.closerTemplate = '<div style="text-transform: uppercase !important; border-radius: 0 !important; text-align: right; font-size: 12px !im">' + ngivr.strings.button.close + '&nbsp; ×<span style="display: inline-block; margin-right: 10px;"></span></div>';
            $.jGrowl.defaults.position = 'top-right';
        }

        // html is constructed
        $(() => {
            if (location.hostname === 'localhost') {
                $('head').append('<script type="text/javascript" src="http://localhost:36731/livereload.js"></script>');
            }
        });

        const disableInputNumberWheel = function (e) {
            e.preventDefault()
            const $this = $(this)
            $this.blur();
            //console.log('wheel', $this)
            setTimeout(() => $this.focus(), 10)
        }

        $(document).on("wheel", "input[type=number]", disableInputNumberWheel);

        $(document).on("mousewheel", "input[type=number]", disableInputNumberWheel);
    },

    random() {
        return (Math.floor(Math.random() * (99999999999999999 - 10000000000000000)) + 10000000000000000).toString(16)
    },

    /**
     * Lazy evulation.
     * @returns {object}
     */
    get config() {
        if (this._config === undefined) {
            /**
             * generate config
             */
            const {search} = new URL(window.location.href);
            let debug = search === '?debug';
            if (debug) {
                Cookies.set('debug', true);
            } else {
                debug = Cookies.get('debug');
            }

            if (debug) {
                console.log('DEBUG: true');
            }

            const md = new MobileDetect(window.navigator.userAgent);
            const isMobile = md.mobile() !== undefined && md.mobile() !== null;
            let devHost = false
            for(let devHostName of ngivrSettings.hosts.dev) {
                if(location.hostname.startsWith(devHostName)) {
                    devHost = true
                    break;
                }
            }
            this._config = {
                mobile: isMobile,
                local: location.hostname === 'localhost',
                dev: debug || devHost
            }

        }
        return this._config;
    },
    get redisEnv() {
        return ngivr.config.dev ? 'dev' : 'prod';
    },
    electron: {
        weighingHouse: {
            action: (ifaceData) => {
                console.log('ngivr.electron.weighingHouse.action() with data as:', ifaceData)
//                ngivr.electron.bootData = json;
            }
        },
        arabesque: {
            currentSettings: {
                status: 'undefined',
                action: 'undefined',
            },
            action: (ifaceData) => {
                ngivr.electron.arabesque.currentSettings = ifaceData;
                if (ngivr.electron.arabesque.injectorInterface === undefined) {
                    console.log(`electron arabesque injector interface has not ran ... waiting for angular ...`)
                } else {
                    ngivr.electron.arabesque.injectorInterface.update(ifaceData);
                }
            }
        }
    },

    angular: undefined,
    strings: undefined,

    state: {
        referrer: {}
    },

    /**
     * Module Mocks for using IntelliSense
     */
    api: {
        test: {},
        htmlTemplate: {
            controller: {},
            model: {}
        },
        financialDocument: {
            model: {}
        }
    },
    template: {},
    decorator: {},
    model: {},
    component: {
        form: {}
    },
    view: {
        htmlTemplate: {}
    },
    list: {},
    form: {},
    socket: {
        lock: {}
    },
    service: {},
    translate: {},
    functional: undefined,
};
