'use strict';
ngivr.angular.factory('ngivrPrompt', function($mdDialog) {
  return function(options) {

    const confirm = $mdDialog.prompt()
      .title(options.title)
      .textContent(options.textContent)
      .placeholder(options.placeholder)
      .ariaLabel(options.ariaLabel)
      .initialValue(options.initialValue)
      .targetEvent(event)
        .required(true)
      .ok('Rendben')
      .cancel('Mégsem');
    return $mdDialog.show(confirm);
  }
});
