'use strict';
(function() {
  var service = {};

  ngivr.socket.synch = class {
    static clear() {
      Object.keys(service).forEach((key) => {
        const element = service[key];
        if (typeof(element) === 'function') {
          delete element.promise;
        }
      })
    }

  };


  ngivr.angular.factory('syncedCache', function ($q, $http, Auth, socket) {


    service.clear = () => {
      console.log(ngivr.json.clone(service));
    }

    service.loadMyOffers = function () {

      if (service.loadMyOffers.promise) {
        return service.loadMyOffers.promise;
      }
      var query = {
        offer: true,
        deletedOffer: false,
        'owner.0.name': Auth.getCurrentUser().name
      };

      service.loadMyOffers.promise = $http.get('/api/contracts', {
        params: query
      })
        .then(function (response) {
          service.myOffers = response.data;
          socket.syncUpdates('contract', service.myOffers, function (event, item, object) {
            for (var i = 0; i < object.length; i++) {
              if (item == object[i] && (!item.offer || (item.owner[0].name != Auth.getCurrentUser().name) || item.deletedOffer)) {
                object.splice(i, 1);
              }
            }
            if (service.myOffer && (service.myOffer._id === item._id)) {
              /*service.myOffer.history = item.history;
               service.myOffer.editable = item.editable;*/
              for (var key in item) {
                service.myOffer[key] = item[key]
              }
              //service.myOffer = item;
            }
            // object.filter({contract: true, 'owner.0.name': Auth.getCurrentUser().name}) ?
          });
          return service.myOffers;
        });
      return service.loadMyOffers.promise;
    };

    service.getMyOfferById = function (id) {
      var deferred = $q.defer();
      service.loadMyOffers().then(function () {
        var filtered = service.myOffers.filter(function (o) {
          return o._id == id;
        });
        if (filtered.length == 1) {
          service.myOffer = filtered[0];
          deferred.resolve(service.myOffer);
        } else {
          deferred.reject();
        }
      }); // betölteni a myOffersot, mert ahhoz tartozik a syncUpdate
      return deferred.promise;
    };

    service.loadAllContracts = function () {
      if (service.loadAllContracts.promise) {
        return service.loadAllContracts.promise;
      }
      var query = {
        contract: true,
      };

      service.loadAllContracts.promise = $http.get('/api/contracts', {
        params: query
      })
        .then(function (response) {
          service.allContracts = response.data;
          socket.syncUpdates('contract', service.allContracts, function (event, item, object) {

            //console.log(event, item); // ToDo: manage the list !!!
            for (var i = 0; i < object.length; i++) {

              if (item == object[i] && !item.contract) {
                ////console.log("Ez a contract nem tartozik hozzank. Torolheto!!!");
                object.splice(i, 1);
              }
            }
            if (service.allContract && (service.allContract._id === item._id)) {
              for (var key in item) {
                service.allContract[key] = item[key]
              }
            }
            // object.filter({contract: true, 'owner.0.name': Auth.getCurrentUser().name}) ?
          });
          return service.allContracts;
        });
      return service.loadAllContracts.promise;
    };

    service.getAllOffers = function () {
      if (service.getAllOffers.promise) {
        return service.getAllOffers.promise;
      }
      var query = {
        offer: true,
      };



      service.getAllOffers.promise = $http.get('/api/contracts', {
        params: query
      })
        .then(function (response) {
          service.allOffers = response.data;
          socket.syncUpdates('contract', service.allOffers, function (event, item, object) {
            //console.log(event, item); // ToDo: manage the list !!!
            for (var i = 0; i < object.length; i++) {

              if (item == object[i] && !item.offer) {
                ////console.log("Ez a contract nem tartozik hozzank. Torolheto!!!");
                object.splice(i, 1);
              }
            }
            if (service.allOffer && (service.allOffer._id === item._id)) {
              for (var key in item) {
                service.allOffer[key] = item[key]
              }
            }
            // object.filter({contract: true, 'owner.0.name': Auth.getCurrentUser().name}) ?
          });
          return service.allOffers;
        });
      return service.getAllOffers.promise;
    };

    service.loadMyContracts = function () {
      if (service.loadMyContracts.promise) {
        return service.loadMyContracts.promise;
      }
      var query = {
        contract: true,
        'owner.0.name': Auth.getCurrentUser().name
      };
      service.loadMyContracts.promise = $http.get('/api/contracts', {
        params: query
      })
        .then(function (response) {
          service.myContracts = response.data;
          socket.syncUpdates('contract', service.myContracts, function (event, item, object) {
            ////console.log(event, item); // ToDo: manage the list !!!
            for (var i = 0; i < object.length; i++) {
              // if((item == object[i]) & (item.contract != true) & (item.owner[0].name != Auth.getCurrentUser().name)) {
              if (item == object[i] && (!item.contract || (item.owner[0].name != Auth.getCurrentUser().name))) {
                //console.log("Ez a contract nem tartozik hozzank. Torolheto!!!");
                object.splice(i, 1);
              }
            }
            if (service.myContract && (service.myContract._id === item._id)) {
              for (var key in item) {
                service.myContract[key] = item[key]
              }
            }
            // object.filter({contract: true, 'owner.0.name': Auth.getCurrentUser().name}) ?
          });
          return service.myContracts;
        });
      return service.loadMyContracts.promise;
    };

    service.loadMyOfferTemplates = function () {
      if (service.loadMyOfferTemplates.promise) {
        return service.loadMyOfferTemplates.promise;
      }
      var query = {
        template: true,
        'owner.0.name': Auth.getCurrentUser().name
      };
      service.loadMyOfferTemplates.promise = $http.get('/api/contracts', {
        params: query
      })
        .then(function (response) {
          service.myOfferTemplates = response.data;
          socket.syncUpdates('contract', service.myOfferTemplates, function (event, item, object) {
            //console.log(event, item); // ToDo: manage the list !!!
            for (var i = 0; i < object.length; i++) {
              // if((item == object[i]) & (item.contract != true) & (item.owner[0].name != Auth.getCurrentUser().name)) {
              if (item == object[i] && (!item.template || (item.owner[0].name != Auth.getCurrentUser().name))) {
                //console.log("Ez a template nem tartozik hozzank. Torolheto!!!");
                object.splice(i, 1);
              }
            }
          });
          return service.myOfferTemplates;
        });
      return service.loadMyOfferTemplates.promise;
    };

    service.loadSettlements = function () {
      if (service.loadSettlements.promise) {
        return service.loadSettlements.promise;
      }
      service.loadSettlements.promise = $http.get('/api/settlements')
        .then(function (response) {
          service.settlements = response.data;
          socket.syncUpdates('settlement', service.settlements, function (event, settlement, settlements) {
            settlements.sort(function (a, b) {
              return a.name > b.name ? -1 : a.name > b.name ? 1 : 0;
            });
          });
          return service.settlements;
        });
      return service.loadSettlements.promise;
    };

    service.loadUsers = function () {
      if (service.loadUsers.promise) {
        return service.loadUsers.promise;
      }
      service.loadUsers.promise = $http.get('/api/cusers')
        .then(function (response) {
          service.users = response.data;
          socket.syncUpdates('users', service.users);
          return service.users
        });
      return service.loadUsers.promise;
    };

    service.loadPlans = function () {
      if (service.loadPlans.promise) {
        return service.loadPlans.promise;
      }
      service.loadPlans.promise = $http.get('/api/plans')
        .then(function (response) {
          service.plans = response.data;
          socket.syncUpdates('plan', service.plans);
          return service.plans;
        });
      return service.loadPlans.promise;
    };

    service.loadOrders = function () {
      if (service.loadOrders.promise) {
        return service.loadOrders.promise;
      }
      service.loadOrders.promise = $http.get('/api/orders')
        .then(function (response) {
          service.orders = response.data;
          socket.syncUpdates('order', service.orders);
          return service.orders;
        });
      return service.loadOrders.promise;
    };

    service.loadProducts = function () {
      if (service.loadProducts.promise) {
        return service.loadProducts.promise;
      }
      service.loadProducts.promise = $http.get('/api/products', {params: {itemType: 'Sygnus termények'}})
        .then(function (response) {
          service.products = response.data;
          service.optionProducts = _.filter(response.data, {option: true});
          socket.syncUpdates('product', service.products, function (event, item, object) {
            //console.log(item)
            for (var i = 0; i < object.length; i++) {
              if (item === object[i] && item.itemType !== 'Sygnus termények') {
                object.splice(i, 1);
                break;
              }
            }
            service.optionProducts = _.filter(response.data, {option: true});
          });
          return service.products;
        });
      return service.loadProducts.promise;
    };

    service.loadSites = function () {
      if (service.loadSites.promise) {
        return service.loadSites.promise;
      }
      service.loadSites.promise = $http.get('/api/sites')
        .then(function (response) {
          service.sites = response.data;
          socket.syncUpdates('site', service.sites);
          return service.sites;
        });
      return service.loadSites.promise;
    };

    service.loadDepots = function () {
      if (service.loadDepots.promise) {
        return service.loadDepots.promise;
      }
      service.loadDepots.promise = $http.get('/api/depots')
        .then(function (response) {
          service.depots = response.data;
          socket.syncUpdates('depot', service.depots);
          return service.depots;
        });
      return service.loadDepots.promise;
    };

    service.loadCommercials = function () {
      if (service.loadCommercials.promise) {
        return service.loadCommercials.promise;
      }
      service.loadCommercials.promise = $http.get('/api/commercials')
        .then(function (response) {
          service.commercials = response.data;
          socket.syncUpdates('commercial', service.commercials);
          return service.commercials;
        });
      return service.loadCommercials.promise;
    };

    service.loadSampleStandards = function () {
      if (service.loadSampleStandards.promise) {
        return service.loadSampleStandards.promise;
      }
      service.loadSampleStandards.promise = $http.get('/api/sampleStandards')
        .then(function (response) {
          service.sampleStandards = response.data;
          socket.syncUpdates('sampleStandard', service.sampleStandards);
          return service.sampleStandards;
        });
      return service.loadSampleStandards.promise;
    };

    service.loadReferenceProducts = function () {
      if (service.loadReferenceProducts.promise) {
        return service.loadReferenceProducts.promise;
      }
      service.loadReferenceProducts.promise = $http.get('/api/referenceProducts')
        .then(function (response) {
          service.referenceProducts = response.data;
          socket.syncUpdates('referenceProduct', service.referenceProducts);
          return service.referenceProducts;
        });
      return service.loadReferenceProducts.promise;
    };

    service.loadCurrencies = function () {
      if (service.loadCurrencies.promise) {
        return service.loadCurrencies.promise;
      }
      service.loadCurrencies.promise = $http.get('/api/currencys')
        .then(function (response) {
          service.currencies = response.data;
          socket.syncUpdates('currency', service.currencies);
          return service.currencies;
        });
      return service.loadCurrencies.promise;
    };

    service.loadServiceContracts = function () {
      if (service.loadServiceContracts.promise) {
        return service.loadServiceContracts.promise;
      }
      service.loadServiceContracts.promise = $http.get('/api/serviceContracts')
        .then(function (response) {
          service.serviceContracts = response.data;
          socket.syncUpdates('serviceContract', service.serviceContracts);
          return service.serviceContracts;
        });
      return service.loadServiceContracts.promise;
    };

    service.loadPartners = function () {
      if (service.loadPartners.promise) {
        return service.loadPartners.promise;
      }
      service.loadPartners.promise = $http.get('/api/partners')
        .then(function (response) {
          service.partners = response.data;
          socket.syncUpdates('partner', service.partners);
          return service.partners;
        });
      return service.loadPartners.promise;
    };

    service.loadCarriers = function () {
      if (service.loadCarriers.promise) {
        return service.loadCarriers.promise;
      }
      service.loadCarriers.promise = $http.get('/api/carrier')
        .then(function (response) {
          service.carriers = response.data;
          socket.syncUpdates('carrier', service.carriers);
          return service.carriers;
        });
      return service.loadCarriers.promise;
    };

    service.loadFobDestinations = function () {
      if (service.loadFobDestinations.promise) {
        return service.loadFobDestinations.promise;
      }
      service.loadFobDestinations.promise = $http.get('/api/fobDestinations')
        .then(function (response) {
          service.fobDestinations = response.data;
          socket.syncUpdates('fobDestination', service.fobDestinations);
          return service.fobDestinations;
        });
      return service.loadFobDestinations.promise;
    };

    service.loadProductGroups = function () {
      if (service.loadProductGroups.promise) {
        return service.loadProductGroups.promise;
      }
      service.loadProductGroups.promise = $http.get('/api/productGroups')
        .then(function (response) {
          service.productGroups = response.data;
          socket.syncUpdates('productGroup', service.productGroups);
          return service.productGroups;
        });
      return service.loadProductGroups.promise;
    };

    service.loadParities = function () {
      if (service.loadParities.promise) {
        return service.loadParities.promise;
      }
      service.loadParities.promise = $http.get('/api/paritys')
        .then(function (response) {
          service.parities = response.data;
          socket.syncUpdates('parity', service.parities);
          return service.parities;
        });
      return service.loadParities.promise;
    };

    service.loadCargoPlans = function () {
      if (service.loadCargoPlans.promise) {
        return service.loadCargoPlans.promise;
      }
      service.loadCargoPlans.promise = $http.get('/api/cargoPlans')
        .then(function (response) {
          service.cargoPlans = response.data;
          socket.syncUpdates('cargoPlan', service.cargoPlans);
          return service.cargoPlans;
        });
      return service.loadCargoPlans.promise;
    };

    service.loadInvoices = function () {
      if (service.loadInvoices.promise) {
        return service.loadInvoices.promise;
      }
      service.loadInvoices.promise = $http.get('/api/invoices').then(function (response) {
        for (var i in response.data) {
          response.data[i].showDetails = false;
        }
        service.invoices = response.data;
        socket.syncUpdates('invoice', service.invoices, function (event, item, object) {
          for (var i = 0; i < object.length; i++) {
            if (item === object[i] && item.lockedBy === Auth.getCurrentUserId() && item.lockReason === 'sendToCorrection') {
              item.showCorrectionRowForMe = true;
              item.lockedForEditForMe = false;
            }
          }
        });
        return service.invoices;
      });
      return service.loadInvoices.promise;
    };

    service.getPlanById = function (id) {
      var deferred = $q.defer();
      service.loadPlans().then(function () {
        var filtered = service.plans.filter(function (o) {
          return o._id == id;
        });
        if (filtered.length == 1) {
          service.plan = filtered[0];
          deferred.resolve(filtered[0]);
        } else {
          deferred.reject();
        }
      });
      return deferred.promise;
    };

    service.getMyContractById = function (id) {
      var deferred = $q.defer();
      service.loadMyContracts().then(function () {
        if (service.myContracts.length) { // myContracts is cached
          var filtered = service.myContracts.filter(function (o) {
            return o._id == id;
          });
          if (filtered.length == 1) {
            service.myContract = filtered[0];
            deferred.resolve(filtered[0]);
          } else {
            deferred.reject();
          }
        }
      });
      return deferred.promise;
    };

    service.getAllContractById = function (id) {
      var deferred = $q.defer();
      service.loadAllContracts().then(function () {
        var filtered = service.allContracts.filter(function (o) {
          return o._id == id;
        });
        if (filtered.length == 1) {
          service.allContract = filtered[0];
          deferred.resolve(filtered[0]);
        } else {
          deferred.reject();
        }
      });
      return deferred.promise;
    };

    service.getOfferById = function (id) {
      var deferred = $q.defer();
      service.getAllOffers().then(function () {
        var filtered = service.allOffers.filter(function (o) {
          return o._id == id;
        });
        if (filtered.length == 1) {
          service.allOffer = filtered[0];
          deferred.resolve(filtered[0]);
        } else {
          deferred.reject();
        }
      });
      return deferred.promise;
    };

    service.getLedgerHelpers = function () {
      if (service.getLedgerHelpers.promise) {
        return service.getLedgerHelpers.promise;
      }
      service.getLedgerHelpers.promise = $http.get('/api/ledgerHelper').then(function (response) {
        service.ledgerHelpers = response.data;
        socket.syncUpdates('ledgerHelper', service.ledgerHelpers);
        return service.ledgerHelpers;
      });
      return service.getLedgerHelpers.promise;
    };

    service.getCostCenters = function () {
      if (service.getCostCenters.promise) {
        return service.getCostCenters.promise;
      }
      service.getCostCenters.promise = $http.get('/api/costCenters').then(function (response) {
        service.costCenters = response.data;
        socket.syncUpdates('costCenter', service.costCenters);
        return service.costCenters;
      });
      return service.getCostCenters.promise;
    };

    service.getAllProducts = function () {
      if (service.getAllProducts.promise) {
        return service.getAllProducts.promise;
      }
      service.getAllProducts.promise = $http.get('/api/products').then(function (response) {
        service.allProducts = response.data;
        socket.syncUpdates('product', service.allProducts);
        return service.allProducts;
      });
      return service.getAllProducts.promise;
    };

    service.getFinancialCostBearers = function () {
      if (service.getFinancialCostBearers.promise) {
        return service.getFinancialCostBearers.promise;
      }
      service.getFinancialCostBearers.promise = $http.get('/api/financialCostBearers').then(function (response) {
        service.financialCostBearers = response.data;
        socket.syncUpdates('financialCostBearer', service.financialCostBearers);
        return service.financialCostBearers;
      });
      return service.getFinancialCostBearers.promise;
    };

    service.getBanks = function () {
      if (service.getBanks.promise) {
        return service.getBanks.promise;
      }
      service.getBanks.promise = $http.get('/api/banks').then(function (response) {
        service.banks = response.data;
        socket.syncUpdates('bank', service.banks);
        return service.banks;
      });
      return service.getBanks.promise;
    };

    service.getLedgers = function () {
      if (service.getLedgers.promise) {
        return service.getLedgers.promise;
      }
      service.getLedgers.promise = $http.get('/api/ledger').then(function (response) {
        service.ledgers = response.data;
        socket.syncUpdates('ledger', service.ledgers);
        return service.ledgers;
      });
      return service.getLedgers.promise;
    };

    service.getServiceOrders = function () {
      if (service.getServiceOrders.promise) {
        return service.getServiceOrders.promise;
      }
      service.getServiceOrders.promise = $http.get('/api/serviceOrders').then(function (response) {
        service.serviceOrders = response.data;
        setServiceOrders();
        socket.syncUpdates('serviceOrder', service.serviceOrders, function (event, item, object) {
          setServiceOrders()
        });
        return service.serviceOrders;
      });
      return service.getServiceOrders.promise;
    };

    function setServiceOrders() {
      for (let i in service.serviceOrders) {
        service.serviceOrders[i].productName = service.serviceOrders[i].product.name;
        if (typeof service.serviceOrders[i].partnerId === 'string') {
          service.serviceOrders[i].partner = service.partners.filter(function (o) {
            return o._id === service.serviceOrders[i].partnerId
          })[0].name
        } else {
          service.serviceOrders[i].partner = service.serviceOrders[i].partnerId.name;
        }
        if (typeof service.serviceOrders[i].costCenterId === 'string') {
          service.serviceOrders[i].costCenterName = service.costCenters.filter(function (o) {
            return o._id === service.serviceOrders[i].costCenterId
          })[0].name
        } else {
          service.serviceOrders[i].costCenterName = service.serviceOrders[i].costCenterId.name;
          service.serviceOrders[i].costCenterId = service.serviceOrders[i].costCenterId._id;
        }
        for(let k in service.serviceOrders[i].costBearers) {
          if (service.serviceOrders[i].costBearers[k].isContract && service.serviceOrders[i].costBearers[k].hasOwnProperty('contractId')) {
            if (typeof service.serviceOrders[i].costBearers[k].contractId === 'string') {
              service.serviceOrders[i].costBearers[k].contract = service.allContracts.filter(function (o) {
                return o._id === service.serviceOrders[i].costBearers[k].contractId
              })[0].contractNumber
            } else {
              service.serviceOrders[i].costBearers[k].contract = service.serviceOrders[i].costBearers[k].contractId.contractNumber;
              service.serviceOrders[i].costBearers[k].contractId = service.serviceOrders[i].costBearers[k].contractId._id
            }
          } else {
            if (typeof service.serviceOrders[i].costBearers[k].financialCostBearerId === 'string') {
              service.serviceOrders[i].costBearers[k].financialCostBearer = service.financialCostBearers.filter(function (o) {
                return o._id === service.serviceOrders[i].costBearers[k].financialCostBearerId
              })[0].name
            } else if (service.serviceOrders[i].costBearers[k].hasOwnProperty('financialCostBearerId')) {
              service.serviceOrders[i].costBearers[k].financialCostBearer = service.serviceOrders[i].costBearers[k].financialCostBearerId.name;
              service.serviceOrders[i].costBearers[k].financialCostBearerId = service.serviceOrders[i].costBearers[k].financialCostBearerId._id
            }

          }
        }
      }
    }

    service.getMenus = function () {
      if (service.getMenus.promise) {
        return service.getMenus.promise;
      }
      service.getMenus.promise = $http.get('/api/menus').then(function (response) {
        service.menus = response.data;
        socket.syncUpdates('menu', service.menus);
        return service.menus;
      });
      return service.getMenus.promise;
    }


    return service;
  });
})();
