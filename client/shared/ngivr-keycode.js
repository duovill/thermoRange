'use strict';
(() => {
  const ngivrKeycode = {
    // ROMAN ALPHA
    A: 65, B: 66, C: 67, D: 68,
    E: 69, F: 70, G: 71, H: 72,
    I: 73, J: 74, K: 75, L: 76,
    M: 77, N: 78, O: 79, P: 80,
    Q: 81, R: 82, S: 83, T: 84,
    U: 85, V: 86, W: 87, X: 88,
    Y: 89, Z: 90,

    // ARROW KEYS
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,

    //  NUMERALS
    ZERO: 48,
    ONE: 49,
    TWO: 50,
    THREE: 51,
    FOUR: 52,
    FIVE: 53,
    SIX: 54,
    SEVEN: 55,
    EIGHT: 56,
    NINE: 57,

    // NUMLOCK
    NUMLOCK_ZERO: 96,
    NUMLOCK_ONE: 97,
    NUMLOCK_TWO: 98,
    NUMLOCK_THREE: 99,
    NUMLOCK_FOUR: 100,
    NUMLOCK_FIVE: 101,
    NUMLOCK_SIX: 102,
    NUMLOCK_SEVEN: 103,
    NUMLOCK_EIGHT: 104,
    NUMLOCK_NINE: 105,
    NUMLOCK_DOT: 110,
    NUMLOCK_PLUS: 107,
    NUMLOCK_MINUS: 109,

    // PAGE
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    PAGE_END: 35,
    PAGE_HOME: 36,


    // PLUS - MINUS
    PLUS: 187,
    MINUS: 189,

    // PUNCTIONAL
    PERIOD: 46,
    DOT: 190,

    // OTHER
    TAB: 9,
    SHIFT: 16,
    ESCAPE: 27,

    RETURN: 13,
    ENTER: 13,

    ALT: 18,
    OPTION: 18,
    COMMAND: 224,
    CONTROL: 17,
    CTRL: 17,

    SPACE: 32,

    BACKSPACE: 8,
    DELETE: 46,
  };

  ngivrKeycode.isCopy = (event) => {
    if (event.ctrlKey &&
      [ ngivrKeycode.A, ngivrKeycode.V, ngivrKeycode.C, ngivrKeycode.X].includes(event.keyCode)
    ) {
      return true;
    }
    return false;
  }

  ngivrKeycode.isPaste = (event) => {
    if (event.ctrlKey &&
      [ ngivrKeycode.V].includes(event.keyCode)
    ) {
      return true;
    }
    return false;
  }

  ngivrKeycode.is = (eventOrCode, key) => {
    if (typeof eventOrCode === 'object') {
      eventOrCode = eventOrCode.keyCode;
    }
    if (typeof key === 'object' && !Array.isArray(key)) {
      key = key.keyCode;
    }
    if (!Array.isArray(key)) {
      key = [key]
    }
    return key.includes(eventOrCode);
  }

  ngivrKeycode.isModifier = (event) => {
    return ngivrKeycode.is(event, [
      ngivrKeycode.CONTROL,
      ngivrKeycode.COMMAND,
    ])
  }

  ngivrKeycode.isSelectAll = (event) => {
    return event.ctrlKey && event.keyCode === ngivrKeycode.A;
  }

  ngivrKeycode.isNumber = (eventOrCode) => {
    if (typeof eventOrCode === 'object') {
      eventOrCode = eventOrCode.keyCode;
    }
    if ((eventOrCode >= 48 && eventOrCode <= 57) || (eventOrCode >= 96 && eventOrCode <= 105)) {
      return true;
    }
    return false;
  }

  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  if (isWindow) {
    ngivr.keycode = ngivrKeycode;
  } else if (isModule) {
    module.exports = ngivrKeycode;
  }
})();

