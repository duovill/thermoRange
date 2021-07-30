ngivr.angular.factory('ngivrTemplateSchemaHelper', ($filter, Common, ngivrService) => {

    let id = 0;

    const factory = function () {

        this.Math = window.Math;

        this.isNumber = angular.isNumber;

        this.writtenNumber = (number, language = 'hu') => {
            if (language === 'hu') return Common.numToText(number);
            return writtenNumber(number, {
                lang: language,
            })
        };

        this.decimalPart = (number) => {
            return Math.floor(number)
        };

        this.fraction = (number) => {
            number = String(number);
            if (!number.includes('.')) {
                return 0;
            }
            return parseFloat(`0.${number.split('.')[1]}`).toFixed(2).split('.')[1]
        };

        this.empty = (value) => {
            return value === null || value === undefined || (typeof value === 'string' && value.trim().length == 0)
        }

        this.array = {
            empty: (data) => {
                if (Array.isArray(data)) {
                    data = data.filter(function (item) {
                        return typeof item === 'string' && item.trim().length > 0;
                    });
                    return data.length === 0;
                }
                return true;
            },
        }

        this.positive = (value) => {
            return Math.abs(parseFloat(value));
        }

        this.isValueIsNegative = (value) => {
            if (parseFloat(value) < 0) {
                return true;
            }
            return false;
        }


        this.invoice = {
            totalVat: (items) => {
                if (!Array.isArray(items)) {
                    return 0;
                }
                const result = items.map(item => {
                    return this.invoice.vat(item)
                })
                const totalVatResult = _.uniqBy(result)
                return totalVatResult;
            },
            vat: (item, numberOnly = false) => {
                if (angular.isString(item.vat)) {
                    return item.vat;
                } else {
                    return numberOnly ? item.vat : item.vat // $filter('number')(item.vat, 2) Meg kell vizsgálni, biztosan jó-e, ha item.vat-ot adunk mindig vissza
                }
            },
            totalPrice: (item) => {
                return item.totalPrice
            },
            hasFAD: (items) => {
                return this.invoice.totalVat(items).includes('FAD')
            },
            /*
             <span ng-if="helper.isNumber(item.vat)">
               {{item.totalPrice * item.vat / 100 }}
              </span>
              <span ng-if="!helper.isNumber(item.vat)">
                -
              </span>

             */
            totalItemVat: (item, currency, zero = false, aligned = true) => {
                let result;
                if (!isNaN(Number(item.vat))) {
                    const vat = parseFloat((item.totalPrice * item.vat / 100).toFixed(currency === 'HUF' ? 0 : 2));
                    result = aligned ? $filter('number')(vat, 2) : vat;
                } else {
                    result = zero ? 0 : '-'
                }
                return result;
            },
            finalTotalItemVat: (items) => {
                let total = 0;
                if (!Array.isArray(items)) {
                    return 0;
                }
                items.forEach(item => {
                    total += this.invoice.totalItemVat(item, true, false)
                })
                return total;
            },
            /*
               <span ng-if="helper.isNumber(item.vat)">
               {{item.totalPrice + (item.totalPrice * item.vat / 100) }}
              </span>
              <span ng-if="!helper.isNumber(item.vat)">
                {{item.totalPrice}}
              </span>
             */

            itemTotal: (item, currency) => {
                let result;
                if (!isNaN(Number(item.vat))) {
                    result = parseFloat((item.totalPrice + (item.totalPrice * item.vat / 100)).toFixed(currency === 'HUF' ? 0 : 2))
                } else {
                    result = item.totalPrice
                }
                return result;
            },
            itemsTotal: (items, currency) => {
//        console.log(items);
                let total = 0;

                if (!Array.isArray(items)) {
                    return 0;
                }

                items.forEach(item => {
                    return total += this.invoice.itemTotal(item, currency);
                });

                return total;
            },
            finalTotal: (items, currency) => {
                let total = this.invoice.itemsTotal(items, currency);
                return total;
            },
            vatSummary: (items, property, currency) => {
                const result = items.map(item => {
                    return {
                        vat: this.invoice.vat(item),
                        totalPrice: this.invoice.totalPrice(item),
                        vatValue: this.invoice.totalItemVat(item, currency, false, false)
                    }
                });

                const accumulated = result.reduce(function (acc, val) {
                    let o = acc.filter(function (obj) {
                        return obj.vat === val.vat;
                    }).pop() || {vat: val.vat, totalPrice: 0, vatValue: 0};

                    o.totalPrice += val.totalPrice;
                    o.vatValue += isNaN(val.vatValue) ? 0 : val.vatValue;
                    acc.push(o);
                    return acc;
                }, []);

                const total = _.uniqBy(accumulated, 'vat');

                const values = total.map(a => a[property]);

                return values
            }

        };

        this.getSchemaPost = (schema) => {
            schema = ngivr.string.pascalCase(schema);
            /*
            const post = {
              OutgoingInvoice: {
                "populate": [
                  "createdBy"
                ]
              },
              DeliveryCertificate: {
                "populate": [
                  "createdBy"
                ]
              }
            }
            */
            return //post[schema] || {};
        }

        this.contract = {
            paymentDate: (contract) => {
                let paymentData = {}
                if (contract.uniquePayDate) {
                    paymentData = {
                        days: contract.uniquePayDays,
                        type: contract.uniquePayDayType === 'Naptári nap' ? 'naptári' : 'banki'

                    }
                } else {
                    switch (contract.paymentDeadline) {
                        case 'BD8':
                            paymentData = {
                                days: 8,
                                type: contract.uniquePayDayType + ' banki',
                            }
                            break
                        case 'BD5':
                            paymentData = {
                                days: 5,
                                type: contract.uniquePayDayType + ' banki',
                            }
                            break
                        case 'D3':
                            paymentData = {
                                days: 3,
                                type: contract.uniquePayDayType + ' naptári'
                            }
                            break
                        case 'D15':
                            paymentData = {
                                days: 15,
                                type: contract.uniquePayDayType + ' naptári'
                            }
                            break
                    }

                }
                return paymentData.days + ' ' + paymentData.type + ' napon'
            },
            qualityParams: (contract) => {
                const qualityParamsPdf = []
                if (!Array.isArray(contract.product)) {
                    return qualityParamsPdf
                }
                for (let param of contract.product[0].qualityParams) {
                    if (param.visible) {
                        qualityParamsPdf.push(param)
                    }
                }

                //ha contract.normalQuality === false, akkor vannak egyedi paraméterek is, ilyenkor a contract.uniqueQuality-ban szereplő értékkel kell felülírni a qualityParamsPdf megfelelő elemét

                if (contract.normalQuality === false) {
                    for (let uniqueParam of contract.uniqueQuality) {
                        for (let param of qualityParamsPdf) {
                            if (param.name === uniqueParam.name) {
                                param.value = uniqueParam.value
                                break
                            }
                        }
                    }
                }
                /*
                qualityParamsPdf[i].name
                qualityParamsPdf[i].condition (ez min vagy max
                qualityParamsPdf[i].value ez a %
                 */
                //console.warn('qualityParamsPdf', qualityParamsPdf)
                return qualityParamsPdf.filter(e => e.value !== null);
            },
        }


        this.templatePreRender = {
            'other-document-label': async (data) => {
                const response = await ngivrService.data.query({schema: 'OtherDocumentTemplate'}).query({search: {_id: data.otherDocument.templateType}});
                data.templateType = response.data.docs[0]
                return data
            },
            'hajo-osszesito': (data) => {
                data.shipPaper.loadedWeight = 0;
                data.shipPaper.unloadedWeight = 0;
                for (let orderIndex in data.shipPaper.orders) {
                    const order = data.shipPaper.orders[orderIndex];
                    data.shipPaper.orders[orderIndex].tickets.sort(function (a, b) {
                        const dateA = new Date(a.date);
                        const dateB = new Date(b.date);
                        // Compare the 2 dates
                        if (dateA < dateB) return -1;
                        if (dateA > dateB) return 1;
                        return 0;
                    });
                    data.shipPaper.orders[orderIndex].loadedWeight = 0;
                    data.shipPaper.orders[orderIndex].unloadedWeight = 0;

                    let ticketsRendered = [];

                    let currentDate;
//          let index = 0;
                    let ticketByDateLoadedWeight = 0;
                    let ticketByDateUnloadedWeight = 0;

                    const footer = (ticket) => {
//            console.log(`new ticket rendered footer  ----------------------------------------------------`)
                        ticket.preRenderLoadedWeight = ticketByDateLoadedWeight;
                        ticket.preRendereUnloadedWeight = ticketByDateUnloadedWeight;
                        ticketByDateLoadedWeight = 0;
                        ticketByDateUnloadedWeight = 0;
                        ticket.preRenderType = 'footer';
                        ticketsRendered.push(angular.copy(ticket))
                    }

                    let lastTicket;
//          console.log(`Order ----------------------------------------------------`)
                    for (let ticketIndex in data.shipPaper.orders[orderIndex].tickets) {
//            console.log(`new ticket ----------------------------------------------------`)
                        let ticket = data.shipPaper.orders[orderIndex].tickets[ticketIndex];
                        if (!angular.isNumber(ticket.loadedWeight)) {
                            data.shipPaper.orders[orderIndex].tickets[ticketIndex].loadedWeight = 0;
                        }
                        if (!angular.isNumber(ticket.unloadedWeight)) {
                            data.shipPaper.orders[orderIndex].tickets[ticketIndex].unloadedWeight = 0;
                        }
                        data.shipPaper.orders[orderIndex].tickets[ticketIndex].dateWithoutTime = new Date(data.shipPaper.orders[orderIndex].tickets[ticketIndex].date);
                        data.shipPaper.orders[orderIndex].tickets[ticketIndex].dateWithoutTime.setHours(0, 0, 0, 0);

                        data.shipPaper.orders[orderIndex].loadedWeight += data.shipPaper.orders[orderIndex].tickets[ticketIndex].loadedWeight;
                        data.shipPaper.orders[orderIndex].unloadedWeight += data.shipPaper.orders[orderIndex].tickets[ticketIndex].unloadedWeight;

//            console.log(ticket.dateWithoutTime.getTime());
                        if (ticketsRendered.length === 0 || currentDate === undefined || currentDate !== ticket.dateWithoutTime.getTime()) {
                            if (ticketsRendered.length > 0) {
                                footer(lastTicket)
                            }
//              console.log(`new ticket rendered header  ----------------------------------------------------`)
//              console.log(`ticketsRendered.length: ${ticketsRendered.length === 0}`)
//              console.log(`currentDate === undefined: ${currentDate === undefined}`)
//              console.log(`currentDate != ticket.dateWithoutTime: ${currentDate !== ticket.dateWithoutTime}`)
                            currentDate = ticket.dateWithoutTime.getTime();
                            ticket.preRenderType = 'header';
                            ticketsRendered.push(angular.copy(ticket))
                        }
//            console.log(`new ticket rendered item ----------------------------------------------------`)
                        ticket.preRenderType = 'item';
                        ticketsRendered.push(angular.copy(ticket))
//            index++;
                        ticketByDateLoadedWeight += ticket.loadedWeight;
                        ticketByDateUnloadedWeight += ticket.unloadedWeight;
//            console.log(`ticketIndex = ${ticketIndex}, data.shipPaper.orders[orderIndex].tickets.length - 1 = ${data.shipPaper.orders[orderIndex].tickets.length - 1}`)
                        if (parseInt(ticketIndex) === parseInt(data.shipPaper.orders[orderIndex].tickets.length - 1)) {
                            footer(ticket)
                        }
                        lastTicket = ticket;
                    }
                    data.shipPaper.orders[orderIndex].ticketsRendered = ticketsRendered;

                    data.shipPaper.loadedWeight += data.shipPaper.orders[orderIndex].loadedWeight;
                    data.shipPaper.unloadedWeight += data.shipPaper.orders[orderIndex].unloadedWeight;

                }
//        console.log(data);
                return data;
            },
        }

    };


    return new factory;
});

