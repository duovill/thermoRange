'use strict';
ngivr.angular.service('ngivrInput', function(ngivrService) {
  const self = this;

  self.select = {
      link: (scope) => {
        scope.ngivr = ngivrService;
        ngivr.event.on.form.enabled(scope, function (ev, value) {
          //ngivr.growl(`enabled: ${value}`);
          scope.enabled = value;
        })
      }
  };

});


