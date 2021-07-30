ngivr.angular.config(function ($stateProvider) {
    $stateProvider.state('master.otherDocument', {
        url: '/other-document',
        template: '<ngivr-other-document-container></ngivr-other-document-container>',
    });

    $stateProvider.state('master.otherDocument.document', {
        url: '/document',
        template: '<ngivr-other-document-list></ngivr-other-document-list>',
    });


    $stateProvider.state('master.otherDocument.template', {
        url: '/template',
        template: '<ngivr-other-document-template-list></ngivr-other-document-template-list>',
    });

});

