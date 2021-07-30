'use strict';
ngivr.model.nomination = class {
  constructor(options) {
    this.deleted = false;
    this.buyContracts = [];
    this.depotSources = [];
    this.closed = false;
    this.finalized = false;
    this.sellContracts = [] ;
    this.dispoSources = [];
    this.itks = [];
    this.partnerResources = [];
    this.partnerTransports = [];
    this.productsFromShip = [];
    this.quantity = 0;
    this.ships = [{
      bug: false,
      comment: '',
      gas: false,
      shipName: null,
      loadedQuantity: null
    }];
    this.transportType = '';
    this.ekaerObj = {
      edited: false,
      request: false
    }
  }
};

