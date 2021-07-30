'use strict';
ngivr.angular.directive('ngivrPortlet', function() {
  return {
    restrict: 'E',
    transclude: {
      'body': '?ngivrPortletBody',
      'action': '?ngivrPortletAction',
      'title': '?ngivrPortletTitle',
    },
    scope: {
      ngivrIconFa: '@',
      ngivrTitle: '@',
      ngivrDynamicWidth: '=',
      ngivrPortletStyle: '@',
    },
    link: function(scope, element, attrs, controller, transcludeFn) {
      var portletBody = element.find('ngivr-portlet-body');
      scope.ngivrPortletBodyStyle = portletBody.attr('style');
      scope.ngivrPortletBodyClass = portletBody.attr('class');

      if (scope.ngivrDynamicWidth)
      {
        let set_width = function()
        {
          element.find('.portlet').css('width', scope.ngivrDynamicWidth + 'px');
        };

        scope.$watch('ngivrDynamicWidth', function()
        {
          set_width();
        });

        set_width();
      }
    },
    template: `

<div class="portlet box red" style="{{ ngivrPortletStyle }}">
  <div class="portlet-title ngivr-portlet-title">
    <div class="actions" ng-transclude="action" style="float: right;"></div>
    <div class="caption" style="float: none !important; display: block;">
      <i ng-if="ngivrIconFa !== undefined" class="fa {{ngivrIconFa}}"></i>
      {{ngivrTitle}}
      <div ng-transclude="title"></div>
    </div>
  </div>
  <div class="portlet-body {{ ngivrPortletBodyClass }}" style="{{ngivrPortletBodyStyle}}" ng-transclude="body"></div>
</div>
 
    
    `
  }
});
