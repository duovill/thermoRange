
ngivr.angular.factory('ngivrPdfPopup', ($mdDialog, $timeout) => {

    return new function() {
        const self = this;

        self.showBase64Buffer = (options) => {
            const { data, title, ngIcon } = options;

            $mdDialog.show({
                controller: function ($scope, $mdDialog, ngivrService) {
                    $scope.ngivr = ngivrService;
                    $scope.ok = function () {
                        $mdDialog.hide();
                    };

                    $scope.$watch(function () {
                        const height = $('#ngivr-button-pdf-preview-content').parent().height();
                        return height;
                    }, (newValue, oldValue) => {
                        $scope.height = newValue;
                    })

                },
                multiple: true,
                fullscreen: true,
                template: `
<md-dialog aria-label="${htmlEncode(title)}" layout-fill>
  <md-toolbar>
      <div class="md-toolbar-tools">
        <ng-md-icon icon="${ngIcon}"></ng-md-icon>
        ${title}
        <span flex></span>
          <md-button ng-click="ok()"  style="min-width: 24px;">
            <ng-md-icon icon="close"></ng-md-icon>
          </md-button>
      </div>
    </md-toolbar>
    
    <md-dialog-content flex>
      <div id="ngivr-button-pdf-preview-content">
        <iframe src="${data}" frameborder="0" style="width: 100%; height: {{ height - 15 }}px;"></iframe>      
      </div>
    </md-dialog-content>

    <md-dialog-actions layout="row">
      <span flex></span>
      <md-button ng-click="ok()"  aria-label="">
        <ng-md-icon icon="done"></ng-md-icon>
        OK
      </md-button>
    </md-dialog-actions>
  </form>
</md-dialog>          
          `,

            });

            $timeout(() => {
                ngivr.console.info(`Ez egy bug, nem tudunk mit csinalni vele. Maradt. Bongeszto hiba.
 => Resource interpreted as Document but transferred with MIME type application/pdf
`)
            }, 200)

        }
    }
});
