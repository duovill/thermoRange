'use strict';
(() => {
    const ngivrGrowl = function (notification = "", type, sticky = "false", theme = "ngivr") {
        if (notification === undefined || notification === '') {
            return;
        }
        if (type === 'error') {
            console.error(notification);
            if (typeof notification === 'string') {
                try {
                    notification = JSON.parse(notification)
                } catch(e) {
                   // console.error(e);
                }
            }
            if (notification instanceof Error || notification.hasOwnProperty('message')) {
                if (notification.hasOwnProperty('ngivrErrorHandled')) {
                    return;
                }
                notification.ngivrErrorHandled = true;
                notification = notification.message;
            } else if (typeof(notification) === 'object') {
                if (notification.hasOwnProperty('data')) {
                    if (notification.data.name === 'UnauthorizedError') {
                        return;
                    }
                    notification = notification.data;
                }
                if (notification.hasOwnProperty('message')) {
                    notification = notification.message;
                } else {
                    notification = ngivr.json.stringify(notification);
                }
            }
        }
//        console.log('ngivr-growl sticky?', sticky)

        let icon;
        switch (type) {
            case 'error':
                icon = 'fa-exclamation-triangle';
                theme = 'ngivr-growl-error';
                break;
            case 'warning':
                icon = 'fa-exclamation-circle';
                theme = 'ngivr-growl-warning';
                break;
            default:
                icon = 'fa-info-circle';
                break;
        }
        ngivr.console.info(notification)
        $.jGrowl({
            glue: 'before',
            theme: theme,
            themeState: 'ngivr',
            group: type,
            sticky: sticky,
            life: ngivr.settings.growlLife,
            message: `
<div style="display: flex; flex-direction: row;" title="${htmlEncode(notification)}">
  <div style="margin-right: 10px; margin-top: 2px;">
    <i style="font-size: 2em;" class="fa ${icon}"></i>
   </div>
  <div style="overflow: hidden; text-overflow: ellipsis;" >
    ${notification}
  </div>
</div>
`
        });
    };

    window.alert = function(message) {
        ngivrGrowl(message, 'info', true )
    };

    ngivrGrowl.error = function (notification, sticky) {
        this(notification, 'error', sticky);
    };
    ngivrGrowl.warning = function (notification, sticky) {
        this(notification, 'warning', sticky);
    };

    ngivrGrowl.info = function (notification, sticky) {
        this(notification, 'info', sticky);
    };
    const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
    const isWindow = typeof(window) !== 'undefined';

    if (isWindow) {
        ngivr.growl = ngivrGrowl;
    }

})();
