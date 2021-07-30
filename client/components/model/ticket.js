'use strict';

/**
 * ticketGeneratorban a ticket default értékei
 * @type {ngivr.model.ledger}
 */
ngivr.model.ticket = class {
    constructor(options) {
        this.byId = options.user._id;
        this.byName = options.user.fullName;
        this.ticketType = 'scale'; //mérlegházban mindig scale típusú ticket jön létre
        this.weighingHouse = options.weighingHouse;

        this.bruttoWeight = null; // Brutto suly
        this.comments = []; //megjegyzések tömbje, +-al a felületen több megjegyzést is felvehet
        this.contractId = null; //kapcsolódó szerződés ID    a tickethez kapcsolódó szerződés ID-ja, orderből jön
        this.direction = null; //kitárolás, betárolás	a ticket irányát mutatja, értéke 'in', vagy 'out', aszerint, hogy a raktárba, vagy raktárból megy az áru
        this.depot = {
            name: null,
            depotId: null
        }; //raktár (cél)
        this.ledger = [new ngivr.model.ledger()];
        this.loadedWeight = null; //felrakott súly
        this.loadLocation = null; //felrakóhely
        this.numberOfPackings = null; //kiszerelés darabszám//
        this.ownerId = null; //tulajdonos ID  a ticketen levő áru tulajdonosa, kiszállításnál a szerződéses partner, Sygnus tulajdonú termék szállításánál nincs kitöltve, ilyenkor a sygnus Boolean mezőt állítjuk true-ra.
        this.ownerName = ''; //tulajdonos neve
        this.productId = null; //áru id a termék id-ja, eddig csak a neve szerepelt a sémában, de Lázárral úgy beszéltük, legyen benne az ID is
        this.partnerName = null; // Partner neve, orderbol jon
        //serviceContractId: null, //kapcsolódó szolgáltatási szerződés ID  ha van, a kapcsolódó szolgáltatási szerződés ID-ja
        this.shipName = null;  //hajónév (hajó nevéből és érkezés dátumából generáljuk, pl név160501)
        this.site = {
            name: null,
            siteId: null
        }; // Telephely
        this.sygnus = null; //Sygnus-e a tulajdonos  ahogy korábban írtam, true esetén Sygnus tulajdonú a termék, false estén partnerkészletről van szó
        this.sustainability = null; //fenntarthatóság
        this.tcn = null; //EKÁER-szám

        this.ticketValue = null; //ticket értéke (súly * egységár/szerződés szerint/) a ticket értéke
        this.unloadedWeight = null;//lerakott súly
        this.partnerComment = null;
        this.carrier = [null];
        this.bug = false
    }
};
