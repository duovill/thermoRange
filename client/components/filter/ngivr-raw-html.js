'use strict';
ngivr.angular.filter('ngivrRawHtml', function($sce) { return $sce.trustAsHtml; });
