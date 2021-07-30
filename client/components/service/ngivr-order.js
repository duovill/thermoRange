'use strict';
ngivr.angular.factory('ngivrOrder', (Common) => {

    return {

        /**
         * Diszponálható mennyiséget kalkulálja
         * @param contract
         * @param min
         * @param id
         * @param orderPerformed
         * @returns {number}
         */
        calculateFreeToDispo: (contract, min, id, orderPerformed) => {
            if (contract && contract.closed) {
                return 0
            }
            let reserved = 0;
            let edge = 0;
            if (contract) {
                let remain;
                if (contract.remain !== undefined) remain = contract.remain;
                if (contract.contractRemain !== undefined) remain = contract.contractRemain;
                //let remain = contract.remain === 0 ? 0 || contract.contractRemain;
                if (remain >= 0) {
                    if (contract && contract.reserved) {


                        if (Common.isIterable(contract.reserved.orders)) {
                            for (let order of contract.reserved.orders) {
                                if (order.orderId !== id) {
                                    reserved += order.weight
                                }

                            }
                        }


                        if (Common.isIterable(contract.reserved.plans)) {
                            for (let plan of contract.reserved.plans) {
                                reserved += plan.weight
                            }
                        }


                        if (Common.isIterable(contract.reserved.possessionTransfers)) {
                            for (let possessionTransfer of contract.reserved.possessionTransfers) {
                                reserved += possessionTransfer.weight
                            }
                        }


                        if (Common.isIterable(contract.reserved.cargoPlans)) {
                            for (let cargoPlan of contract.reserved.cargoPlans) {
                                if (cargoPlan.cargoPlanId !== id) {
                                    reserved += cargoPlan.weight
                                }

                            }
                        }

                        if (Common.isIterable(contract.reserved.import)) {
                            for (let elem of contract.reserved.import) {

                                    reserved += elem.weight


                            }
                        }
                    }

                } else {

                    let performed = contract.quantity - remain;
                    reserved += performed;
                    if (orderPerformed) {
                        reserved -= orderPerformed
                    }
                }

                if (min) {
                    edge = contract.quantity - contract.quantity * contract.percentMinusValue / 100
                } else {
                    edge = contract.quantity + contract.quantity * contract.percentPlusValue / 100
                }
                return parseFloat((edge - reserved).toFixed(3));
            }
        }
    }
});
