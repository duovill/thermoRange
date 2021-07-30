'use strict';
ngivr.model.financialDocument = class {
  constructor() {
      this.documentType = undefined;
      this.partner = [
        undefined
      ];
      this.currency = [
        undefined
      ];
      this.documentNumber = undefined;
      this.bruttoValue = undefined;
      this.registryDate = undefined;
  }
};
