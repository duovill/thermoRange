ngivr.angular.decorator('mdTabsDirective', ($delegate,) => {

  $delegate.forEach((mdTabsItem) => {
    mdTabsItem.compile = function(element, attributes){
      return {
        post: function(scope, element, attributes, controller, transcludeFn){
          controller.shouldPaginate = true;
        }
      }
    }
  });
  return( $delegate );
});
