'use strict';
ngivr.angular.filter('ngivrInterpolate', function($interpolate) {
  return function(input, data) {
//    console.log('input', input, 'data', data);
    if (input === undefined) {
      const message = 'ngivrInterpolate input = undefined';
      //console.error(message)
      return message
    }
    const template = $interpolate(input)({
      data: data
    });
//    const templateResult = template($scope);
//    console.log('templateResult', templateResult);
    return template;
  };
});
