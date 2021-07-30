'use strict';

/**
 * ticketGeneratorban a ticket.ledger default értékei
 * @type {ngivr.model.ledger}
 */
ngivr.model.ledger = class {


    // DEBUGHOZ
    // get loadedWeight() {
    //     return this._loadedWeight
    // }
    //
    // set loadedWeight(val) {
    //     console.warn('ngivr.model.ledger set loadedWeight')
    //     this._loadedWeight = val
    // }


    constructor() {
        this.advancementInvoiceIds = []; //tickethez kapcsolódó előlegszámlák azonosítói
        this.contractId = null; // neki a remain-ját kell változtatni a súly alapján, illetve innen jön az ár is a stockValues-hez
        this.correctionInvoiceIds = []; //tickethez kapcsolódó korrekciós számlák azonosítói
        this.invoiceId = null; // kapcsolódó számla
        this.needContract = null; // TRUE, ha még nincs megadva contract valamiért, és meg kellene adni
        this.needInvoice = null; // TRUE, ha ehhez kell számla
        this.orderId = null; //diszpo ID
        this.orderNumber = null; // diszpo szam
        this.partnerName = null; //Partner neve
        this.relationId = null; //vidéki túra összetartozó ticketjeit jelöli (az összetartozó ticketben ez az érték megegyezik)
        this.stornoInvoiceId = null; // ha hibás volt a ticket korábban, de már készült számla ehhez a szerződéshez, akkor a stornójának az ID-jét ide tesszük
        this.wayBill = null; //Szállítólevél száma
        this.discount = null;  // kedvezmény az árból (a szerződés devizájában)
        this.ledgerId = null; //főkönyvi száma
        this.remain = null; //pillanatnyi mennyiség (FIFO szerint kitárolás után)
        this.remainOriginal = null; // erről a mennyiségről indultunk a kitárolások előtt

        //this._loadedWeight = null
        this.loadedWeight = null;

        this.unloadedWeight = null;
        this.actualServiceContractId = null; //ez alapján számlázzuk a kitárolást, és nézzük a puffert
        this.sourceServiceContractId = null; //ezeknek a ticketeknek a mennyiségét csökkentjük
        this.stockValue = null; //készletérték
        this.servicePrice = [
            /*{
              serviceType = null, // Szolgáltatás típusa -> ngivrStrings.js
              price = null, //ár
              currency = null, //deviza
              invoiceId =null //számla id
            }*/
        ];
        this.saved = false
    }
};
