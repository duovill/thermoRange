'use strict';
ngivr.angular.service('ngivrForm', function ($state) {
    var self = this;

    self.message = {
        show: function (form, field) {
            //if (field === 'address') {
            //    console.warn('ngivrForm.message.show argumentes', arguments)
            //}
            if (typeof(form[field]) === 'undefined') {
                return true;
            }
//      var showResult = (!form.$pristine || form.$submitted) && form[field].$invalid;
            var showResult = (form.$submitted || form[field].$touched) && form[field].$invalid;
            return showResult;
        }
    };

    self.clear = function (form) {
        form.$setPristine();
        form.$setUntouched();
    };

    self.error = function (form, reponse) {
        ngivr.growl(ngivr.strings.form.error.save, 'error');

        const errors = reponse.data.error.errors || reponse.data.errors;
        if (errors === undefined || !typeof errors === 'object') {
            return false;
        }

        form.mongooseFormMessage = {};
        for (var key in errors) {
            const message = errors[key].message;
            form[key].$setValidity('ngivrValidationMongoose', false);
            form.mongooseFormMessage[key] = ngivr.strings.exception[message] || message;
        }
        return true
    };

    self.error.message = function (form, key) {
        return form.mongooseFormMessage[key] || 'hiba';
    };

    self.validate = function (form) {
        form.$setSubmitted();

        if (form.$pending === true) {
            return false;
        }
        //console.warn('ngivr-form validae', form)

        for (let key in form) {
            const control = form[key];
            if (typeof control === 'object' && control.hasOwnProperty('$modelValue')) {
                form[key].$setValidity('ngivrValidationMongoose', true);
            }
        }

        if (!form.$valid) {
            if (form.$name === 'outgoingProductForm' || form.$name === 'ticketGeneratorForm' || form.$name === 'contractGeneratorForm' || $state.current.name === 'master.partners'
                || $state.current.name === 'newContract' || $state.current.name === 'master.products' || $state.current.name === 'master.users' || $state.current.name === 'master.financialCostBearers'
                || ($state.current.name.includes('incomingInvoices.filing')) && form.$name !== 'correctionForm' || $state.current.name ==='newServiceContract'
                || form.$name === 'sweepForm' || form.$name === 'outTicketFromPossessionTransferForm' || form.$name === 'vehiclePopupForm')  {
                let fields = [];
                let errors = [];
                for (let key in form.$error) {
                    //errors.push(ngivr.strings.field[form.$error[key]]);
                    if (form.$error.hasOwnProperty(key)) {
                        for (let i in form.$error[key]) {

                            let fieldName = form.$error[key][i].$name;
                            if (fieldName !== '') {
                                if (fieldName.indexOf('_') >= 0)
                                    fieldName = form.$error[key][i].$name.substring(0, form.$error[key][i].$name.indexOf('_'));
                                errors.push(ngivr.strings.field[fieldName] || fieldName);
                                fields.push(form.$error[key][i].$$element[0].innerText)
                            }

                        }
                    }
                }
                ngivr.growl.warning('Az alábbi mezők nem, vagy rosszul lettek kitöltve:\n ' + errors.join(', \n'))
            } else if (form.$name !== 'correctionForm') {
                ngivr.growl.warning(ngivr.strings.form.error.default);
            }


            if (ngivr.config.dev) {
                ngivr.console.group('Form: ' + form.$name);
                for (var errorType in form.$error) {
                    const errors = form.$error[errorType];
                    for (var index in errors) {
                        const error = errors[index];
                        ngivr.console.log(error.$name + ': ' + errorType);
                    }
                }
                ngivr.console.group();
            }
            return false;
        }
        return true;
    }
});
