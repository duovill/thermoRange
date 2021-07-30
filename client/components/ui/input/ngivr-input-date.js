ngivr.angular.directive('ngivrInputDate', function (ngivrService, $timeout) {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel'
        },
        link: function (scope, element, attrs, ngModel) {

            const validateDisplay = (display) => {
                if (typeof display !== 'string') {
                    return true;
                }
                const places = display.split(DIVIDER_CHAR);
                const year = places[FORMAT_PLACE.YEAR] || new Date().getFullYear();
                let month = places[FORMAT_PLACE.MONTH] || 1;
                let day = places[FORMAT_PLACE.DAY] || 1;
                const date = Array(3);
                date[FORMAT_PLACE.YEAR] = year;
                date[FORMAT_PLACE.DAY] = day;
                date[FORMAT_PLACE.MONTH] = month;

                if (date[FORMAT_PLACE.DAY] === '0') {
                    date[FORMAT_PLACE.DAY] = 1;
                }
                if (date[FORMAT_PLACE.MONTH] === '0') {
                    date[FORMAT_PLACE.MONTH] = 1;
                }

                if (year > 9999) {
                    return false
                }
                if (month > 12) {
                    return false;
                }
                if (day > 31) {
                    return false;
                }
                const result = date.join(DIVIDER_CHAR) + DIVIDER_CHAR;
                const thisValid = moment(result, FORMAT).isValid();
                return thisValid;
            }

            const validateModel = () => {
                let date = scope.display;
                if (date === undefined || date === null || String(date).trim() === '') {
                    scope.isValid = true;
                    ngModel.$setValidity('ngivrValidationDefault', scope.isValid)
                    changeModel(undefined);
                    return;
                }

                let newDate = '';
                let count = 0;


                //FIXME a padstart miatt romlott el
                date.split(DIVIDER_CHAR).forEach((char) => {
                    if (++count < 4) {
                        newDate += char + DIVIDER_CHAR
                 //       newDate += char.padStart(2, '0') + DIVIDER_CHAR;
                    }
                })

                const thisMoment = moment(newDate, FORMAT, true);
                scope.isValid = thisMoment.isValid();
                ngModel.$setValidity('ngivrValidationDefault', scope.isValid)

                if (scope.isValid) {
                    changeModel(new Date(moment(date, FORMAT).format()));
                }
            }

            const changeModel = (model) => {
                scope.model = model;
            }

            const isDisabled = () => {
                return input.is(':disabled')
            };

            // </editor-fold>

            // ***************************************
            //                  REGION
            // ***************************************

            // <editor-fold desc="init">

            const input = element.find('.ngivr-input-date');

            const DIVIDER = ngivr.keycode.DOT;
            const NUMLOCK_DOT = ngivr.keycode.NUMLOCK_DOT;
            const DIVIDER_CHAR = '.';
            const FORMAT = ngivr.strings.moment.date;
            const FORMAT_PLACE = {
                YEAR: 0,
                MONTH: 1,
                DAY: 2
            }

            let lastKey;
            let lastSelectAll = false;
            let localChange = false;

            scope.currentDisabled = isDisabled();
            scope.isValid = false;
            scope.ngivr = ngivrService;

            // </editor-fold>

            // ***************************************
            //                  REGION
            // ***************************************

            // <editor-fold desc="input event">

            input.on('click', (event) => {
                ngivr.input.focus(input[0]);
            });


            /*
            input.on('mousewheel', (event) => {
              const delta = parseInt(event.originalEvent.wheelDelta || -event.originalEvent.detail);

              const type = scope.getType(event);
              if (delta < 0) {
                scope.add(-1, type)
              } else {
                scope.add(1, type)
              }
              event.preventDefault();
              scope.$digest();
            })
            */

            input.on('paste', (e) => {
                const clipboardData = e.clipboardData || e.originalEvent.clipboardData || window.clipboardData;
                const pastedData = clipboardData.getData('text');
                if (!moment(scope.display + pastedData, FORMAT).isValid()) {
                    event.preventDefault();
                }
            })

            // </editor-fold>

            // ***************************************
            //                  REGION
            // ***************************************

            // <editor-fold desc="scope native">

            scope.$watch(isDisabled, (newValue, oldValue) => {
                scope.currentDisabled = newValue
            })


            //FIXME ez nem teljesen 100% tokeletes
            let lastNewValue = undefined
            scope.$watch('model', function (newValue, oldValue) {
               // console.warn('model change', lastNewValue, JSON.stringify(newValue) )
                if (lastNewValue !== JSON.stringify(newValue)) {
//                    console.log('format', JSON.stringify(newValue))
//                    scope.display = newValue
                        scope.format();
                }
//                console.log('lastNewValue', lastNewValue)
                lastNewValue = JSON.stringify(newValue)
            })

            scope.$watch('display', function (newValue, oldValue) {
                validateModel();

                let display = String(scope.display);

                const year = String(new Date().getFullYear());

                if (display[0] === DIVIDER_CHAR) {
                    scope.display = new Date().getFullYear() + DIVIDER_CHAR;
                    return;
                }
                if (display[1] === DIVIDER_CHAR) {
                    scope.display = year.substring(0, 3) + display[0];
                    return;
                }
                if (display[2] === DIVIDER_CHAR) {
                    scope.display = year.substring(0, 2) + display;
                    return;
                }
                if (display[3] === DIVIDER_CHAR) {
                    scope.display = year.substring(0, 1) + display;
                    return;
                }

                if (ngivr.keycode.is(lastKey, [
                    ngivr.keycode.DELETE,
                    ngivr.keycode.BACKSPACE,
                ])) {
                    return;
                }
                if (display.length === 4) {
                    scope.display = scope.display + '.';
                }
                if (display.length === 7) {
                    scope.display = scope.display + '.';
                }
                if (display.length === 10) {
                    scope.display = scope.display + '.';
                }

                if (scope.display !== undefined) scope.display = scope.display.substring(0, FORMAT.length)

                if (!validateDisplay(scope.display)) {
                    scope.display = oldValue;
                }
            });

            // </editor-fold>

            // ***************************************
            //                  REGION
            // ***************************************

            // <editor-fold desc="scope">

            scope.format = () => {
                // itt fontos == null legyen, mert kever miatt , ne legyen ===, vagy === undefined/null/'', de igy most jo
                if (scope.model == null) {
                    scope.display = undefined;
                    return;
                }
                ;
                const display = moment(new Date(scope.model)).format(FORMAT)
                scope.display = display;
                validateModel();
                if (!scope.isValid) {
                    scope.display = scope.model;
                }
                // ngivr.input.focus(input[0])
            }

            scope.today = () => {
                changeModel(new Date());
                scope.format();
            }

            scope.add = (diff, type = 'day') => {
                const ms = moment(scope.model, FORMAT);
                if (!ms.isValid()) {
                    return;
                }
                const date = new Date(ms.add(diff, type).format());
                changeModel(date);
                scope.format();
            }

            scope.getType = (event) => {
                let type = 'day';
                if (event.shiftKey) {
                    type = 'month';
                }
                if (event.ctrlKey) {
                    type = 'year';
                }
                if (event.altKey) {
                    type = 'year';
                }
                return type;
            }


            scope.key = (event) => {

                let allow = false;
                lastKey = event.keyCode;
                if (ngivr.keycode.isNumber(event) || ngivr.keycode.is(event, DIVIDER) || ngivr.keycode.is(event, NUMLOCK_DOT)) {
                    allow = true;
//          ngivr.console.log(`ngivr-input-date isNumber allow: ${allow}`)
                }


                if (scope.display === undefined) {
                    scope.display = '';
                }
                //console.log('ngivr-input-date scope.display', scope.display);
                if ((scope.display.length || '') >= FORMAT.length && !lastSelectAll) {
                    allow = false;
//          ngivr.console.log(`ngivr-input-date length allow: ${allow}`)
                }

                if (
                    ngivr.keycode.isModifier(event)
                    ||
                    ngivr.keycode.isCopy(event)
                    ||
                    ngivr.keycode.is(event, [
                        ngivr.keycode.ENTER,
                        ngivr.keycode.LEFT,
                        ngivr.keycode.RIGHT,
//            ngivr.keycode.PAGE_DOWN,
//            ngivr.keycode.PAGE_UP,
                        ngivr.keycode.UP,
                        ngivr.keycode.DOWN,
                        ngivr.keycode.NUMLOCK_PLUS,
                        ngivr.keycode.NUMLOCK_MINUS,
                        ngivr.keycode.PLUS,
                        ngivr.keycode.MINUS,
                    ])
                ) {
                    allow = true;
//          ngivr.console.log(`ngivr-input-date isModifier, isCopy, delete, backspace allow: ${allow}`)
                }

                // FIXME mas a . es a keyCode 190 es 46, pedig ugyanaz, megis mas
                // ez csak akkor kell majd ha mas formatum lesz, most nem kell, (pl angol)
                if (lastKey === DIVIDER || lastKey === NUMLOCK_DOT) {
                    if (scope.display.charAt(scope.display.length - 2) === DIVIDER_CHAR) {
                        const last = scope.display.charAt(scope.display.length - 1);
                        scope.display = scope.display.substring(0, scope.display.length - 2) + `${DIVIDER_CHAR}0` + last;
                        allow = false;
//            ngivr.console.log(`ngivr-input-date pont volt elotte, allow: ${allow}`)
                    }
                    if (scope.display.endsWith(DIVIDER_CHAR)) {
                        allow = false;
//            ngivr.console.log(`ngivr-input-date ponttal vege, allow: ${allow}`)
                    }
                }

                if (ngivr.keycode.is(event, [
                        ngivr.keycode.BACKSPACE,
                        ngivr.keycode.DELETE,
                    ])
                    &&
                    scope.display.length > 0
                ) {
                    if (lastSelectAll) {
                        scope.display = ''
                    } else {
                        scope.display = scope.display.substring(0, scope.display.length - 1)
                    }
                }

                if (!allow) {
                    ngivr.input.focus(input[0]);
                    event.preventDefault();
                    return;
                }

                lastSelectAll = ngivr.keycode.isSelectAll(event);

                if (scope.isValid && String(scope.display).length > 0) {
                    const type = scope.getType(event);
                    switch (event.keyCode) {

                        case ngivr.keycode.UP:
//            case ngivr.keycode.PAGE_UP:
                        case ngivr.keycode.NUMLOCK_PLUS:
                        case ngivr.keycode.PLUS:
                            scope.add(1, type)
                            break;

//            case ngivr.keycode.PAGE_DOWN:
                        case ngivr.keycode.DOWN:
                        case ngivr.keycode.NUMLOCK_MINUS:
                        case ngivr.keycode.MINUS:
                            scope.add(-1, type)
                            break;
                    }
                }
                if (!lastSelectAll) {
                    ngivr.input.focus(input[0]);
                }

            }

            // </editor-fold>

        },
        templateUrl: 'components/ui/input/ngivr-input-date.html',
    }
});
