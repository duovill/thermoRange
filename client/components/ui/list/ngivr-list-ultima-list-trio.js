/**
 * Created by Kovács Marcell on 2017.05.10..
 */
'use strict';
ngivr.angular.directive('ngivrListUltimaListTrio', ($http, $filter, socket, ngivrService, ngivrEkaer, ngivrSocketLock, Auth, ngivrGrowl, Common, ngivrPrompt, ngivrConfirm, ngivrApi, ngivrTicketValidation) => {
  return {
    restrict: 'E',
    scope: {
      ngivrQuery: '=',
    },
    controllerAs: '$ctrl',
    templateUrl: 'components/ui/list/ngivr-list-ultima-list-trio.html',
    controller: class {

      constructor($scope, $timeout) {
        this.$scope = $scope;

        $scope.$on(ngivr.settings.event.client.list.loaded, (data) => {
          for (let doc of data.targetScope.query.docs) {
            doc.loadDate = $filter('date')(doc.loadDate, 'yyyy.MM.dd');
            doc.arrivalDate = $filter('date')(doc.arrivalDate, 'yyyy.MM.dd');
            doc.loadedWeightFormatted = $filter('number')(doc.loadedWeight, 3);
            doc.unloadedWeightFormatted = $filter('number')(doc.unloadedWeight, 3)
            doc.order = $scope.getOrder(doc.orderId);
            doc.has2Ticket = false;
            doc.noTicket = false;

            if (doc.inTicket)
            {
              doc.ticket = $scope.getTicketBySubTicket(doc.inTicket);
              doc.contract = $scope.getContractByTicket(doc.inTicket);
            }

            if (doc.outTicket)
            {
              if (!doc.inTicket) {
                doc.ticket = $scope.getTicketBySubTicket(doc.outTicket);
              }
              else {
                doc.has2Ticket = true;
                doc.ticket2 = $scope.getTicketBySubTicket(doc.outTicket);
                doc.contract2 = $scope.getContractByTicket(doc.outTicket);
              }
            }

            if (!doc.inTicket && !doc.outTicket) {
              doc.contract = $scope.getContractByOrder(doc.order.contractId);
              doc.noTicket = true;
            }
          }
        });

        $scope.prepareListData = async ()=> {
          $scope.orders = (await ngivrApi.query('order', {search: {deleted: false}})).data.docs;
          //$scope.cargoPlans = (await ngivrApi.query('cargoPlan', {search: {deleted: false}})).data.docs;
          $scope.contracts = (await ngivrApi.query('contract')).data.docs;
          $scope.tickets = (await ngivrApi.query('ticket', {search: {deleted: false}})).data.docs;
        }
        $scope.prepareListData();

        $scope.getOrder = function(orderId) {
            return $scope.orders.filter(function (obj) {
              return obj._id == orderId;
            })[0];
        }

        $scope.getContractByTicket = function(ticketName) {
          for (let ticket of $scope.tickets) {
            for (let ledger of ticket.ledger) {
              if (ledger.subTicketName == ticketName) {
                for (let contract of $scope.contracts) {
                  if (contract._id == ledger.contractId) {
                    return contract;
                  }
                }
              }
            }
          }
        }

        $scope.getContractByOrder = function(contractId) {
          return $scope.contracts.filter(function (obj) {
            return obj._id == contractId;
          })[0];
        }

        $scope.getTicket = function(ticketName) {
          return $scope.tickets.filter(function (obj) {
            return obj.ticketName == ticketName;
          })[0];
        }

        $scope.getTicketBySubTicket = function(ticketName) {
          for (let ticket of $scope.tickets) {
            for (let ledger of ticket.ledger) {
              if (ledger.subTicketName == ticketName) {
                return ticket;
              }
            }
          }
        }

        /*EXCEL export előkészítése*/
        //listaadatok kiegészítése (mert az ngivr-list nem tud aggregált lekérdezést)
        $scope.preparedData=[];
        $scope.columns=[];
        $scope.headers=[];
        $scope.prepareData=async ($event)=>{
            $scope.preparedData=[];
            $scope.columns=[];
            $scope.headers=[];
            let orderIds =[];
            //kigyűjti az orderIs-ket és lemásolja a dokumentumot, mert mezőket adunk hozzá
            for (let doc of $scope.selected) {
                orderIds.push(doc.orderId);
                $scope.preparedData.push(JSON.parse(JSON.stringify(doc)));
            }
            //egyben lekérdezi az összes kiválasztotthoz tartozó ordert
            let orderData = await ngivrApi.query('order', {search:{_id:{$in:orderIds}},limit:orderIds.length});
            //összepárosítjuk a tételeket az orderrel
            for (let doc of $scope.preparedData) {
                //új mezők
                for (let order of orderData.data.docs){
                    if (order._id===doc.orderId) {
                        doc.loadLocation=order.loadLocation[0].name;
                        doc.unloadLocation=order.unloadLocation[0].name;
                        doc.orderNumber=order.orderNumber;
                        doc.productName=order.orderProductName;
                        break;
                    }
                }
                //mezők átalakítása:
                doc.loadedWeight=(doc.loadedWeight||0)*1000; //átváltás kg-ra
                doc.unloadedWeight=(doc.unloadedWeight||0)*1000;
                doc.carrierName=doc.carrier.name;
            }
            //oszlop konfig, melyik mezőket akarjuk látni
            $scope.columns.push('tcn','platenumber1','country1','platenumber2','country2','productName','loadedWeight','unloadedWeight','loadDate','arrivalDate','carrierName','loadLocation','unloadLocation','value','tcnStatus','ticketName','orderNumber');
            $scope.headers.push('EKAER szám','Rendszám 1','Felségjel','Rendszám 2','Felségjel','Termék','Felrakott súly (kg)','Lerakott súly (kg)','Felrakás dátuma','Lerakás dátuma','Szállítmányozó','Felrakó neve','Lerakó neve','Érték','EKÁER státusz','Mérlegjegy szám','Diszpószám');
            $scope.excelName=$scope.preparedData[0].orderNumber+'.xlsx';
        }
        /*Excel export vége*/

      }

      search(query) {
        const $scope = this.$scope;
        const search = $scope.inputSearch;
        query.search = {
          // ticketType: 'scale',
          // 'partner.name': {
          //   '$regex':  search,
          //   '$options': 'i'
          // },
          // 'contractName': {
          //   '$regex':  search,
          //   '$options': 'i'
          // }
        };
        query.sort = {'updatedAt': -1}
      }

    }
  }
});
