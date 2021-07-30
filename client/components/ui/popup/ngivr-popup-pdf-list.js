ngivr.angular.factory('ngivrPopupPdfList', function (ngivrException, $mdDialog, ngivrHttp, ngivrPdfPopup, ngivrService, socket) {
    return function () {

        this.show = (opts) => {
            // console.warn('ngivrDigiStoreListContractPdf', opts)
            return $mdDialog.show({
                template: `
                
<md-dialog  layout-fill>
  <md-toolbar>
      <div class="md-toolbar-tools">
        <ng-md-icon icon="picture_as_pdf"></ng-md-icon>
        PDF Lista
        <span flex></span>
          <md-button ng-click="done()"  style="min-width: 24px;">
            <ng-md-icon icon="close"></ng-md-icon>
          </md-button>
      </div>
    </md-toolbar>
    
    <md-dialog-content flex layout-padding style="overflow-x: hidden">

        <div layout="column" layout-gt-sm="row">
        
            <div flex="50" >
                <h4 class="md-title">${opts.qrLabel}</h4>
            
                <ngivr-button-pdf-qr  ngivr-template="${opts.qrTemplate}" ngivr-data="ngivrData" ></ngivr-button-pdf-qr>  
                <br/>
            
                <div ng-if="opts.relatedEnabled">
                    <h4 class="md-title">Kapcsolódó dokumentum</h4>                
                     <md-input-container>
                         <label>Típus</label>
                          <md-select ng-model="relatedPdf.selected">                         
                            <md-option ng-repeat="relatedPdfSelectItem in relatedPdfSelect()" ng-value="relatedPdfSelectItem.schema">
                              {{relatedPdfSelectItem.label}}
                            </md-option>
                          </md-select>
                    </md-input-container>
                    
                     <md-input-container>               
                        <md-autocomplete  class="ngivr-autocomplete" style="margin-top: 14px" ng-if="relatedPdf.selected"
                          md-selected-item="relatedPdf.querySelected"
                         
                          md-search-text="relatedPdf.querySelectedText"
                          md-selected-item-change="queryRelatedPdfSelectedChanged(item)"
                          md-items="item in queryRelatedSearch(relatedPdf.querySelectedText)"
                          md-item-text="item.display"
                                 
                        <md-item-template>
                          <span md-highlight-text="relatedPdf.querySelectedText" md-highlight-flags="^i">{{item.display}}</span>
                        </md-item-template>
                        <md-not-found>
                          Nincs ilyen dokumentum
                        </md-not-found>
                      </md-autocomplete>
                    </md-input-container>
                    
                    <span ng-if="relatedPdf.selectedDoc" style="display: inline-block; position: relative; top: 12px;">
                        <!--{{ relatedPdf.selectedDoc.display }}-->
                         <md-button class="md-raised md-primary" ng-if="!relatedPdf.isValidated" ng-click="relatedPdf.isValidated = true">
                            <i class="fa fa-plus"></i>
                            Lista hozzáadás
                        </md-button>
                         <md-button class="md-raised md-primary"  ng-if="relatedPdf.isValidated"  ng-click="relatedPdf.isValidated = false; relatedPdf.selectedDoc = undefined; relatedPdf.querySelectedText = undefined">
                            <i class="fa fa-minus"></i>
                            Törlés
                        </md-button>
                    </span>
                    
                </div>

                <h4 class="md-title">PDF Dokumentum Feltöltés</h4>
                
                <form novalidate name="ngivrPopupPdfList" ng-submit="submit()" style="padding-right: 5px">
                    <md-input-container class="md-block" >
                        <label>Fájl neve</label>
                        <input required name="pdfTemplateLabel" ng-model="model.pdfTemplateLabel"/>
                        <div ng-messages="ngivrPopupPdfList.pdfTemplateLabel.$error">
                           <div ng-message="required">Kötelező</div>
                        </div>
                    </md-input-container>
                
                    <div layout="row">
                        <div flex>
                            <md-input-container  class="md-block"  >
                                <input required name="upload" id="{{ uploadId }}" ngivr-model-file ngivr-validation-filextension="pdf" ng-model="model.upload" type="file" class="ng-hide"/>
                                <div style="border-bottom: 1px dotted grey !important;">{{ model.upload[0].name }}</div>
                                <div ng-messages="ngivrPopupPdfList.upload.$error">
                                    <div ng-message="required">Kötelező</div>
                                    <div ng-message="ngivrValidationFilextension">Csak PDF fájl lehet</div>
                                </div>
                                <div style="opacity: 0.5; font-size: 10px">Feltöltés</div>
                            </md-input-container>                        
                        </div>                    
                        <div flex="5">
                            <md-button id="uploadButton" class="md-fab md-mini md-primary" ng-click="chooseUpload()" style="cursor: pointer;">
                                <ng-md-icon icon="attach_file"></ng-md-icon>
                            </md-button>
                        </div>
                    </div>
                    <br/>
                    <div style="text-align: right">
                      <md-button class="md-raised md-primary" type="submit">
                            <i class="fa fa-upload"></i>
                            Feltöltés
                        </md-button>                    
                    </div>
                    
                </form>
                
            </div>
            
                <div flex="50" >
               <h4 class="md-title">${opts.title}</h4>            

                <div ng-repeat="pdf in doc.ngivrPdf" >
                   <ngivr-button ngivr-type="flat" ng-click="openPdf({ doc: doc, pdf: pdf, version:  doc.ngivrPdf.length - $index})" style="width: 90%; text-align: left">
                        {{ pdf.pdfTemplateLabel || "Ismeretlen dokumentum" }} <span ng-if="pdf.instanceCount">,{{ pdf.instanceCount }}. példány</span>
                    <!--
                    v{{ doc.ngivrPdf.length - $index }}
                    -->
                    </ngivr-button>                
                </div>
                <span ng-if="doc.ngivrPdf.length === 0">
                    Nincs PDF
                </span>

                <div ng-if="relatedPdf.isValidated">
                    <div ng-if="relatedPdf.selectedDoc">
                       <h4 class="md-title">Kapcsolodó {{ relatedPdf.relatedLabel }} dokumentumok</h4>            
                        
                    <div ng-repeat="pdf in relatedPdf.selectedDoc.doc.ngivrPdf" >
                       <ngivr-button ngivr-type="flat" ng-click="openPdf({ doc: doc, pdf: pdf, version:  doc.ngivrPdf.length - $index})" style="width: 90%; text-align: left">
                            {{ pdf.pdfTemplateLabel || "Ismeretlen dokumentum" }} <span ng-if="pdf.instanceCount">,{{ pdf.instanceCount }}. példány</span>
                        <!--
                        v{{ doc.ngivrPdf.length - $index }}
                        -->
                        </ngivr-button>                
                    </div>
                    <span ng-if="relatedPdf.selectedDoc.doc.ngivrPdf.length === 0">
                        Nincs PDF
                    </span>
                    </div>                
                </div>


            </div>
        </div>
                

    </md-dialog-content>

    <md-dialog-actions layout="row">
      <span flex></span>
      <md-button ng-click="done()"  aria-label="">
        <ng-md-icon icon="done"></ng-md-icon>
        OK
      </md-button>
    </md-dialog-actions>
  </form>
</md-dialog>       
`,
                multiple: true,
                clickOutsideToClose: true,
                controller: function ($scope, ngivrService) {

                    if (opts.relatedEnabled === undefined) {
                        opts.relatedEnabled = true
                    }

                    $scope.doc = opts.doc
                    $scope.opts = opts
                    $scope.ngivrData = {
                        [opts.schema]: opts.doc
                    }

                    $scope.uploadId = ngivr.nextId()

                    // ISO-8859-1 / UTF-8
                    $scope.chooseUpload = () => {
                        $('#' + $scope.uploadId).click();
                    }

                    const modelBase = {
                        upload: undefined,
                        pdfTemplateLabel: undefined,
                        get uploadFilename() {
                            if (this.upload === undefined || this.upload.length === 0) {
                                return '';
                            }
                            return this.upload[0].name
                        },
                        get uploadFileExtension() {
                            const filename = this.uploadFilename.split('.');
                            return filename[filename.length - 1].toLowerCase()
                        },
                    }

                    $scope.model = angular.copy(modelBase)


                    $scope.openPdf = async (opts) => {
                        console.warn(opts)
                        const {doc, pdf, version} = opts;

                        try {
                            const url = `${location.origin}/api/pdfDocuments/download/${pdf._id}`
                            //console.warn('ngivrButtonPdfExistingPopup', $scope.ngivrSchema, $scope.ngivrId)
                            if (ngivr.isElectron()) {
                                window.open(url);
                                return;
                            }

                            /*
                            console.warn('pdf', pdf)
                            const response = await ngivrHttp.get(`api/pdfDocuments/download/${pdf._id}`, {responseType: "arraybuffer"});
                            console.warn('response data', response.data.byteLength, response.data)
                            const data = ngivr.base64.arrayBufferToBase64(response.data);
                            console.warn('data', data.length)
                            */
                            ngivrPdfPopup.showBase64Buffer({
                                data: url,
                                ngIcon: 'attachment',
                                title: pdf.pdfTemplateLabel || 'Ismeretlen dokumentum'
                            })
                        } catch (e) {
                            ngivrException.handler(e)
                        }
                    }
                    $scope.done = function () {
                        $mdDialog.cancel();
                    };

                    const dataModule = ngivrService.data.query({
                        schema: opts.schema,
                        $scope: $scope,
                        query: {
                            search: {
                                _id: $scope.doc._id,
                            },
                            populate: [
                                {
                                    schema: 'ngivrPdf',
                                    fields: {
                                        _id: 1,
                                        createdAt: 1,
                                        updatedAt: 1,
                                        pdfTemplate: 1,
                                        pdfTemplateLabel: 1,
                                        instanceCount: 1,
                                    }
                                }
                            ]
                        },
                        subscribe: async(promise) => {
                            try {
                                //  console.log('subscribe contract')
                                const response = await promise;
                                //console.warn('response.data.docs', response.data.docs)
                                if (response.data.docs.length === 1 && $scope.doc._id === response.data.docs[0]._id)
                                    $scope.doc = response.data.docs[0];
                                // console.warn('response', response)
                            } catch(e) {
                                ngivrException.handler(e)
                            }
                        }
                    });

                    const socketDigiContractUpload = async (data) => {
                        try {
                            switch (data.action) {
                                case 'ok':
                                    $scope.ngivrPopupPdfList.$setPristine();
                                    $scope.model = angular.copy(modelBase)
                                    $scope.ngivrPopupPdfList.$setUntouched();
                                    ngivr.growl('Sikeres feltöltés')

                                    dataModule.query();
                                    break;

                                case 'error':
                                    ngivr.exception.handler(e)
                                    break;
                            }
                        } catch (e) {
                            ngivrException.handler(e)
                        }
                    }

                    $scope.$on('$destroy', () => {
                        socket.ioClient.removeListener($scope.uploadId, socketDigiContractUpload)
                    })

                    socket.ioClient.on($scope.uploadId, socketDigiContractUpload)

                    $scope.submit = async () => {

                        try {
                            if (!ngivrService.form.validate($scope.ngivrPopupPdfList)) {
                                return;
                            }

                            //console.log('$scope.model', $scope.model, $scope.ngivrProductUploadPopup)

                            const fileBlob = await ngivr.fileToBase64($scope.model.upload[0])
                            //console.log(fileBlob, $scope.model.uploadFilename, $scope.model.uploadFileExtension)

                            socket.ioClient.emit('ngivr-pdf-upload', {
                                upload: fileBlob,
                                uploadId: $scope.uploadId,
                                pdfTemplateLabel: $scope.model.pdfTemplateLabel,
                                docType: opts.schema,
                                doc: $scope.doc,
                                socketId: socket.ioClient.id,
                            })


                            //$mdDialog.cancel();
                        } catch (e) {
                            ngivr.exception.handler(e)
                        }
                    }


                    //console.warn('$scope.doc.ngivrPdf', $scope.doc.ngivrPdf)
                    if ($scope.doc.ngivrPdf === undefined) {
                        dataModule.query();
                    }

                    $scope.relatedPdf = {
                        selected: undefined,
                        querySelected: undefined,
                        querySelectedText: undefined,
                        selectedDoc: undefined,
                        relatedLabel: undefined,
                        isValidated: false,
                    }

                    const relatedPdfSelect = []
                    $scope.relatedPdfSelect = () => {
                        if (relatedPdfSelect.length === 0 ) {
                            for(let relatedSchemaKey of Object.keys(ngivr.settings.pdfRelated.schemas)) {
                                const pascalSchema = ngivr.string.pascalCase(relatedSchemaKey)
                                if (relatedSchemaKey === opts.schema) {
                                    continue
                                }
                                const item = {
                                    schema: relatedSchemaKey,
                                    label: ngivr.strings.schema[pascalSchema]
                                }
                                relatedPdfSelect.push(item)
                            }
                            $scope.relatedPdf.selected = relatedPdfSelect[0].schema
                        }
                        return relatedPdfSelect
                    }

                    let ngivrQueryRelated
                    $scope.$watch('relatedPdf.selected', (newVal, oldVal) => {
                        if (ngivrQueryRelated !== undefined) {
                            ngivrQueryRelated.unsubscribe()
                            ngivrQueryRelated = undefined
                        }
                        if (typeof  newVal === 'string') {
                            ngivrQueryRelated =  ngivrService.data.query({
                                schema: newVal,
                                $scope: $scope,
                            });
                            const pascalSchema = ngivr.string.pascalCase(newVal)
                            $scope.relatedPdf.relatedLabel = ngivr.strings.schema[pascalSchema].toLowerCase()

                        }
                        $scope.relatedPdf.isValidated = false
                    })



                    $scope.queryRelatedPdfSelectedChanged = (selectedOpts) => {

                        if (selectedOpts === undefined) {
                            $scope.relatedPdf.selectedDoc = undefined
                            return
                        }
                        $scope.relatedPdf.selectedDoc = selectedOpts
                        $scope.relatedPdf.isValidated = false
                    }

                    $scope.queryRelatedSearch = async (text) => {
                        //console.warn('queryRelatedSearch', text)
                        $scope.relatedPdf.selectedDoc = undefined
                        try {
                            const response = await ngivrQueryRelated.query({
                                limit: 25,
                                search: ngivr.settings.pdfRelated.schemas[$scope.relatedPdf.selected].genQuerySearch(text),
                                populate: [
                                    {
                                        schema: 'ngivrPdf',
                                        fields: {
                                            _id: 1,
                                            createdAt: 1,
                                            updatedAt: 1,
                                            pdfTemplate: 1,
                                            pdfTemplateLabel: 1,
                                            instanceCount: 1,
                                        }
                                    }
                                ]
                            });
                            const result = response.data.docs.map((doc) => {
                                return {
                                    display:  ngivr.settings.pdfRelated.schemas[$scope.relatedPdf.selected].genQuerySearchDisplay(doc),
                                    doc: doc,
                                }
                            })
                            //console.warn('queryRelatedSearch response', response)
                            //console.warn('queryRelatedSearch result', result)
                            return result
                        } catch(e) {
                            ngivr.exception.handler(e)
                        }
                    }

                }
            });

        }

    }
});
