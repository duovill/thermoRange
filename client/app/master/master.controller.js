'use strict';


angular.module('ngIvrApp')
    .controller('MasterCtrl', function ($scope, $rootScope, $http, socket, $location, Auth, $window, Common, $state, ngivrService, $mdMedia, $mdSidenav, ngivrSocketLock, $interval) {

        $scope.$mdMedia = $mdMedia;

        $scope.isElectron = navigator.userAgent.includes('Electron');

        /**
         * Mérlegház lekérése
         * jelenleg inaktív, mert felhasználóhiz kötjük a mérlegházat
         * @type {Date}
         */
            // if (!$rootScope.weighingHouse) {
            //   ngivrService.data.query({schema: 'weighingHouse'}).query().then((response)=>{
            //     if (response.data.docs.length) $rootScope.weighingHouse = response.data.docs[0]
            //   });
            // }

        var currentDate = new Date();
        // $scope.socketService = ngivrSocketLock;
        // $scope.locklist = [];
        //
        // socket.socket.on(ngivr.settings.socket.event.lock.list.update, function (data) {
        //   $scope.locklist = data.data;
        // });
        // $scope.socketService.get();
        //
        // $scope.openLockModel = function(lock){
        //   var url = '/'+lock.data.schema;
        //   url += 's/';
        //   url += lock.data.model._id;
        //     $location.path(url);
        // };

        // $scope.toggleLeft = buildToggler('left');
        // $scope.toggleRight = buildToggler('right');
        //
        // function buildToggler(componentId) {
        //   return function() {
        //     $mdSidenav(componentId).toggle();
        //   };
        // }

        $scope.quickNavIsOpen = false;

        var myTimerCurrentUser;
        var quickNavInit = function () {
            if (!angular.equals($scope.user, {})) {
                $interval.cancel(myTimerCurrentUser);
            }
        };
        $scope.quickNavLinksFilter = function (item) {
            return item != null;
        };

        angular.element(document).ready(function () {
            myTimerCurrentUser = $interval(quickNavInit, 1000);
        });

        $scope.openQuickLink = function (link) {
            if (link === 'incomingInvoices.filing') {
                $state.go(link);
                return
            }
            $location.path("/" + link);
        };

        $scope.fullSizeRequired = 0;

        $scope.logout = function () {
            myTimerCurrentUser = $interval(quickNavInit, 1000);
//            $location.path('/login');
            Auth.logout();
        };

        $scope.settings = function () {
            $location.path('/settings');
        };

        $scope.mySettings = function () {
            $location.path('/mySettings');
        };

        $scope.isLoggedIn = Auth.isLoggedIn;

        $scope.getCurrentUser = Auth.getCurrentUser;

        $scope.Auth = Auth;

        $scope.masterDatas = [
            {name: 'Felhasználók', route: 'users'},
//            {name: 'Partnerek', route: 'partners'},
//            {name: 'Cikktörzs', route: 'products'},
//            {name: 'Paritások', route: 'parities'},
//            {name: 'Devizák', route: 'currencies'},
//            {name: 'Minőségi paraméterek', route: 'qualityParams'},
//            {name: 'Referencia termékek', route: 'referenceProducts'},
//            {name: 'Terménycsoportok', route: 'productGroups'},
//            {name: 'Települések', route: 'zipCodes'},
//            {name: 'Kereskedelmi egyezmények', route: 'commercials'},
//            {name: 'Mintavételi szabványok', route: 'sampleStandards'},
//            {name: 'Swap tábla', route: 'swap'},
//            {name: 'Bankok', route: 'banks'},
//            {name: 'FOB-viszonylatok', route: 'fobDestinations'},
            //{name: 'Devizabázis', route: 'currencyBases'},
//            {name: 'Telephelyek', route: 'sites'},
//            {name: 'Raktárak', route: 'depots'},
//            {name: 'Szállítmányozók', route: 'carriers'},
            // {name: 'Cikktörzs', route: 'baseItems'},
//            {name: 'Html Sablonok', route: 'htmlTemplates'},
//            {name: 'Megjegyzés sablon', route: 'htmlTemplatesComment'},
//            {name: 'Főkönyv', route: 'ledger'},
//            {name: 'NG IVR mozgásnemek', route: 'ledgerHelper'},
//            {name: 'Költséghelyek', route: 'costCenters'},
//            {name: 'Költségviselők', route: 'financialCostBearers'},
//            {name: ngivr.strings.sychronizer.title, route: 'synchronizer'},
//            {name: 'Szállító eszközök', route: 'transportEquipment'},
//            {name: 'Hitelek/lízingek', route: 'loanLeasing'},
//            {name: 'Mérlegházak', route: 'weighingHouses'},
//            {name: 'winNER', route: 'winner'},
            {name: 'Queue', route: 'queue'},
            //{name: 'Státusz-figyelmeztetések beállításai', route: 'notifications'}
        ];
        $rootScope.user = $scope.getCurrentUser();
        //$scope.user = $rootScope.user;
        //console.log($scope.user);

        $rootScope.$watch('user.role', function () {
            angular.element('body').css('display', 'block');

            if ($rootScope.user.role && $location.path().substring(1) == '' && $window.innerWidth < 992) {
                angular.element('.navbar-collapse').addClass('in');
            }
        });

        // const userListener = async () => {
        //     User.get().$promise.then((user) => {
        //         alert(user)
        //     });
        //     $rootScope.user = $scope.getCurrentUser();
        // };
        //
        //
        //
        // socket.socket.on('user:save', userListener);
        //
        // $scope.$on('$destroy', async function () {
        //
        //     socket.socket.removeListener('user:save', userListener)
        // });


        /*var query = {offer: true, submitted: true, deletedOffer: false};                                                         //feltétel a lekérdezéshez
        $http.get('/api/contracts',{params:query}).then(function(response) {    //szerződések lekérdezése
          const selectedcontracts = response.data;
          //console.log(selectedcontracts);
          $rootScope.contractsNotify = selectedcontracts;//a tömb feltöltése

          $rootScope.offers = {};
          $rootScope.offers.buyCount = $rootScope.contractsNotify.filter(function (o) {
            return o.buy === true
          }).length;

          $rootScope.offers.sellCount = $rootScope.contractsNotify.filter(function (o) {
            return o.buy === false
          }).length;
          socket.syncUpdates($rootScope, 'contract', $rootScope.contractsNotify
            , function(event, item, object) {

              for (var i = 0; i < object.length; i++){
                if (item == object[i] && (!item.offer || !item.submitted || item.deletedOffer)){
                  object.splice(i, 1);
                }
              }
              $rootScope.contractsNotify = object;
              $rootScope.offers = {};
              $rootScope.offers.buyCount = $rootScope.contractsNotify.filter(function (o) {
                return o.buy === true
              }).length;

              $rootScope.offers.sellCount = $rootScope.contractsNotify.filter(function (o) {
                return o.buy === false
              }).length;
            });


        });*/

        $rootScope.offerCount = {}

        const dataQuery = ngivrService.data.query({
            $scope: $rootScope,
            schema: 'contract',
            subscribe: async (promise) => {
                try {
                    const response = await promise;
                    $rootScope.offerCount.total = response.data.total;
                    $rootScope.offerCount.buy = response.data.docs.filter((o) => {
                        return o.buy === true
                    }).length;
                    $rootScope.offerCount.sell = $rootScope.offerCount.total - $rootScope.offerCount.buy;
                    delete response.data['docs'];
                } catch (e) {
                    //ngivr.growl.error(e);
                }
            }
        });

        dataQuery.query({
            limit: 0,
            search: {
                offer: true, submitted: true, deletedOffer: false
            }
        });

        $scope.labels = [];
        for (var i = 90; i >= 0; i--) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            var startDay = d.getDate();


            $scope.labels.push(startDay);
        }

        $scope.series = ['HUF', 'EUR'];
        var days = 100;
        //$http.get('/api/hedgeGraph1/'+days).then(function(data){
        //$scope.data = data;
        //console.log($scope.data);
        //socket.syncUpdates($scope , 'hedgeGraph1', $scope.data);

        //})


        $scope.hedgeYears = [2016, 2017];
        $scope.showEditor = 0;


        $scope.products = [];


        $scope.productGroups = [];

        $scope.ledgerHelpers = [];

        $scope.parities = [];


        $scope.partners = [];

        $scope.hedges = [];
        $scope.currencies = [];
        $scope.currencyBases = [];

        $scope.partnerTypes2 = [
            {id: 0, type: 'Cég', group: 'grain'},
            {id: 1, type: 'Őstermelő', group: 'grain'},
            {id: 2, type: 'Számlás őstermelő', group: 'grain'},
            {id: 3, type: 'Egyéni vállalkozó', group: 'grain'},
            {id: 4, type: 'Bróker', group: 'broker'},
            {id: 5, type: 'Üzletkötő', group: 'broker'},
            {id: 6, type: 'Egyéb'},
            {id: 7, type: 'áthozott'}
        ];

        $scope.partnerTypes1 = [
            {id: 0, type: 'Gabonapartner'},
            {id: 1, type: 'Brókerpartner'},
            {id: 2, type: 'Egyéb'},
            {id: 3, type: 'áthozott'}
        ];
        $scope.toxins = [];

        $scope.commercials = [];


        $scope.paymentDeadlines = [
            {name: 'Egyik', visible: true},
            {name: 'Másik', visible: true}
        ];


        $scope.qualityParams = [];
        //$scope.contracts = [];
        $scope.newContract = [];
        $scope.sampleStandards = [];        //üres objektum def
        $scope.settlements = [];

        //$scope.masterFilter = function () {
        //console.log($scope.getCurrentUser());


        //};

        $scope.sustainabilities = [
            {name: 'Egyik', visible: true},
            {name: 'Másik', visible: true}
        ];

        switch ($scope.getCurrentUser().role) {
            case $scope.ngivr.settings.user.role.adminLogistic:
                $scope.masterDatas = [
//                    {name: 'Partnerek', route: 'partners'},
//                    {name: 'Terménycsoportok', route: 'productGroups'},
//                    {name: 'Cikktörzs', route: 'products'},
//                    {name: 'Minőségi paraméterek', route: 'qualityParams'},
//                    {name: 'Paritások', route: 'parities'},
//                    {name: 'FOB-viszonylatok', route: 'fobDestinations'},
//                    {name: 'Devizák', route: 'currencies'},
//                    {name: 'Települések', route: 'zipCodes'},
//                    {name: 'Kereskedelmi egyezmények', route: 'commercials'},
//                    {name: 'Mintavételi szabványok', route: 'sampleStandards'},
//                    {name: 'Bankok', route: 'banks'},
//                    {name: 'Referencia termékek', route: 'referenceProducts'},
//                    {name: 'Telephelyek', route: 'sites'},
//                    {name: 'Raktárak', route: 'depots'},
//                    {name: 'Szállítmányozók', route: 'carriers'},
                    //{name: 'Cikktörzs', route: 'baseItems'},
//                    {name: 'Html Sablonok', route: 'htmlTemplates'},
//                    {name: 'Megjegyzés sablon', route: 'htmlTemplatesComment'},
//                    {name: 'Főkönyv', route: 'ledger'},
//                    {name: 'NG IVR mozgásnemek', route: 'ledgerHelper'},
//                    {name: 'Költséghelyek', route: 'costCenters'},
//                    {name: 'Költségviselők', route: 'financialCostBearers'},
//                    {name: ngivr.strings.sychronizer.title, route: 'synchronizer'},
//                    {name: 'Szállító eszközök', route: 'transportEquipment'},
//                    {name: 'Mérlegházak', route: 'weighingHouses'},
//                    {name: 'winNER', route: 'winner'}
                    //{name: 'Státusz-figyelmeztetések beállításai', route: 'notifications'}
                ];
                return $scope.masterDatas;

            case $scope.ngivr.settings.user.role.hedger:
                $scope.masterDatas = [
                    //{name: 'Devizabázis', route: 'currencyBases'},
//                    {name: 'Bankok', route: 'banks'},
//                    {name: 'Swap tábla', route: 'swap'},
//                    {name: 'Deviza alapbeállítások', route: 'hedgeDefaults'}
                ];
                return $scope.masterDatas;

            case $scope.ngivr.settings.user.role.registry:
                $scope.masterDatas = [
                    //{name: 'Devizabázis', route: 'currencyBases'},
//                    {name: 'Partnerek', route: 'partners'},
//                    {name: 'Cikktörzs', route: 'products'}
                ];
                return $scope.masterDatas;

            case $scope.ngivr.settings.user.role.accounting:
                $scope.masterDatas = [
                    //{name: 'Devizabázis', route: 'currencyBases'},
//                    {name: 'Partnerek', route: 'partners'},
//                    {name: 'Cikktörzs', route: 'products'},
//                    {name: 'Devizák', route: 'currencies'},
//                    {name: 'NG IVR mozgásnemek', route: 'ledgerHelper'},
//                    {name: 'winNER', route: 'winner'}
                ];
                return $scope.masterDatas;

            case $scope.ngivr.settings.user.role.site:
                $scope.masterDatas = [
                    //{name: 'Devizabázis', route: 'currencyBases'},
//                    {name: 'Partnerek', route: 'partners'},
//                    {name: 'Cikktörzs', route: 'products'},
//                    {name: 'Terménycsoportok', route: 'productGroups'},
                ];
                return $scope.masterDatas;

            case $scope.ngivr.settings.user.role.adminGlobal:
                $scope.masterDatas = [
                    {name: 'Felhasználók', route: 'users'},
//                    {name: 'Partnerek', route: 'partners'},
//                    {name: 'Cikktörzs', route: 'products'},
//                    {name: 'Paritások', route: 'parities'},
//                    {name: 'Devizák', route: 'currencies'},
//                    {name: 'Minőségi paraméterek', route: 'qualityParams'},
//                    {name: 'Referencia termékek', route: 'referenceProducts'},
//                    {name: 'Terménycsoportok', route: 'productGroups'},
//                    {name: 'Települések', route: 'zipCodes'},
//                    {name: 'Kereskedelmi egyezmények', route: 'commercials'},
//                    {name: 'Mintavételi szabványok', route: 'sampleStandards'},
//                    {name: 'Swap tábla', route: 'swap'},
//                    {name: 'Bankok', route: 'banks'},
//                    {name: 'FOB-viszonylatok', route: 'fobDestinations'},
                    //{name: 'Devizabázis', route: 'currencyBases'},
//                    {name: 'Telephelyek', route: 'sites'},
//                    {name: 'Raktárak', route: 'depots'},
//                    {name: 'Szállítmányozók', route: 'carriers'},
//                    {name: 'Deviza alapbeállítások', route: 'hedgeDefaults'},
//                    {name: 'Státusz-figyelmeztetések beállításai', route: 'notifications'},
                    //{name: 'Cikktörzs', route: 'baseItems'},
//                    {name: 'Html Sablonok', route: 'htmlTemplates'},
//                    {name: 'Megjegyzés sablon', route: 'htmlTemplatesComment'},
//                    {name: 'Főkönyv', route: 'ledger'},
//                    {name: 'NG IVR mozgásnemek', route: 'ledgerHelper'},
//                    {name: 'Költséghelyek', route: 'costCenters'},
//                    {name: 'Költségviselők', route: 'financialCostBearers'},
//                    {name: ngivr.strings.sychronizer.title, route: 'synchronizer'},
//                    {name: 'Szállító eszközök', route: 'transportEquipment'},
//                    {name: 'Hitelek/lízingek', route: 'loanLeasing'},
//                    {name: 'Mérlegházak', route: 'weighingHouses'},
//                    {name: 'winNER', route: 'winner'},
                    //TODO bull
                    {name: 'Queue Bull Arena', route: 'queue'},

//                    {name: ngivr.strings.otherDocuments.title.title, route: 'otherDocument' }

                ];
        }

        $scope.numToText = function (num) {
            try {
                var int_text = '';
                var dec_text = '';
                var groups = null;
                var res = '';
                var dash = '-';
                var minus = '';

                var one = [
                    'nulla',
                    'egy',
                    'kettő',
                    'három',
                    'négy',
                    'öt',
                    'hat',
                    'hét',
                    'nyolc',
                    'kilenc'
                ];

                var ten = [
                    ['tizen', 'tíz'],
                    ['huszon', 'húsz'],
                    ['harminc'],
                    ['negyven'],
                    ['ötven'],
                    ['hatvan'],
                    ['hetven'],
                    ['nyolcvan'],
                    ['kilencven']
                ];

                var more = [
                    'száz',
                    'ezer',
                    'millió',
                    'milliárd'
                ];

                var decimal = [
                    'tized',
                    'század',
                    'ezred',
                    'tízezred',
                    'százezred'
                ];

                var translateGroup = function (group, suffix) {
                    var g_res = '';

                    for (var i = 0; i < 3; ++i) {
                        switch (i) {
                            case 0:
                                if (group.length == 3) {
                                    if (group[0] != '0') {
                                        if (group[0] == '1') {
                                            g_res += more[0];
                                        }
                                        else if (group[0] == '2') {
                                            g_res += 'kétszáz';
                                        }
                                        else {
                                            g_res += one[parseInt(group[0])] + more[0];
                                        }
                                    }

                                    group = group.substring(1);
                                }
                                break;

                            case 1:
                                if (group.length > 1) {
                                    if (group[0] != '0') {
                                        if (group == '10') {
                                            g_res += ten[0][1];
                                        }
                                        else if (group == '20') {
                                            g_res += ten[1][1];
                                        }
                                        else {
                                            g_res += ten[parseInt(group[0]) - 1][0];
                                        }
                                    }

                                    group = group.substring(1);
                                }
                                break;

                            default:
                                if (group[0] != '0') {
                                    g_res += one[parseInt(group[0])];
                                }
                                break;
                        }
                    }

                    return g_res + (g_res.length == 0 ? '' : suffix + dash);
                };

                if (!(num == null)) {
                    num = num.toString();

                    if (parseFloat(num) < 0) {
                        minus = 'mínusz ';
                        num = num.substring(1);
                    }

                    if (parseFloat(num) < 2000) {
                        dash = '';
                    }

                    num = num.replace(/,/g, '.');
                    var int = null;
                    var dec = null;
                    var intLen = 0;
                    var decLen = 0;

                    if (num.indexOf('.') > -1) {
                        int = num.substr(0, num.indexOf('.'));
                        dec = num.substr(num.indexOf('.') + 1);
                    }
                    else {
                        int = num;
                    }

                    if (!(int == null)) {
                        intLen = int.length;
                    }

                    if (!(dec == null)) {
                        decLen = dec.length;
                    }

                    if (intLen) {
                        if (int == '0') {
                            int_text = one[0];
                        }
                        else {
                            groups = int.split(/(?=(?:...)*$)/);

                            for (var i = groups.length - 1, len = groups.length, suffix = 0; i >= 0; --i, ++suffix) {
                                if (intLen > 12) {
                                    int_text = groups[i] + ' ' + int_text;
                                }
                                else {
                                    int_text = translateGroup(groups[i], (suffix > 0 ? more[suffix] : '')) + int_text;
                                }
                            }
                        }
                    }

                    if (decLen) {
                        one[2] = 'két';

                        if (parseFloat(dec) < 2000) {
                            dash = '';
                        }
                        else {
                            dash = '-';
                        }

                        groups = dec.split(/(?=(?:...)*$)/);

                        if (decLen <= decimal.length) {
                            var suf = decimal[decLen - 1];
                        }

                        for (var i = groups.length - 1, len = groups.length, suffix = 0; i >= 0; --i, ++suffix) {
                            if (decLen > decimal.length) {
                                dec_text = groups[i] + ' ' + dec_text;
                            }
                            else {
                                dec_text = translateGroup(groups[i], (suffix > 0 ? more[suffix] : '')) + dec_text;
                            }
                        }

                        if (dec_text.indexOf('-', dec_text.length - 1) !== -1) {
                            dec_text = dec_text.slice(0, -1);
                        }

                        if (decLen <= decimal.length) {
                            dec_text += ' ' + suf;
                        }

                        dec_text = dec_text.replace(/^egyezer/g, 'ezer');
                        dec_text = dec_text.replace(/-egyezer/g, '-ezer');
                    }

                    if (int_text.indexOf('-', int_text.length - 1) !== -1) {
                        int_text = int_text.slice(0, -1);
                    }

                    res = int_text + (decLen ? ' egész ' + dec_text : '');
                    res = res.replace(/^egyezer/g, 'ezer');
                    res = res.replace(/-egyezer/g, '-ezer');
                    res = res.replace(/-kettőezer/g, '-kétezer');
                    res = res.replace(/^(kettő)(.+)/g, 'két$2');
                }

                return minus + res;
            }
            catch (err) {
            }
        };

        var user = Auth.getCurrentUser();
        if (typeof user.$promise !== 'undefined') {
            user.$promise.then(function (data) {
                $http.get('/api/newNotifications', {params: {_id: data._id}}).then(function (response) { //lekérjük azokat az értesítéseket, melyek to mezőjében szerepel az aktuális user id-ja
                    const newNotifications = response.data;
                    $rootScope.notifications = newNotifications;	//tömb feltöltése
                    $rootScope.notifications.sort(function (a, b) {
                        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
                    });
                    socket.syncUpdates($rootScope, 'newNotification', $rootScope.notifications
                        , function (event, item, object) {
                            if (item.to.indexOf(user._id) === -1) {   //ha a frissített értesítés nem tartalmazza a user id-ját
                                var idx = Common.functiontofindIndexByKeyValue($rootScope.notifications, "_id", item._id);
                                $rootScope.notifications.splice(idx, 1);                     //töröljük az értesítést a listából
                            }
                            $rootScope.notifications.sort(function (a, b) {
                                return Date.parse(b.createdAt) - Date.parse(a.createdAt);
                            });
                        });
                });

                $http.get('/api/newMessages', {params: {_id: data._id}}).then(function (response) { //lekérjük azokat az üzeneteket, melyek to mezőjében szerepel az aktuális user id-ja
                    const newMessages = response.data;
                    $rootScope.messages = newMessages;	//tömb feltöltése
                    $rootScope.messages.sort(function (a, b) {
                        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
                    });
                    console.log($rootScope.messages);
                    socket.syncUpdates($rootScope, 'newMessage', $rootScope.messages
                        , function (event, item, object) {
                            if (item.to.indexOf(user._id) === -1) {   //ha a frissített üzenet nem tartalmazza a user id-ját
                                var idx = Common.functiontofindIndexByKeyValue($rootScope.messages, "_id", item._id);
                                $rootScope.messages.splice(idx, 1);                     //töröljük az értesítést a listából
                            }
                            $rootScope.messages.sort(function (a, b) {
                                return Date.parse(b.createdAt) - Date.parse(a.createdAt);
                            });
                        });
                });
            });
        }

        var playNotifcation = _.debounce(function () {
            if ($scope.sound.paused) {
                $scope.sound.play();
            }
        }, ngivr.settings.debounce);

        $scope.$watch("notifications.length", function handleChange(new_val, old_val) {

            if (old_val < new_val)
                playNotifcation();
        });

        $scope.$watch("messages.length", function handleChange(new_val, old_val) {


            if (old_val < new_val)
                playNotifcation();
        });

        $scope.$watch("count", function handleChange(new_val, old_val) {

            if (old_val < new_val)
                playNotifcation();
        });


        $scope.sound = new Audio('../../assets/sounds/notification.mp3');


        $scope.removeNotification = function (idx, $event) {  //értesítés törlése az értesítések listájából (user szinten)
            if ($event !== undefined) {
                $event.stopImmediatePropagation();
            }
            var contractNumber = $rootScope.notifications[idx].contractNumber;

            $http.put('/api/newNotifications/' + $rootScope.notifications[idx]._id, {
                userId: $rootScope.user._id,
                deleteUserFromNotification: true
            });

        };

        /**
         * Értesítésre kattintva a megfelelő state-re megy
         * @param notification
         */
        $scope.goToState = (notification) => {
            if (($state.current.name !== notification.state && $state.current.name !== 'tracking.contracts.buy') && notification.state === 'tracking.contracts.buy.detail') {
                $state.get('tracking.contracts.buy.detail').data.fromNotification = true;
            }
            if (($state.current.name !== notification.state && $state.current.name !== 'tracking.contracts.sell') && notification.state === 'tracking.contracts.sell.detail') {
                $state.get('tracking.contracts.sell.detail').data.fromNotification = true;
            }
            $state.go(notification.state, {id: notification.contractId})
        };

        $scope.removeMessage = function (idx, $event) {  //értesítés törlése az értesítések listájából (user szinten)
            if ($event !== undefined) {
                $event.stopImmediatePropagation();
            }
            var contractId = $rootScope.messages[idx].contractNumber;
            $http.put('/api/newMessages/' + $rootScope.messages[idx]._id, {
                userId: $rootScope.user._id,
                deleteUserFromMessage: true
            });
        };

        //master/slave szerver állapotok
        let getSyncData = (async () => {
            $rootScope.masterSlave = $rootScope.masterSlave || {}
            try {
                let masterSlave = await $http.get('/api/synchronizer');
                $rootScope.masterSlave.config = masterSlave.data;
                if (masterSlave.data.enabledAsMaster) {
                    try {
                        let slaves = await $http.get('/api/synchronizer/master');
                        $rootScope.masterSlave.slaves = slaves.data;
                        socket.socket.on("SYNCCLIENTSTATE", (data) => {
                            $rootScope.masterSlave.slaves = data;
                            console.log(data);
                        });
                    } catch (err) {
                        $rootScope.masterSlave.slaves = {};
                    }
                }
                if (masterSlave.data.enabledAsClient) {
                    try {
                        let master = await $http.get('/api/synchronizer/slave');
                        $rootScope.masterSlave.master = master.data;
                        socket.socket.on("SYNCMASTERSTATE", (data) => {
                            $rootScope.masterSlave.master = data;
                            console.log(data);
                        });
                    } catch (err) {
                        $rootScope.masterSlave.master = false;
                    }
                }
            } catch (error) {
                $rootScope.masterSlave.config = {enabledAsClient: false, enabledAsMaster: false};
            }
            return $rootScope.masterSlave;
        })();

        $scope.getClientCount = () => {
            let on = 0, off = 0;
            for (let i in $rootScope.masterSlave.slaves) {
                if ($rootScope.masterSlave.slaves[i].online) {
                    on++;
                } else {
                    off++
                }
            }
            return on + '/' + (on + off)
        }


        /*$rootScope.notifications = [
            {
                message:  'Értesítés 1',
                url:      ''
            },
            {
                message:  'Értesítés 2',
                url:      'newOffer'
            },
            {
                message:  'Értesítés 3',
                url:      'newOffer'
            }
        ];*/

        /*$rootScope.inbox = [
            {
                message:  'Üzenet 1',
                url:      ''
            },
            {
                message:  'Üzenet 2',
                url:      'hedge'
            }
        ];*/

        /*$rootScope.tasks = [
            {
                message:  'Feladat 1',
                url:      ''
            }
        ];*/

    });
