'use strict';

ngivr.model.site = class
{
    constructor(data)
    {
        this.createdAt = undefined;
        this.name = undefined;
        this.VAT = undefined;
        this.phone = undefined;
        this.email = undefined;
        this.country = undefined;
        this.zipCode = undefined;
        this.city = undefined;
        this.street = undefined;
        this.streetType = undefined;
        this.streetNumber = undefined;
        this.lotNumber = undefined;
        this.latitude = undefined;
        this.longitude = undefined;
        this.own = undefined;
        this.ownScale = undefined;
        this.partnerStocksSite = undefined;
        this.privat = undefined;
        this.storedTotalSite = undefined;
        this.visible= true;
        this.quayBerth = [];

        this.__v = undefined;

        if (data != undefined)
        {
            Object.assign(this, data);
        }
    }
};
