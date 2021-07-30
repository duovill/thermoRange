'use strict';
ngivr.angular.directive('ngivrLock', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrLock: '<',
            ngivrLockPrefix: '@',
        },
        transclude: {
            'unlocked': 'ngivrLockUnlocked',
        },
        link: (scope, elm, attrs, ctrl) => {
            const ensureArrayLocks = () =>{
                if (!Array.isArray(scope.ngivrLock)) {
                    scope.ngivrLock = [
                        scope.ngivrLock
                    ]
                }
            }
            ensureArrayLocks();
            Object.defineProperty(scope, 'locked', {
                get: () => {
                    ensureArrayLocks();
                    for(let lock of scope.ngivrLock) {
                        if (lock === undefined || lock.locked ) {
                            return true;
                        }
                    }
                    return false;
                }
            } )
        },
        template: `
<span ng-repeat="oneLock in ngivrLock">
  <span ng-if="oneLock.locked">
    <ngivr-button type="button">
        <ng-md-icon icon="lock"></ng-md-icon>
        {{ ngivrLockPrefix }} {{ oneLock.lockedNickname }}
    </ngivr-button>          
  </span>
</span>
<span ng-if="!locked" ng-transclude="unlocked">
</span>
`
    }
});
