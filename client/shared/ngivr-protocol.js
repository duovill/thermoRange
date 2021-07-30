'use strict';
(() => {

  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  let ngivrSettings;
  if (isWindow) {
    ngivrSettings = ngivr.settings;
  } else {
    ngivrSettings = require('../shared/ngivr-settings');
  }

  const ngivrSocketProtocol = class {
    static wrap(data) {
      const result = {};
      result[ngivrSettings.socket.protocol.name] = ngivrSettings.socket.protocol.version['1'];
      result.data = data;

      // if (data.hasOwnProperty('event'))
      // {
      //   ngivr.growl(data.event, 'info');
      // }

      return result;
    };

    static unwrap() {

    };
  }

  if (isModule) {
    module.exports = ngivrSocketProtocol;
  } else {
    ngivr.strings.protocol = ngivrSocketProtocol;
  }
})();

