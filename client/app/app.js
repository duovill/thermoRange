'use strict';
ngivr.boot();

ngivr.angular = angular.module('ngIvrApp', [
    'btford.socket-io',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngAnimate',
    'ngMessages',
    'ui.router',
    'ngMaterial',
    'ui.bootstrap',
    'ui.validate',
    'chart.js',
    'ngMask',
    'angularUtils.directives.dirPagination',
    'highcharts-ng',
    'angular-jwt',
    'ui.tinymce',
//  'pdf',
    'scrollto',
    'ngMdIcons',
    'angular.filter',
    'ui.codemirror',
    'material.components.autocomplete',
    'angular-bind-html-compile',
    'swipe',
    'treeControl',
    'ngCapsLock',
    'hl.sticky',
    "com.2fdevs.videogular",
    "com.2fdevs.videogular.plugins.controls",
    "com.2fdevs.videogular.plugins.overlayplay",
//    "com.2fdevs.videogular.plugins.poster"
]);

ngivr.angular.config(($mdIconProvider, $qProvider, $stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, $mdThemingProvider, $compileProvider, $mdAriaProvider) => {

    $mdAriaProvider.disableWarnings();
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|javascript|chrome-extension):/);

    $mdIconProvider
        .iconSet('action', '../assets/iconsets/action-icons.svg', 24)
        .iconSet('alert', '../assets/iconsets/alert-icons.svg', 24)
        .iconSet('av', '../assets/iconsets/av-icons.svg', 24)
        .iconSet('communication', '../assets/iconsets/communication-icons.svg', 24)
        .iconSet('content', '../assets/iconsets/content-icons.svg', 24)
        .iconSet('device', '../assets/iconsets/device-icons.svg', 24)
        .iconSet('editor', '../assets/iconsets/editor-icons.svg', 24)
        .iconSet('file', '../assets/iconsets/file-icons.svg', 24)
        .iconSet('hardware', '../assets/iconsets/hardware-icons.svg', 24)
        .iconSet('icons', '../assets/iconsets/icons-icons.svg', 24)
        .iconSet('image', '../assets/iconsets/image-icons.svg', 24)
        .iconSet('maps', '../assets/iconsets/maps-icons.svg', 24)
        .iconSet('navigation', '../assets/iconsets/navigation-icons.svg', 24)
        .iconSet('notification', '../assets/iconsets/notification-icons.svg', 24)
        .iconSet('social', '../assets/iconsets/social-icons.svg', 24)
        .iconSet('toggle', '../assets/iconsets/toggle-icons.svg', 24)
        .iconSet('avatar', '../assets/iconsets/avatar-icons.svg', 128);

    $qProvider.errorOnUnhandledRejections(false);

    $urlRouterProvider.otherwise('/');

    $locationProvider.html5Mode(true);

    $httpProvider.interceptors.push('authInterceptor');
    $httpProvider.interceptors.push('ngivrHttpInterceptor');


    if (typeof(karmaTest) === 'undefined') {
        $mdThemingProvider.definePalette('ngivr-primary',  {
            '50': 'e8eafc',
            '100': 'c5c9f8',
            '200': '9ea6f3',
            '300': '7782ee',
            '400': '5967eb',
            '500': '3c4ce7',
            '600': '3645e4',
            '700': '2e3ce0',
            '800': '2733dd',
            '900': '1a24d7',
            'A100': 'ffffff',
            'A200': 'd7d9ff',
            'A400': 'a4a8ff',
            'A700': '8b8fff',
            'contrastDefaultColor': 'light',
            'contrastDarkColors': [
                '50',
                '100',
                '200',
                '300',
                'A100',
                'A200',
                'A400',
                'A700'
            ],
            'contrastLightColors': [
                '400',
                '500',
                '600',
                '700',
                '800',
                '900'
            ]
        });
        $mdThemingProvider.definePalette('ngivr-accent',  {
            '50': 'fcebe0',
            '100': 'f8ccb3',
            '200': 'f3ab80',
            '300': 'ee894d',
            '400': 'eb6f26',
            '500': 'e75600',
            '600': 'e44f00',
            '700': 'e04500',
            '800': 'dd3c00',
            '900': 'd72b00',
            'A100': 'fffefe',
            'A200': 'ffd2cb',
            'A400': 'ffa698',
            'A700': 'ff907f',
            'contrastDefaultColor': 'light',
            'contrastDarkColors': [
                '50',
                '100',
                '200',
                '300',
                '400',
                'A100',
                'A200',
                'A400',
                'A700'
            ],
            'contrastLightColors': [
                '500',
                '600',
                '700',
                '800',
                '900'
            ]
        });
        $mdThemingProvider.theme('default').primaryPalette('ngivr-primary').accentPalette('grey');
    }

});


