'use strict';
ngivr.angular.directive('ngivrButtonPdf', (ngivrService, ngivrTemplatePdf, ngivrButtonPdfShared, socket, $mdDialog, $timeout) => {
    const service = ngivrService;

    return {
        controllerAs: '$ctrl',
        restrict: 'E',
        transclude: true,
        require: '?ngModel',
        scope: {
            ngivrTemplate: '@',
            ngivrData: '<',
            ngivrPreGenerate: '&',
            ngivrPostGenerateWithoutParenthesis: '&',
            ngivrPostGenerate: '&',
            ngivrPreview: '@',
            ngivrFixed: '@',
            url: '=?ngModel',
            ngivrLanguageSwitch: '@',
            style: '@?',
            ngivrDisabled: '=ngDisabled',
            ngivrAdditionalTemplates: '<?'
        },
        template: `


<span ng-if="ngivrFixed === false">
  <span ng-if="!allowed && htmlTemplates.length > 1">
    <ngivr-button ng-style="disabledStyle" style="{{style}}">
      {{ currentTemplate.name }}
    </ngivr-button>
  </span>
  <span ng-if="allowed">
    <md-menu ng-if=" htmlTemplates.length > 1" md-offset="0 45">
        <md-button aria-label="{{ ngivr.strings.htmlTemplate.title.choose }}" class="md-primary md-raised waves-effect waves-whitesmoke"  ng-click="$mdMenu.open($event)" style="margin-top: 5px;">
          <md-tooltip md-direction="right">{{ ngivr.strings.htmlTemplate.title.choose }}</md-tooltip>
          {{ currentTemplate.name }}
          <ng-md-icon icon="arrow_drop_down"></ng-md-icon>
        </md-button>
        <md-menu-content width="1">
          <md-menu-item ng-repeat="htmlTemplateCurrent in htmlTemplates">
            <md-button ng-click="$ctrl.selectTemplate(htmlTemplateCurrent)">
              {{htmlTemplateCurrent.name}}
            </md-button>
          </md-menu-item>
        </md-menu-content>
      </md-menu>
  </span>
</span> 

<ngivr-button ng-if="ngivrPreview === true" ng-disabled="disabled"  ng-click="disabled || $ctrl.preview()" >
    <ng-md-icon icon="pageview"></ng-md-icon>
     {{ ngivr.strings.button.preview }}
</ngivr-button>

<!-- {{ templatePdf.generator.foundTemplate.name }} -->
<ngivr-button ng-disabled="ngivrDisabled || disabled"  ng-click="ngivrDisabled || !allowed || disabled || $ctrl.generatePdf()" ng-style="disabledStyle" style="{{style}}">
    <ng-md-icon icon="picture_as_pdf"></ng-md-icon>
    <span ng-if="instanceCount < 1">
     {{ currentTemplate.label || ngivr.strings.button.generate }}    
    </span>
    <span ng-if="instanceCount > 0">
    <md-tooltip ng-if="!currentTemplate.labelDuplicate" md-direction="top">{{ currentTemplate.label }}</md-tooltip>
     {{ currentTemplate.labelDuplicate || ngivr.strings.button.generateDuplicate }}    
    </span>

</ngivr-button>


<md-input-container style="margin-top: 24px !important; width: 100px !important;" ng-if="currentTemplate.enableInstanceCounter">
  <label>{{ ngivr.strings.htmlTemplate.title.instanceCount}}</label>
  <input ng-model="instanceCount" type="number" min="0" step="1" readonly disabled />
</md-input-container>

<md-input-container style="margin-top: 16px !important; width: 100px !important;" ng-if="currentTemplate.enableInstanceCounter && $root.user.role === 'adminGlobal'">
  <label>Példány változó</label>
    <input style="display: none;" ng-model="instanceCount" type="number" min="0" step="1" readonly disabled />
    <ngivr-icon-fa ngivr-icon-fa="fa-minus" ng-disabled="disabled"  ng-click="disabled ||$ctrl.instanceChanger('decrease')" ngivr-tooltip-direction="top" ngivr-tooltip="A minusz gomb a példányt egyel csökkeni.">
         <md-tooltip md-direction="right"></md-tooltip>
</ngivr-icon-fa>     
        <ngivr-icon-fa ngivr-icon-fa="fa-plus" ng-disabled="disabled"  ng-click="disabled || $ctrl.instanceChanger('increment')" ngivr-color="accent"  ngivr-tooltip-direction="top" ngivr-tooltip="A plusz gomb a példányt egyel növeli.">
</ngivr-icon-fa>
</md-input-container>




<md-input-container style="margin-top: 24px !important; width: 90px !important;">
  <label>{{ ngivr.strings.htmlTemplate.title.copies}}</label>
  <input ng-model="copies" ng-disabled="disabled"  type="number" min="1" step="1" />
</md-input-container>

<md-input-container ng-show="enableLanguageSwitch">
  <label>{{ ngivr.strings.title.language }}</label>
  <ngivr-select-languageng-disabled="disabled"  ng-model="language"/>
</md-input-container>

<!--
<ngivr-button ng-click="$ctrl.download()" ng-disabled="url == undefined">
    <md-tooltip ng-if="url" md-direction="left">
        {{ $ctrl.filename() }}
    </md-tooltip>
    <ng-md-icon icon="file_download"></ng-md-icon>    
     {{ ngivr.strings.button.download }}
</ngivr-button>
-->
`,
        link: function (scope, element, attrs) {
            // unwrap the function
            if (scope.ngivrPostGenerateWithoutParenthesis !== undefined) {
                scope.ngivrPostGenerateWithoutParenthesis = scope.ngivrPostGenerateWithoutParenthesis();
            }
//      console.log(`scope.ngivrPreview before = ${scope.ngivrPreview}`)
            if (scope.ngivrPreview === undefined) {
                scope.ngivrPreview = true;
            } else {
                scope.ngivrPreview = new Boolean(scope.ngivrPreview)
            }

            if (scope.ngivrFixed === undefined) {
                scope.ngivrFixed = false;
            } else {
                scope.ngivrFixed = new Boolean(scope.ngivrFixed);
            }
            if (scope.ngivrLanguageSwitch === undefined) {
                scope.enableLanguageSwitch = false;
            } else {
                scope.enableLanguageSwitch = new Boolean(scope.ngivrLanguageSwitch);
            }



            scope.$watch(function() {
                return element.attr('ngivr-template');
            }, function(newValue){
                // do stuff with newValue
                ///ngivr.growl(`ngiveTemplate ${element.attr('ngivr-template')}`)
                scope.ngivrTemplate = element.attr('ngivr-template')
                if (Array.isArray(scope.htmlTemplates)) {
                    scope.ngivrTemplateRaw = scope.htmlTemplates.find((t) => t.partialName === scope.ngivrTemplate)
                   /// console.warn('new change', scope.ngivrTemplate, scope.ngivrTemplateRaw)
                }
            });


//      console.log(`scope.ngivrPreview after = ${scope.ngivrPreview}`)
        },
        controller: function ($scope) {

            const start = async () => {
                $scope.ngivr = service;

                $scope.disabledStyle = {};

                this.instanceChanger = angular.noop;

                let url;

                $scope.allowed = true;

                $scope.copies = undefined;
                $scope.instanceCount = 0;

                $scope.language = undefined;

                const bullQueueTemplateInstanceGet = (data) => {
                    if (data.status === 'error') {
                        ngivr.exception.handler(data.error)
                        return;
                    }

                    if (data.doc.template === $scope.currentTemplate.partialName) {
                        $scope.instanceCount = data.instanceCount;
                    }
                }

                let socketOnStarted = false;
                const calculateInstanceCount = async (newVal, oldVal) => {
                    if ($scope.ngivrData === undefined || $scope.ngivrData === null) {
                        return;
                    }
                    if ($scope.currentTemplate === undefined || $scope.currentTemplate === null) {
                        return;
                    }
                    const schema = _.camelCase($scope.currentTemplate.mainSchema);

                    // partialName: $scope.currentTemplate.partialName
                    // id: $scope.ngivrData[schema]._id

                    if ($scope.ngivrData[schema] === undefined || $scope.currentTemplate.enableInstanceCounter !== true  || !$scope.ngivrData[schema].hasOwnProperty('_id')) {
                        // ide kell 1-es ha ujra 0 peldany lesz
                        $scope.instanceCount = 0;
                        return;
                    }


                    if (socketOnStarted === false) {
                        socketOnStarted = true;
                        socket.socket.on('bull-queue-template-instance', bullQueueTemplateInstanceGet);

                        $scope.$on('$destroy', function () {
                            socket.socket.removeListener(bullQueueTemplateInstanceGet)
                        });
                    }
//          console.log('jo', $scope.currentTemplate.partialName, $scope.ngivrData[schema]._id)

                    await service.http({
                        url: `/api/queue/template-instance/get/${$scope.currentTemplate.partialName}/${$scope.ngivrData[schema]._id}`,
                        method: 'POST',
                        data: {}
                    })

                    this.instanceChanger = async (type) => {
                        const url = `/api/queue/template-instance/${type}/${$scope.currentTemplate.partialName}/${$scope.ngivrData[schema]._id}`;
                        await service.http({
                            url: url,
                            method: 'POST',
                            data: {}
                        })
                    }


                }


                $scope.$watch('ngivrData', calculateInstanceCount)

                $scope.$watch('currentTemplate', calculateInstanceCount)

                let currentTemplate = undefined;
                Object.defineProperty($scope, 'currentTemplate', {
                    get: () => {
                        return currentTemplate
                    },
                    set: (setCurrentTemplate) => {
                       // console.warn('setCurrentTemplate', setCurrentTemplate)
                        if ($scope.copies === undefined) {
                            $scope.copies = setCurrentTemplate.copies;
                        }
                        if ($scope.language === undefined) {
                            $scope.language = setCurrentTemplate.language;
                        }
                        currentTemplate = setCurrentTemplate;
                        $scope.copies = setCurrentTemplate.copies;
                        $scope.language = setCurrentTemplate.language;
                    }
                })

                $scope.additionalTemplatesRaw = {}

                const subscribe = async (type, item, data) => {
                    $scope.htmlTemplates = data.filter(template => {
                        return template.shown && ($scope.ngivrSchema === undefined || template.partialName === $scope.ngivrTemplate)
                    });
                    $scope.currentTemplate = $scope.htmlTemplates.find(template => {
                        if ($scope.currentTemplate === undefined) {
                            return template.partialName === $scope.ngivrTemplate;
                        }
                        return template.partialName === $scope.currentTemplate.partialName;
                    })
                    if (Array.isArray($scope.ngivrAdditionalTemplates)) {
                        for(let additionTemplate of $scope.ngivrAdditionalTemplates) {
                            $scope.additionalTemplatesRaw[additionTemplate] = data.find(t => t.partialName === additionTemplate)
                        }
                    }
                    $scope.ngivrTemplateRaw = $scope.currentTemplate;
                    this.selectTemplate($scope.currentTemplate);
                };

                $scope.ngivrButton = 'ngivrButton';
                ngivrService.data.all({
                    schema: 'HtmlTemplate',
                    scope: $scope,
                    subscribe: subscribe
                })

                this.selectTemplate = (template) => {
                    $scope.currentTemplate = template;
                    templatePdf = new ngivrTemplatePdf({
                        template: $scope.currentTemplate.name,
                    })

                    // unhook
                    templatePdf.generator.boot();

                    shared = new ngivrButtonPdfShared($scope, templatePdf)
                    this.preview = shared.preview;
                }

                let templatePdf
                $scope.templatePdf = templatePdf;

                this.download = () => {
                    if (url === undefined) {
                        return;
                    }
                    window.open(url);
                }

                this.filename = () => {
                    if (url === undefined) {
                        return '';
                    }
                    try {
                        const fileNameUrl = new URL(url);
                        return ngivr.string.basename(fileNameUrl.pathname);
                    } catch (e) {
                        ngivr.exception.handler(e);
                        return '';
                    }
                }

                let shared;

                this.generatePdf = async () => {

                    ngivr.overlay.show()

                    try {
                        $scope.disabled = true
                        $scope.ngivrTemplateRaw.copies = $scope.copies;
                        $scope.ngivrTemplateRaw.language = $scope.language;

                        const additionalTemplates = []

                        let result = await $scope.ngivrPreGenerate();
                        if (result === 'failed') {
                            ngivr.overlay.hide()
                            $scope.disabled = false;
                            $scope.$apply()
                            return
                        }
                        url = undefined;
                        const pdfRequest = {
                            dataRaw: $scope.ngivrData,
                            template: $scope.ngivrTemplate,
                            templateRaw: $scope.ngivrTemplateRaw,
                            save: true,
                            additionalTemplates: !Array.isArray($scope.ngivrAdditionalTemplates)  ? [] : $scope.ngivrAdditionalTemplates ,
                            additionalTemplatesRaw: $scope.additionalTemplatesRaw,
                        }


                        await new Promise((resolve, reject) => {
                            (async() => {
                                try {
                                    console.warn('ngivrAdditionalTemplates', pdfRequest, $scope.ngivrAdditionalTemplates)
                                    const response = await templatePdf.generate(pdfRequest);
                                    url = response.data.url;

                                    if ($scope.ngivrPostGenerateWithoutParenthesis !== undefined) {
                                        await $scope.ngivrPostGenerateWithoutParenthesis(url);
                                    }

                                    if ($scope.ngivrPostGenerate !== undefined) {
                                        await $scope.ngivrPostGenerate();
                                    }

                                    //ngivr.growl(ngivr.strings.message.popupBlock)
                                    ngivr.overlay.hide()

                                    if (ngivr.isElectron()) {
                                        resolve()
                                        window.open(url);
                                        return;
                                    }
                                    resolve()

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
<md-dialog aria-label="PDF" layout-fill>
  <md-toolbar>
      <div class="md-toolbar-tools">
        <ng-md-icon icon="picture_as_pdf"></ng-md-icon>
        PDF
        <span flex></span>
      </div>
    </md-toolbar>
    
    <md-dialog-content flex>
      <div id="ngivr-button-pdf-preview-content">
        <iframe src="${url}" frameborder="0" style="width: 100%; height: {{ height - 15 }}px;"></iframe>      
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


                                    // window.open(url);
                                    /*
                                              $scope.disabledStyle = {
                                                opacity: '0.5'
                                              }
                                              $scope.allowed = false;
                                    */

                                } catch(e) {
                                    ngivr.overlay.hide()
                                    reject(e)
                                }

                            })()
                        })

                    } catch (e) {
                        url = undefined;
                        ngivr.exception.handler(e);
                    } finally {
                        ngivr.overlay.hide()
                        $scope.disabled = false;
                        $scope.$apply()
                    }
                }
            };
            start();
        }
    }
});
