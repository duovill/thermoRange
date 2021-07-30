ngivr.angular.component('ngivrFormValidationDisplay', {
    bindings: {
        'ngivrForm': '<',
        'ngivrValidationDisplayScroll': '=',
    },
    templateUrl: 'components/ui/ngivr-form-validation-display.html',

    /*
    requires
    form
    label attribute ngivr-label-for=""
    attribute ng-messages attribute ngivr-ng-messages-label=""
    requires an input with attribute name
     */
    controller: function ($timeout, $scope) {
        this.$onInit = () => {
            //  console.warn(this.ngivrForm)

            //$scope.$watch
        }

        let $form;
        let postLink = false

        this.id = ngivr.nextId();
        this.validations = {}

        $scope.$watch('$ctrl.ngivrValidationDisplayScroll', (val, oldVal) => {
            //console.warn('$ctrl.ngivrValidationDisplayScroll ', val)

            if (val === true) {
                $timeout(() => {
                    document.getElementById(`${this.id}-bottom`).scrollIntoView(ngivrSettings.scrollIntoViewOptions)
                }, ngivrSettings.debounce * 2)
                this.ngivrValidationDisplayScroll = false;
            }
        })

        const $doCheckDebounced = _.debounce(() => {
            if (postLink === false) {
                return
            }
            //console.warn('doCheck')

            /*
            const errors = [];

            for(let errorType of Object.keys(this.ngivrForm.$error)) {
                for(let errorControl of this.ngivrForm.$error[errorType]) {
                //    console.warn(errorControl)
                }
            }
            */
            const validations = {};
            const labels = $form.find('[ngivr-label-for]')
            for(let label of labels) {
                const name = label.getAttribute('ngivr-label-for')
                const labelText = $(label).text()
                const msgChildren = $form.find(`[ngivr-ng-messages-label="${name}"]`).children()
                const messages = []
                msgChildren.map(e => {
                    const msgTxt = $(msgChildren[e]).text()
                    messages.push(msgTxt)
                })
//                console.log(messages)
                if (messages.length > 0) {
                    validations[name] = {
                        label: labelText,
                        messages: messages
                    }
                }
            }
            this.validations = validations

        }, ngivrSettings.debounce);

        this.$doCheck = $doCheckDebounced

        this.$postLink = () => {
            const formName = this.ngivrForm.$name;
            $form = $(`form[name="${formName}"]`)
            postLink = true;
            /*
            console.warn($form)
            */
        }

        this.display = () => {
            if (this.ngivrForm.$submitted === false) {
                return false;
            }
            if (Object.keys(this.validations).length === 0) {
                return false
            }
            return true;
        }

        const focusTimeout = {};
        this.focus = (options) => {
            const { name } = options;

            const $e = $(`[name="${name}"]`)
            $e[0].scrollIntoView(ngivrSettings.scrollIntoViewOptions)
            try {
                $e.focus()
            } catch(e) {
                console.warn('ngivrFormValidationDisplay', 'Input has no focus function.')
            }

            /*
            var viewportOffset = $e[0].getBoundingClientRect();
            // these are relative to the viewport, i.e. the window
            const $pos = $('<div></div>')
            $('body').append($pos)
            */
            const $pos = $(`[ngivr-ng-messages-label="${name}"]`)
            $pos.addClass('ngivr-form-validation-display-position')
            /*
            $pos.css({
                'top': viewportOffset.top + window.scrollY,
                'left': viewportOffset.left + window.scrollX,
                'width': viewportOffset.width,
                'height': viewportOffset.height,
              //  'zIndex': 5,
            })
            */
            //$e.css('zIndex', 100000)
            $timeout.cancel(focusTimeout[name])
            focusTimeout[name] = $timeout(() => {
                //$pos.remove();
                $pos.removeClass('ngivr-form-validation-display-position')
                //    $e.css('zIndex', 'auto')
            }, ngivrSettings.debounceWaitLong)
        }

        this.displayMessage = (opts) => {
            const { messages } = opts;

            return messages.join(', ');
        }
    }
})