ngivr.angular.run(($rootScope, $location, Auth, $window, $http, socket, Common, ngivrConfirm, ngivrService, ngivrSocketLock, jwtHelper, ngivrLoader, ngivrArabesque, $timeout, $state, $mdMedia, $anchorScroll,$mdMenu, $locale) => {

    $locale.NUMBER_FORMATS.GROUP_SEP = ' ';

    $anchorScroll.yOffset = 83;   // always scroll by 50 extra pixels

    ngivr.$timeout = $timeout;

    ngivrLoader.setConfig({
        exclude: [
            '/api/lock'
        ]
    });
    ngivr.electron.arabesque.injectorInterface = ngivrArabesque;

    $rootScope.ngivrStrings = ngivr.strings;
    $rootScope.ngivrConfirm = ngivrConfirm;
    $rootScope.ngivrGrowl = ngivr.growl;
    $rootScope.ngivrConfig = ngivr.config;
    $rootScope.ngivr = ngivrService;
    $rootScope.$state = $state;
    $rootScope.Common = Common;
    $rootScope.$mdMedia = $mdMedia;
    $rootScope.hlStickyTopOffset = $window.innerWidth < 1000 ? 0 : 73;
    ngivrSocketLock.run();

    $rootScope.quickNavInitReady = false;
    $rootScope.fulfilled = false;

    $http.get('/public/settings').then((respone) => {
        const settings = respone.data;
        $rootScope.banner = `&copy Thermo Range | v${settings.version}`;
        $rootScope.settings = settings;
    });

    /**
     * Aktuális mérlegházat kérjük le
     * Jelenleg nem aktív, mert felhasználóhoz kötjük a mérlegházat
     */
    // $http.get('/api/weighingHouses').then((response) => {
    //   $rootScope.weighingHouse = response.data[0]
    // });

    /**
     * Lekérjük az alapértelmezett fizetési módot számlákhoz
     */
    $http.get('/api/fizmod/default').then((response) => {
        $rootScope.defaultPayMode = response.data;
    });

    $rootScope.$on('$stateChangeStart', function (event, next) {
        Auth.isLoggedInAsync(function (loggedIn) {
            if (!loggedIn && $location.path().substring(1) !== 'login') {
                Object.assign(ngivr.state.referrer, location);
                $location.path('/login');
            }
        });
    });

    $rootScope.$on('$locationChangeSuccess', function (event, to, from) {
        $rootScope.previousState = from;
        if ($rootScope.user.role && $location.path().substring(1) === '' && $window.innerWidth < 992) {
            if (!angular.element('.navbar-collapse').hasClass('in')) {
                angular.element('.navbar-collapse').addClass('in');
            }
        } else {
            angular.element('.navbar-collapse').removeClass('in');
        }
    });

    $rootScope.$on('$viewContentLoaded', function () {
        window.scrollTo(0, 0);
    });

    $rootScope.$on('refreshToken', async () => {
        ngivr.console.log('REFRESH TOKEN');
        if (!$rootScope.refreshTokenActive) {
            $rootScope.refreshTokenActive = true;
            try {
                const response = await $http.get('/auth/prolongate');
                const newToken = response.data.token;
                Auth.setToken(newToken)
            } catch (e) {
                console.error(e);
            } finally {
                $rootScope.refreshTokenActive = false;
            }
        }
    });
});
