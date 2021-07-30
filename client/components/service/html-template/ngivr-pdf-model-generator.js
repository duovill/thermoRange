'use strict';
ngivr.angular.factory('ngivrPdfModelGenerator', function() {

  return function($scope, scopeName, schemaName, outputResultData, $timeout) {

    if (schemaName === undefined) {
      schemaName = scopeName;
    }
    if (outputResultData === undefined) {
      outputResultData = schemaName;
    }

    let resultData;
    const generateDateResult = () => {
      resultData = {
        [schemaName]: $scope[scopeName],
      }
    };
    Object.defineProperty($scope, outputResultData, {
      get : function() {
        if (!resultData) {
          generateDateResult();
        }
        return resultData;
      },
    });
    $scope.$watch(scopeName, () => {
      generateDateResult();
      /*
      $timeout(() => {
        $scope.$apply();
      })
      */
    }, true);

  };
});
