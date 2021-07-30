ngivr.angular.filter('ngivrReverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});


