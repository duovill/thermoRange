'use strict';
(() => {
    const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
    const isWindow = typeof(window) !== 'undefined';

    const ngivrSettings = {
        http: {
            noResponseTimeout: 1000 * 30
        },
        scrollIntoViewOptions: {
            behavior: "instant",
            block: "center",
            inline: "center"
        },
        qr: {
            recognize: {
                zbarPerfix: 'QR-Code:',
                ngivrPrefix: 'ngivr-qr',
                ngivrQrDivider: ':',
                ngivrQrDividerName: '-',
            }
        },
        defaultSearchModeStartsWith: true,
        debounce: 200,
        debounceWait: 1500,
        debounceWaitLong: 5000,
        growlLife: 10000,
        currentTranslation: 'hu',
        language: {
            en: 'English',
            hu: 'Magyar'
        },
        htmlTemplate: {
            types: ['OutgoingInvoice', 'Contract', 'ServiceContract', 'Order', 'DeliveryCertificate', 'Ticket', 'ShipPaper', 'IncomingInvoice', 'OtherDocument']
        },
        //TODO ezzel majd kell vele foglalkozni az idozitessel, egyenlore igy hagyom

        /*******************************
         * TTL MINIMUM: 60 seconds!!!!!!
         *******************************/
        redisLock: {
            dev: {
                timeout: {
                    ttl: 600,//30, 60,600,
                    interactionAutoUnlock: 900//60, 90,900,
                }
            },
            prod: {
                timeout: {
                    ttl: 600,
                    interactionAutoUnlock: 900,
                }
            },
        },
        socket: {
            protocol: {
                name: 'prot',
                version: {
                    '1': 1
                }
            },
            event: {
                lock: {
                    run: 'ngivr-socket-lock-run',
                    connect: 'ngivr-socket-lock-connect',
                    update: 'ngivr-socket-lock-update',
                    add: 'ngivr-socket-lock-add',
                    remove: 'ngivr-socket-lock-remove',
                    removeall: 'ngivr-socket-lock-remove-all',
                    init: 'ngivr-socket-lock-init',
                    destroy: 'ngivr-socket-lock-destroy',
                    lock: 'ngivr-socket-lock-lock',
                    unlock: 'ngivr-socket-lock-unlock',
                    list: {
                        update: 'ngivr-socket-lock-list-update',
                        get: 'ngivr-socket-lock-list-get',
                        ownlist: 'ngivr-socket-lock-ownlist'
                    }
                }
            }
        },
        event: {
            client: {
                form: {
                    enabled: 'ngivr-form-enabled',
                    lockChange: 'ngivr-form-lockChange',
                    loaded: 'ngivr-form-loaded',
                },
                list: {
                    clear: 'ngivr-list-clear',
                    requery: 'ngivr-list-requery',
                    loaded: 'ngivr-list-loaded'
                }
            }
        },
        query: {
            sort: {
                all: ['updatedAt', 'createdAt'],
                default: {
                    field: 'createdAt',
                    order: -1
                }
            },
            limit: {
                all: [5, 10, 25, 50, 100],
                default: 10
            }
        },
        session: {
            // percek - 8 ora
            timeLengthMinutes: 480,
            minimumRefreshMinutes: 60
        },
        hosts: {
            dev: [
                '127.0.0.1',
                'localhost',
                'dev',
                'ngivr.workstation',
            ]
        },
        fa: {
            remove: 'fa-remove',
            show: 'fa-eye',
            refresh: 'fa-refresh',
            'default': 'fa-ban',
            wrench: 'fa-wrench'
        },
        user:
            {
                role:
                    {
                        adminGlobal: "adminGlobal",
                        adminLogistic: "adminLogistic",
                        logistic: "logistic",
                        traderLeader: "traderLeader",
                        trader: "trader",
                        leader: "leader",
                        harbourMaster: "harbourMaster",
                        hedger: "hedger",
                        libra: "libra",
                        libraAdmin: "libraAdmin",
                        taxInspector: "taxInspector",
                        registry: "registry",
                        accounting: "accounting",
                        site: "site",
                        order:
                            {
                                adminGlobal: "1",
                                adminLogistic: "2",
                                logistic: "3",
                                traderLeader: "4",
                                trader: "5",
                                leader: "6",
                                harbourMaster: "7",
                                hedger: "8",
                                libra: "9",
                                registry: "10",
                                accounting: "11",
                                taxInspector: "12",
                                libraAdmin: '13',
                                site:'14'
                            }
                    },
            },
        splitType:
            {
                splitLedgerToDifferentDispo: 'splitLedgerToDifferentDispo',
                splitLedgerToSameDispo: 'splitLedgerToSameDispo',
                splitLedger: 'splitLedger'
            },

        populate: {
            order: ['loadLocation', 'unloadLocation', 'seller', 'destination', 'unloadDepot', 'orderProduct'],
            cargoPlan: ['loadPlace', "unloadLocations", "possessionTransfers"],
            orderVehicle: ['ship'],
            ticket: ['ship'],
            depot: ['site'],
            financialCostBearer: ['connectedUnits'],
            incomingInvoice: ['incomingPayMode', 'ledgerHelper'],
            halfTicket: ['ship'],
            weighingHouse: ['site'],
            partnerToolkit: ['partner', 'tools.partnerToolId'],
            deposit: ['depositInvoice']
            //project: ['partner']
        },

        otherDocuments: {
            types: [
                'text',
                'number',
                'date',
                'textarea',
                'select',
                'mask',
                'related',
            ],
            validations: [
                {
                    name: 'all-required',
                    type: 'all',
                },
                {
                    name: 'date-with-time',
                    type: 'date'
                },
                {
                    name: 'number-integer',
                    type: 'number'
                },

            ]
        },

        maxlength: { // maximális karakterszámok
            officialName: 200,
            shortName: 40,
            vatNumber: 20,
            city: 30,
            zipCode: 15,
            name: 80,
            birthPlace: 80,
            address: 70
        },
        fokmoznem : {
            beszerzes: 'BES',
            veszteseg: 'SZV',
            belfElad: 'VEL',
            expElad: 'VEX',
            requalifyOut: 'ATK',
            requalifyIn: 'ATB',
            sweepOut: 'LEH',
            sweepIn: 'LET'},
        counties: [
            {code: '01', name: 'Budapest'},
            {code: '02', name: 'Baranya'},
            {code: '03', name: 'Bács-Kiskun'},
            {code: '04', name: 'Békés'},
            {code: '05', name: 'Borsod-Abaúj-Zemplén'},
            {code: '06', name: 'Csongrád'},
            {code: '07', name: 'Fejér'},
            {code: '08', name: 'Győr-Moson-Sopron'},
            {code: '09', name: 'Hajdú-Bihar'},
            {code: '10', name: 'Komárom-Esztergom'},
            {code: '12', name: 'Nógrád'},
            {code: '13', name: 'Pest'},
            {code: '14', name: 'Somogy'},
            {code: '15', name: 'Szabolcs-Szatmár-Bereg'},
            {code: '16', name: 'Jász-Nagykun-Szolnok'},
            {code: '17', name: 'Tolna'},
            {code: '18', name: 'Vas'},
            {code: '19', name: 'Veszprém'},
            {code: '20', name: 'Zala'}
        ],
        ownPlateNumber: false, //itt állítjuk be, hogy a jármű hozzáadóban sajéát rendszám-e az alapérterlmezett: sygusban true, adonyban false legyen!!

        pdfRelated: {
            schemas: {
                contract: {
                    genQuerySearch: (text) => {
                        return {
                            'contractNumber': {
                                '$regex': text,
                                '$options': 'i'
                            }
                        }
                    },
                    genQuerySearchDisplay: (doc) => {
                        return doc.contractNumber
                    },
                },
                incomingInvoice: {
                    genQuerySearch: (text) => {
                        return {
                            $or: [
                                {
                                    'number': {
                                        '$regex': text,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'referenceNumber': {
                                        '$regex': text,
                                        '$options': 'i'
                                    }
                                }
                            ]
                        }
                    },
                    genQuerySearchDisplay: (doc) => {
                        if (doc.number && doc.referenceNumber) {
                            return `${doc.number} / ${doc.referenceNumber}`
                        } else if (doc.number) {
                            return doc.number
                        }
                        return doc.referenceNumber
                    },
                },
            }
        },
        validation: {
            macId: {
                regex: /^[0-9a-f]{2}([:])(?:[0-9a-f]{2}\1){4}[0-9a-f]{2}$/i,
            },
            url: {
                regex:  /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?$/i
            }
        }
    };

    if (isModule) {
        module.exports = ngivrSettings;
    } else if (isWindow) {
        window.ngivrSettings = ngivrSettings;
    }
})();

