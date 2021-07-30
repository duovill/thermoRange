const NgivrPopupGenerateContractPopupController = function ($http, ngivrConfirm, Common, Auth, $scope, $filter, $mdDialog, ngModel, ngivrGrowl, ngivrService, $mdMedia, ngivrApi, ngivrLock) {
    const start = async () => {


        $scope.ngivr = ngivrService;
        $scope.optionContract = ngModel;
        $scope.$mdMedia = $mdMedia;
        $scope.contracts = [];

        $scope.lock = ngivrLock({
            scope: $scope,
            resource: `contract:${$scope.optionContract._id}`,
            schema: 'contract',
            //watchEditing: 'isUpdateWeightEdit',
            scopeDecorator: {
                onAutoUnlockOrError: {
                    cancelFunction: async () => await $scope.answer()
                },

                unlock: {
                    functionName: ['cancel', 'hide'],
                }
            }
        });
        $scope.lock.lock();

        /**
         * Előkészítjük az új contractokat
         */
        for (let i = 0; i < $scope.optionContract.optionItems.length; i++) {
            let contract = angular.copy($scope.optionContract);
            delete contract._id;
            delete contract.__v;
            delete contract.createdAt;
            delete contract.updatedAt;
            if ($scope.optionContract.optionItems[i].optionQualitys.length) {
                contract.uniqueQuality = $scope.optionContract.optionItems[i].optionQualitys
            }
            contract.normal = true;
            contract.preContract = false;
            contract.product = [$scope.optionContract.optionProducts[i]];
            contract.price = $scope.optionContract.optionItems[i].price;
            contract.quantity = undefined;
            contract.sumPrice = undefined;
            contract.remain = undefined;
            contract.history = [];
            if (contract.prePaid) {
                contract.beforeTransportDetails = []
            }
            if (contract.deposit) {
                contract.depositSum = 0;
            }
            $scope.contracts.push(contract);
        }

        $scope.actualRemain = $scope.optionContract.remain;
        if ($scope.optionContract.prePaid) {
            let actualBeforeTransport = 0;
            for (let beforeTransport of $scope.optionContract.beforeTransportDetails) {
                actualBeforeTransport += beforeTransport.sum
            }
            $scope.origBeforeTransport = actualBeforeTransport;
            $scope.actualBeforeTransport = actualBeforeTransport
        }
        if ($scope.optionContract.deposit) {
            if ($scope.optionContract.depositSumRemain !== undefined) {
                $scope.actualDeposit = $scope.optionContract.depositSumRemain
            } else {
                $scope.actualDeposit = $scope.optionContract.depositSum
            }

        }


        /**
         * Szerződésenkénti maximális mennyiség beállítása
         */
        $scope.defineMaxQuantity = () => {
            for (let i in $scope.contracts) {
                Object.defineProperty($scope.contracts[i], 'maxQuantity', {
                    configurable: true,
                    enumerable: true,
                    get: () => {
                        let v = 0;
                        for (let j in $scope.contracts) {
                            if (j !== i && $scope.contracts[j].quantity !== undefined) {
                                v += $scope.contracts[j].quantity
                            }
                        }
                        if ($scope.optionContract.remain - v >= $scope.contracts[i].quantity) {
                            $scope.contractGeneratorForm['quantity_' + i].$setValidity('wrongNumber', true);
                        }
                        return $scope.optionContract.remain - v
                    },
                    set: (value) => {
                    }
                });
            }
        };

        $scope.defineMaxQuantity();

        /**
         * Szerződésenkénti maximális előleg beállítása
         */
        $scope.defineMaxDeposit = () => {
            for (let i in $scope.contracts) {
                Object.defineProperty($scope.contracts[i], 'maxDeposit', {
                    configurable: true,
                    enumerable: true,
                    get: () => {
                        let v = 0;
                        for (let j in $scope.contracts) {
                            if (j !== i && $scope.contracts[j].depositSum !== undefined) {
                                v += $scope.contracts[j].depositSum
                            }
                        }

                        return $scope.optionContract.depositSum - v
                    },
                    set: (value) => {
                    }
                });
            }
        };

        $scope.defineMaxDeposit();

        /**
         * Szerződésenként és előre fizetésenként a maximális összeg beállítása
         */
        $scope.defineMaxBeforeTransportSum = () => {
            for (let i in $scope.contracts) {
                if ($scope.contracts[i].prePaid) {
                    //let maxBeforeInContract = $scope.contracts[i].sumPrice;
                    for (let j in $scope.contracts[i].beforeTransportDetails) {
                        if ($scope.contracts[i].beforeTransportDetails[j].maxSum === undefined) {
                            Object.defineProperty($scope.contracts[i].beforeTransportDetails[j], 'maxSum', {
                                configurable: true,
                                enumerable: true,
                                get: () => {
                                    let v = 0;
                                    let maxBeforeInContract;
                                    for (let k in $scope.contracts) {
                                        maxBeforeInContract = $scope.contracts[i].sumPrice;
                                        if (k === i) {
                                            for (let l in $scope.contracts[k].beforeTransportDetails) {
                                                if ((l !== j) && $scope.contracts[k].beforeTransportDetails[l].sum !== undefined) {
                                                    v += $scope.contracts[k].beforeTransportDetails[l].sum
                                                }
                                            }
                                        }
                                    }
                                    //let maxBeforeInOptionContract = $scope.contracts[i].sumPrice - v;
                                    return maxBeforeInContract - v
                                    //return maxBeforeInOptionContract > maxBeforeInContract ? maxBeforeInContract : maxBeforeInOptionContract
                                },
                                set: (value) => {
                                }
                            });
                        }
                    }
                }
            }
        };

        /**
         * Paritás megjelenítése az kapcsolódó szerződés adataiban
         * @returns {string}
         */
        $scope.getParityPlaces = (content) => {
            let string = '';
            for (let i in content.parityPlaces) {
                string += content.parityPlaces[i].name + (i < content.parityPlaces.length - 1 ? ', ' : '')
            }
            return string
        };

        /**
         * Egyedi min. paraméter hozzáadása
         * @param contract
         */
        $scope.addParam = (contract) => {
            if (contract.uniqueQuality[0] && contract.uniqueQuality[0].value === null) {
                contract.uniqueQuality[0] = {name: '', value: undefined}
            } else {
                contract.uniqueQuality.push({name: '', value: undefined})
            }
        };

        /**
         * Egyedi min. paraméter törlése
         * @param contract
         * @param idx
         */
        $scope.removeParam = (contract, idx) => {
            contract.uniqueQuality.splice(idx, 1)
        };

        /**
         * Szerződés hozzáadása
         */
        $scope.addContract = () => {
            let contract = angular.copy($scope.optionContract);
            delete contract._id;
            delete contract.__v;
            delete contract.createdAt;
            delete contract.updatedAt;
            contract.normal = true;
            contract.preContract = false;
            contract.product = [undefined];
            contract.price = undefined;
            contract.quantity = undefined;
            contract.sumPrice = undefined;
            contract.remain = undefined;
            $scope.contracts.push(contract)
            $scope.defineMaxQuantity()
        };

        /**
         * Szerződés törlése
         * @param idx
         */
        $scope.removeContract = (idx) => {
            $scope.contracts.splice(idx, 1);
            $scope.calculateSumPrice();
            $scope.defineMaxQuantity()
        };

        /**
         * Végösszeg kalkulációja
         */
        $scope.calculateSumPrice = function (idx, field, value) {
            if (idx !== undefined) {
                if (field === 'quantity_' + idx) {
                    $scope.contracts[idx].sumPrice = value * $scope.contracts[idx].price;
                    $scope.contracts[idx].sumPrice = parseFloat($scope.contracts[idx].sumPrice.toFixed(2));
                } else {
                    $scope.contracts[idx].sumPrice = $scope.contracts[idx].quantity * value;
                    $scope.contracts[idx].sumPrice = parseFloat($scope.contracts[idx].sumPrice.toFixed(2));
                }
            }
            $scope.actualRemain = $scope.optionContract.remain;
            for (let i in $scope.contracts) {
                if (i == idx && field === 'quantity_' + idx) {
                    $scope.actualRemain -= value
                } else if ($scope.contracts[i].quantity !== undefined) {
                    $scope.actualRemain -= $scope.contracts[i].quantity
                }
            }

            //$scope.calculateBeforeTransport({idx: null, field: field, contractIdx: idx});
            //$scope.calculateAfterTransport(true);
        };

        /**
         * Új contractok generálása
         */
        $scope.generateContract = async () => {
            if (!$scope.ngivr.form.validate($scope.contractGeneratorForm)) {
                throw new Error("Sikertelen form validáció");
            } else {
                try {
                    await ngivrConfirm('Biztosan menti a szerződéseket?', undefined, undefined, undefined, true);
                } catch (e) {
                    return
                }
                let deposits = 0;
                if ($scope.optionContract.deposit) {

                    for (let contract of $scope.contracts) {

                        if (contract.depositSum !== undefined) {
                            deposits += contract.depositSum
                        }
                    }
                    if ($scope.actualRemain === 0 && deposits !== $scope.optionContract.depositSum) {
                        ngivr.growl(`Ha az összes mennyiség fel van osztva, akkor az eredeti szerződésen meghatározott összes előleget fel kell használni! Még felosztatlan előleg: ${$filter('currency')($scope.optionContract.depositSum - deposits, $scope.optionContract.currency, 2)} `, 'error')
                        throw new Error("Felosztási hiba");
                    }
                }
                let contractCounter = 0;
                let subNumber = 1;
                if ($scope.optionContract.generatedContracts && $scope.optionContract.generatedContracts.length) {
                    subNumber = $scope.optionContract.generatedContracts.length + 1
                }
                for (let contract of $scope.contracts) {
                    if (contract.quantity !== undefined) {
                        contract.parentContract = {
                            contractId: $scope.optionContract._id,
                            contractNumber: $scope.optionContract.contractNumber
                        };
                        contract.contractNumber = $scope.optionContract.contractNumber + '/' + subNumber;
                        if (contract.currency === 'HUF') {
                            contract.eurPrice = contract.sumPrice / contract.swapQuote
                        } else {
                            contract.eurPrice = contract.sumPrice
                        }
                        if (contract.deposit && !contract.depositSum) {
                            contract.deposit = false;
                            contract.depositSum = null;
                            contract.depositDate = undefined
                        }
                        subNumber++;
                        contract.remain = contract.quantity;
                        contract.history.push({
                            date: new Date(),
                            by: Auth.getCurrentUser().fullName,
                            event: `Szerződés generálva a(z) ${$scope.optionContract.contractNumber} számú opciós szerződésből`
                        });
                        let updated = await ngivrApi.save('contract', contract);
                        if (!$scope.optionContract.generatedContracts) {
                            $scope.optionContract.generatedContracts = []
                        }
                        $scope.optionContract.generatedContracts.push({
                            contractId: updated.data.doc._id,
                            contractNumber: updated.data.doc.contractNumber
                        });
                        contractCounter++
                    }
                }
                $scope.optionContract.remain = $scope.actualRemain;
                if ($scope.actualDeposit !== undefined) {
                    $scope.optionContract.depositSumRemain = $scope.actualDeposit - deposits;
                }

                await ngivrApi.save('contract', $scope.optionContract);
                ngivr.growl(`${contractCounter} új szerződés sikeres létrehozva.`);
                $scope.hide()
            }
        };

        /**
         * Előrefizetés összegét/százalékát kalkulálja
         * options: idx (az előrefizetés tömb indexe), field, value, contractIdx
         * @param options
         */
        $scope.calculateBeforeTransport = function (options) {
            let {idx, field, value, contractIdx} = options;
            let percent = false;
            if (field && field.includes('percent')) {
                percent = true;
            }
            // if (percent === null) {
            //     percent = false;
            // }

            if (idx === null) {
                idx = -1;
            }
            let sumPre = 0;
            if (percent === true && idx === undefined) {
                for (let i = 0, count = $scope.contracts[contractIdx].beforeTransportDetails.length; i < count; ++i) {

                    $scope.contracts[contractIdx].beforeTransportDetails[i].sum = ($scope.contracts[contractIdx].sumPrice * (i === idx ? value : $scope.contracts[contractIdx].beforeTransportDetails[i].percent)) / 100;
                    $scope.contracts[contractIdx].beforeTransportDetails[i].sum = parseFloat($scope.contracts[contractIdx].beforeTransportDetails[i].sum.toFixed(2));
                    sumPre += $scope.contracts[contractIdx].beforeTransportDetails[i].sum;
                }
            } else {

                for (let i = 0, count = $scope.contracts[contractIdx].beforeTransportDetails.length; i < count; ++i) {
                    if (percent === true) {
                        if (idx === i) {
                            $scope.contracts[contractIdx].beforeTransportDetails[i].sum = ($scope.contracts[contractIdx].sumPrice * value) / 100;
                        } else {
                            $scope.contracts[contractIdx].beforeTransportDetails[i].sum = ($scope.contracts[contractIdx].sumPrice * $scope.contracts[contractIdx].percent) / 100;
                        }

                    } else {
                        let p;
                        // if (idx === i) {
                        //     p = parseFloat(((value * 100) / $scope.contracts[contractIdx].sumPrice).toFixed(4));
                        //     if (p < 0) {
                        //         $scope.contracts[contractIdx].beforeTransportDetails[i].percent = null
                        //     } else if (p < 0.001 && p >= 0) {
                        //         $scope.contracts[contractIdx].beforeTransportDetails[i].percent = parseFloat(((value * 100) / $scope.contracts[contractIdx].sumPrice).toFixed(4))
                        //     } else if (p >= 0.001 && p < 0.01) {
                        //         $scope.contracts[contractIdx].beforeTransportDetails[i].percent = parseFloat(((value * 100) / $scope.contracts[contractIdx].sumPrice).toFixed(3))
                        //     } else {
                        //         $scope.contracts[contractIdx].beforeTransportDetails[i].percent = parseFloat(((value * 100) / $scope.contracts[contractIdx].sumPrice).toFixed(2))
                        //     }
                        // } else {
                        p = parseFloat((((i === idx ? value : $scope.contracts[contractIdx].beforeTransportDetails[i].sum) * 100) / $scope.contracts[contractIdx].sumPrice).toFixed(4));
                        if (p < 0) {
                            $scope.contracts[contractIdx].beforeTransportDetails[i].percent = null
                        } else if (p < 0.001 && p >= 0) {
                            $scope.contracts[contractIdx].beforeTransportDetails[i].percent = parseFloat(p.toFixed(4))
                        } else if (p >= 0.001 && p < 0.01) {
                            $scope.contracts[contractIdx].beforeTransportDetails[i].percent = parseFloat(p.toFixed(3))
                        } else {
                            $scope.contracts[contractIdx].beforeTransportDetails[i].percent = parseFloat(p.toFixed(2))
                        }
                        // }

                        // if (p < 0) {
                        //     $scope.contracts[contractIdx].beforeTransportDetails[i].percent = null
                        // } else if (p < 0.001 && p >= 0) {
                        //     $scope.contracts[contractIdx].beforeTransportDetails[i].percent = parseFloat((($scope.contracts[contractIdx].beforeTransportDetails[i].sum * 100) / $scope.contracts[contractIdx].sumPrice).toFixed(4))
                        // } else if (p >= 0.001 && p < 0.01) {
                        //     $scope.contracts[contractIdx].beforeTransportDetails[i].percent = parseFloat((($scope.contracts[contractIdx].beforeTransportDetails[i].sum * 100) / $scope.contracts[contractIdx].sumPrice).toFixed(3))
                        // } else {
                        //     $scope.contracts[contractIdx].beforeTransportDetails[i].percent = parseFloat((($scope.contracts[contractIdx].beforeTransportDetails[i].sum * 100) / $scope.contracts[contractIdx].sumPrice).toFixed(2))
                        // }
                        // if (idx === i) {
                        //     sumPre += value;
                        // } else {
                    }

                    if (idx === i && !percent) {
                        sumPre += value
                    } else {
                        if ($scope.contracts[contractIdx].beforeTransportDetails[i].sum !== undefined) {
                            sumPre += $scope.contracts[contractIdx].beforeTransportDetails[i].sum;
                        }
                    }

                    // }
                    // if ($scope.contracts[contractIdx].beforeTransportDetails[i].sum !== undefined) {
                    //     sumPre += $scope.contracts[contractIdx].beforeTransportDetails[i].sum;
                    // }

                }
            }
            $scope.contracts[contractIdx].sumAfter = $scope.contracts[contractIdx].sumPrice - sumPre;
            // for (let i in $scope.contracts) {
            //     if (!(i == contractIdx)) {
            //         for (let j in $scope.contracts[i].beforeTransportDetails) {
            //             if ($scope.contracts[i].beforeTransportDetails[j].sum !== undefined) {
            //                 sumPre += $scope.contracts[i].beforeTransportDetails[j].sum
            //             }
            //         }
            //     }
            // }
            //
            // $scope.actualBeforeTransport = $scope.origBeforeTransport - sumPre;
        };

        /**
         * Előrefizetés hozzáadása
         */
        $scope.addBeforeTransport = (contract) => {
            contract.beforeTransportDetails.push({
                sum: undefined,
                percent: undefined,
                date: undefined,
                beforeTransport: false
            });
            $scope.defineMaxBeforeTransportSum()
        };

        /**
         * Előrefizetés törlése
         */
        $scope.removeBeforeTransport = (contract, idx, contractIdx) => {
            contract.beforeTransportDetails.splice(idx, 1);
            $scope.calculateBeforeTransport({idx: null, contractIdx: contractIdx, field: ''});
            //TODO Előrefizetés törlésénél újra kell kalkulálni!!!!
        };

        $scope.hide = function () {
            $mdDialog.hide();
        };

        $scope.cancel = function () {
            $mdDialog.hide();
        };

        $scope.answer = function () {
            $mdDialog.hide();
        };


    };
    start();
};
NgivrPopupGenerateContractPopupController.$inject = ['$http', 'ngivrConfirm', 'Common', 'Auth', '$scope', '$filter', '$mdDialog', 'ngModel', 'ngivrGrowl', 'ngivrService', '$mdMedia', 'ngivrApi', 'ngivrLock'];
