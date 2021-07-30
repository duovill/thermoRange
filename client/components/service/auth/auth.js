'use strict';

angular.module('ngIvrApp')
    .factory('Auth', function Auth($location, $rootScope, $http, User, $q, socket, Common, ngivrService, jwtHelper, $timeout, $cookies) {

        let timeoutLogin;

        const allRoles = Object.keys(ngivr.settings.user.role);


        const load = (user) => {

            ngivr.socket.synch.clear();

            currentUser = user;
            $rootScope.user = currentUser;
            $rootScope.weighingHouse = currentUser.weighingHouse; //felhasználózoz rendelt mérlegház

            /**
             * Saját cég adatainak lekéréséhez dataQuery
             */
            $rootScope.queryOwnFirm = ngivrService.data.query({
                schema: 'partner',
                $scope: 'user-destroy',
                subscribe: async (promise) => {
                    try {
                        const response = await promise;
                        const data = Object.assign({}, response.data);
                        $rootScope.ngivr.settings.ownFirm = data.docs[0];
                        for (let vatNumber of data.docs[0].vatNumbers) {
                            if (vatNumber.vatNumberType === 'HU') {
                                $rootScope.ngivr.settings.ownFirm.vatNumberHU = vatNumber.number;
                                break;
                            }
                        }
                        delete data['docs'];
                    } catch (e) {
                        ngivr.growl.error(e);
                    }
                }
            });

            $rootScope.queryOwnFirm.query({limit: 0, search: {sygnus: true}});


            $http.get('/api/newNotifications', {params: {_id: user._id}}).then(function (response) { //lekérjük azokat az értesítéseket, melyek "to" mezőjében szerepel az aktuális user id-ja
                let newNotifications = response.data;
                $rootScope.notifications = newNotifications;	//tömb feltöltése
                $rootScope.notifications.sort(function (a, b) {
                    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
                });
                socket.syncUpdates($rootScope, 'newNotification', $rootScope.notifications
                    , function (event, item, object) {
                        if (item.to.indexOf($rootScope.user._id) === -1) {   //ha a frissített értesítés nem tartalmazza a user id-ját
                            const idx = Common.functiontofindIndexByKeyValue($rootScope.notifications, "_id", item._id);
                            $rootScope.notifications.splice(idx, 1);                     //töröljük az értesítést a listából
                        }
                        $rootScope.notifications.sort(function (a, b) {
                            return Date.parse(b.createdAt) - Date.parse(a.createdAt);
                        });
                    });

            });

            $http.get('/api/newMessages', {params: {_id: user._id}}).then(function (response) { //lekérjük azokat az üzeneteket, melyek "to" mezőjében szerepel az aktuális user id-ja
                let newMessages = response.data;
                $rootScope.messages = newMessages;	//tömb feltöltése
                $rootScope.messages.sort(function (a, b) {
                    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
                });
                socket.syncUpdates($rootScope, 'newMessage', $rootScope.messages
                    , function (event, item, object) {
                        if (item.to.indexOf($rootScope.user._id) === -1) {   //ha a frissített értesítés nem tartalmazza a user id-ját
                            const idx = Common.functiontofindIndexByKeyValue($rootScope.messages, "_id", item._id);
                            $rootScope.messages.splice(idx, 1);                     //töröljük az értesítést a listából
                        }
                        $rootScope.messages.sort(function (a, b) {
                            return Date.parse(b.createdAt) - Date.parse(a.createdAt);
                        });
                    });

            });

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

            if (ngivr.referrer.isUnique) {
                ngivr.referrer.forward($location);
                return;
            }

            if (user.role === $rootScope.ngivr.settings.user.role.hedger) {
                $location.path('/hedge');
            } else {
                $location.path('/');
            }
            /*const query = {offer: true, submitted: true, deletedOffer: false};                                                         //feltétel a lekérdezéshez
            $http.get('/api/contracts', {params: query}).then(function (response) {    //szerződések lekérdezése
              //console.log(selectedcontracts);
              let selectedcontracts = response.data;
              $rootScope.contractsNotify = selectedcontracts;

              if (ngivr.referrer.isUnique) {
                ngivr.referrer.forward($location);
                return;
              }

              if (user.role == $rootScope.ngivr.settings.user.role.hedger) {
                $location.path('/hedge');
              } else {
                $location.path('/');
              }
            });*/
        };

        // ha setTokenParameter === undefined a funkcioja, olyan, mintha clearToken neve lenne
        // setToken = clearToken, felhasznaljuk
        let signedOutAlready = false;
        const setToken = (setTokenParameter) => {
//            console.log('setToken', 'setTokenParameter', setTokenParameter)
            if (setTokenParameter === undefined) {
//                console.log('clearToken')
                if (signedOutAlready) {
//                    console.log('clearToken already logged in')
                    return;
                }
//                console.log('clearToken already signing out')
                signedOutAlready = true;
                $cookies.remove('token');
                $cookies.remove('selectTab');
                $cookies.remove('selectSubTab');
                token = undefined;
                currentUser = {};
                $rootScope.user = currentUser;
            } else {
//                console.log('setToken login')
                signedOutAlready = false;
                $cookies.put('token', setTokenParameter, {
                    expires: jwtHelper.getTokenExpirationDate(setTokenParameter),
                });
            }
            socket.newToken({
                token: setTokenParameter,
                user: currentUser.hasOwnProperty('toJSON') ? currentUser.toJSON() : currentUser
            })

        };
        const clearToken = setToken;

        let currentUser = {};
        let token = $cookies.get('token');
        if (token) {
            User.get().$promise.then(load);
        }

        return {

            load: load,

            /**
             * Authenticate user and save token
             *
             * @param  {Object}   user     - login info
             * @return {Promise}
             */
            login: function (user) {

                return $http.post('/auth/local', {
                    name: user.name,
                    password: user.password
                }).then(function (response) {
                    let data = response.data;
                    /*
                                        Cookies.set('token', data.token, {
                                            expires: jwtHelper.getTokenExpirationDate(data.token),
                                        });
                                        socket.newToken(data.token)
                    */
                    setToken(data.token);

                    return User.get().$promise;
                })
            },

            /**
             * remove access token and user info
             *
             */
            logout: function () {
                if ($rootScope.queryOwnFirm !== undefined) {
                    $rootScope.queryOwnFirm.unsubscribe();
                    $rootScope.queryOwnFirm = undefined
                }
                $rootScope.user = {};
                currentUser = {};
                clearToken();
                $timeout.cancel(timeoutLogin);
                timeoutLogin = $timeout(() => {
                    $location.path('/login');
                    $rootScope.$digest()
                }, 100 /* ngivr.settings.debounce */)
            },

            /**
             * create a new user
             *
             * @param  {Object}   user     - user info
             * @param  {Function} callback - optional
             * @return {Promise}
             */
            createUser: function (user, callback) {
                let cb = callback || angular.noop;

                return User.save(user)//,
                /*function(data) {
                  Cookies.set('token', data.token);
                  currentUser = User.get();
                  return cb(user);
                },
                function(err) {
                  this.logout();
                  return cb(err);
                }.bind(this)).$promise;*/
            },

            /**
             * Change password
             *
             * @param  {String}   oldPassword
             * @param  {String}   newPassword
             * @param  {Function} callback    - optional
             * @return {Promise}
             */
            changePassword: function (oldPassword, newPassword, callback) {
                const cb = callback || angular.noop;

                return User.changePassword({id: currentUser._id}, {
                    oldPassword: oldPassword,
                    newPassword: newPassword
                }, function (user) {
                    return cb(user);
                }, function (err) {
                    return cb(err);
                }).$promise;
            },

            /**
             * Change quickNavLinks
             *
             * @param  {[String]}   quickNavLinks
             * @param  {Function} callback    - optional
             * @return {Promise}
             */
            changequickNavLinks: function (quickNavLinks, callback) {
                const cb = callback || angular.noop;

                return User.changequickNavLinks({id: currentUser._id}, {
                    quickNavLinks: quickNavLinks
                }, function (user) {
                    return cb(user);
                }, function (err) {
                    return cb(err);
                }).$promise;
            },

            /**
             * Gets all available info on authenticated user
             *
             * @return {Object} user
             */
            getCurrentUser: function () {
                return currentUser;
            },

            /**
             * Get the current user id.
             * @returns {int}
             */
            getCurrentUserId: function () {
                return currentUser._id;
            },

            /**
             * Check if a user is logged in
             *
             * @return {Boolean}
             */
            isLoggedIn: function () {
                return currentUser.hasOwnProperty('role');
            },

            /**
             * Waits for currentUser to resolve before checking if user is logged in
             */
            isLoggedInAsync: function (cb) {
                if (currentUser.hasOwnProperty('$promise')) {
                    currentUser.$promise.then(function () {
                        cb(true);
                    }).catch(function () {
                        cb(false);
                    });
                } else if (currentUser.hasOwnProperty('role')) {
                    cb(true);
                } else {
                    cb(false);
                }
            },

            /**
             * Check if a user is an admin
             *
             * @return {Boolean}
             */
            isAdmin: function () {
                return currentUser.role == $rootScope.ngivr.settings.user.role.adminGlobal || currentUser.role == $rootScope.ngivr.settings.user.role.adminLogistic;
            },

            isGlobalAdmin: function () {
                return $rootScope.user.role == $rootScope.ngivr.settings.user.role.adminGlobal;
            },

            /**
             * Get auth token
             */
            getToken: function () {
                return $cookies.get('token');
            },

            setToken: setToken,

            clearToken: clearToken,

            hasRole: (roles) => {
                if (!Array.isArray(roles)) {
                    roles = [roles]
                }
//                console.warn(roles);
//                console.warn($rootScope.user);
                for (let role of roles) {
//                    console.warn(role);
                    if (allRoles.includes(role) && $rootScope.user.role === role) {
//                        console.warn('found');
                        return true;
                    }
                }
                return false;
            }
        };
    });
