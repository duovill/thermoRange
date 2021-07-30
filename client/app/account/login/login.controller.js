'use strict';

angular.module('ngIvrApp')
    .controller('LoginCtrl', function ($scope, $rootScope, Auth, $location, $http, socket, Common, $timeout) {
        $scope.user = {};
        $scope.errors = {};
        $scope.fillError = false;
        $scope.userError = false;
        $scope.passwordError = false;
        $scope.loginError = false;
        $scope.showTitle = true;

        $scope.login = function (form) {
            $scope.submitted = true;
            //console.log(form.$valid);
            $scope.fillError = !form.$valid;

            $scope.userError = false;
            $scope.passwordError = false;
            $scope.loginError = false;

            if (form.$valid) {
                $scope.showTitle = true;
                //console.log('login');
                //console.log($scope.user.name);
                //console.log($scope.user.password);

                Auth.login(
                    {
                        name: $scope.user.name,
                        password: $scope.user.password
                    })
                    .then(Auth.load)
                    .catch(function (response) {
                        $scope.errors.other = response.data.message;

                        //if (console.log(string.indexOf(substring) > -1);)

                        Auth.logout()

                        $scope.showTitle = false;

                        if ($scope.errors.other.indexOf('name') > -1) {
                            $scope.userError = true;
                            $scope.passwordError = false;
                            $scope.loginError = false;
                        }
                        else if ($scope.errors.other.indexOf('password') > -1) {
                            $scope.userError = false;
                            $scope.passwordError = true;
                            $scope.loginError = false;
                        }
                        else {
                            $scope.userError = false;
                            $scope.passwordError = false;
                            $scope.loginError = true;
                        }
                    });

            }
            else {
                $scope.showTitle = false;
            }
        };

        /*$scope.$on('$destroy', function () {
         console.log('destroy' );
         socket.unsyncUpdates('newNotification');
         });*/

    });
