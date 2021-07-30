ngivr.angular.filter('ngivrDepotsWithProductFilter', function () {
  return function (items, edited) {
    if (edited) {
      return items
    }
    return items.filter((o) => {
      return o.quantity > 0
    });
  };
});
