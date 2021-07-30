'use strict';
ngivr.angular.config(function ($stateProvider) {
  $stateProvider.state('master.htmlTemplates', {
    url: '/html-template/:id?',
    template: '<ngivr-master-html-template></ngivr-master-html-template>',
  });
});

