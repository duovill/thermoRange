'use strict';
ngivr.angular.factory('ngivrTemplateGenerator', function (ngivrService, $compile, $rootScope, $timeout, $interpolate, $sce, ngivrTemplateSchemaHelper, socket) {

    const service = ngivrService;

    let templates;

    let booted = false;

    const start = async () => {
        if (booted) {
            return;
        }
        const serviceData = service.data.query({
            schema: 'HtmlTemplate',
            $scope: 'user-destroy',
            subscribe: async (promise) => {
                const response = await promise;
                templates = response.data.docs
            }
        })
        const response = await serviceData.query({
            limit: 0
        });
        templates = response.data.docs;
        booted = true;
    }

    return class {

        constructor(options) {
            this.options = options;
        }

        async boot() {
            if (this.bootPromise === undefined) {

                let resolver, rejecter;
                this.bootPromise = new Promise((resolve, reject) => {
                    resolver = resolve
                    rejecter = reject
                });

                try {
                    if (!booted) {
                        await start();
                    }
                    if (this.options !== undefined && this.options.hasOwnProperty('template') && this.options.template !== undefined) {
                        this.template = this.options.template;
                        this.findTemplate();
                    }
                    resolver();
                } catch (e) {
                    rejecter(e);
                }
            }
            return this.bootPromise;
        }

        getTemplates() {
            return templates;
        }

        generateTemplate(template) {

            let hidePageBreak = ''
            if (_.hasIn(this.generateOptions, 'hidePagebreak') && this.generateOptions.hidePagebreak === true) {
                hidePageBreak = `
.ngivr-template-page-break {
   height: 0px;
  border-top-style: none;
}

ngivr-html-template-include {
  background-color: transparent;
}

`;
            }

            return `
${template}
`;
        }

        /**
         * Generate the qr image, first it parses the data.
         */
        generateQr() {
//            console.warn('qr code betenni a schema nevet', this)
            const dividerName = ngivr.settings.qr.recognize.ngivrQrDividerName
            const vars = this.foundTemplate.qrVars.map((element) => {
                return btoa(element) + dividerName + '{{ $encodeBase64(' + element + ') }}';
            });
            const divider = ngivr.settings.qr.recognize.ngivrQrDivider
            const qrTemplate = vars.join(divider);
            const data = ngivr.json.clone(this.data)
            data.$encodeBase64 = (val) => btoa(val);
            //console.warn(vars, data)
            const qrText = $interpolate(qrTemplate)(data);
            return service.http.get('/api/qrcode/send?text=' + ngivr.settings.qr.recognize.ngivrPrefix + divider + btoa(this.schemaName) + divider + qrText);
        };

        /**
         * Generates a template from html.
         * @param rawHtml
         */
        async generateHtml(options, generateOptions) {


            let rejecter, resovler;
            const promise = new Promise((resolve, reject) => {
                rejecter = reject;
                resovler = resolve;
            })

            let destroyScope;

//      let generateCount = 0;

            const requestId = ngivr.nextId()
            const generatePdf = async () => {
                let {rawHtml, qrRaw} = options;
                rawHtml = rawHtml.replace(/{{( )*qr( )*}}/g, `<span ng-bind-html="qr"></span>`)
//        generateCount++;
//        console.log(`before compile ${generateCount} ${this.foundTemplate.partialName}`)
//        console.log(`after compile ${generateCount} ${this.foundTemplate.partialName}`)

                const startGenerate = () => {
//          console.log(`generate template, same scope??? ${this.foundTemplate.partialName}`);
                    const template = $compile(rawHtml);
                    const templateResult = template(scope);
                    const container = $('<div/>');
                    $('body').append(container);
                    container.append(templateResult);
                    container.hide();

                    $timeout(() => {
                        $timeout(() => {
                            const result = container.html();
//          console.log(rawHtml);
//          console.log(result);
//          console.log(result);
                            container.remove();
                            if (destroyScope !== undefined) {
                                destroyScope();
                            }
                            const resolveData = {
                                generateHtml: result,
                                instanceCount: scope.instanceCount,
                            };
                            resovler(resolveData)
                        })
                    })
                }

                let data = this.data
                if (ngivrTemplateSchemaHelper.templatePreRender.hasOwnProperty(this.foundTemplate.partialName)) {
                    data = await ngivrTemplateSchemaHelper.templatePreRender[this.foundTemplate.partialName](_.clone(this.data));
                }
                const foundTemplate = angular.copy(this.foundTemplate);
                const scope = Object.assign($rootScope.$new(), data);
                scope.generator = this;
                scope.generator.templates = templates;
                scope.template = foundTemplate

//      console.log(scope.instanceCount);
                if (foundTemplate.language === undefined) {
                    foundTemplate.language = 'hu'
                    this.foundTemplate.language = 'hu'
                }

                try {
                    scope.strings = ngivr.translate[foundTemplate.language].pdf[foundTemplate.partialName];
                } catch (e) {
                    console.warn(e)
                }

                scope.language = this.foundTemplate.language;
                scope.stringsCommon = ngivr.translate[foundTemplate.language].pdfCommon;
                scope.helper = ngivrTemplateSchemaHelper;
                scope.qr = $sce.trustAsHtml(this.qrImageGlobal);
                scope.qrRaw = qrRaw;
                scope.ngivr = ngivrService;

                if (this.foundTemplate.enableInstanceCounter !== true || this.generateOptions === undefined || (_.hasIn(this.generateOptions, 'save') && this.generateOptions.save !== true)) {
                    scope.instanceCount = ngivr.translate[this.foundTemplate.language].button.preview;
                    startGenerate();
                } else {
                    const bullQueueTemplateInstanceIncrease = (data) => {
                        if (requestId !== data.requestId) {
                            return
                        }
                        if (data.status === 'error') {
                            console.error('bull error', data)
                            ngivr.exception.handler(data.error)
                            destroyScope();
                            return;
                        }
                        if (data.doc.template === this.foundTemplate.partialName) {
                            scope.instanceCount = data.instanceCount;
                            startGenerate();
                        }
                    }

                    socket.socket.on('bull-queue-template-instance', bullQueueTemplateInstanceIncrease);

                    destroyScope = scope.$on('$destroy', function () {
                        socket.socket.removeListener(bullQueueTemplateInstanceIncrease)
                    });
                }
            }


            if (_.hasIn(this.generateOptions, 'save') && this.generateOptions.save === true) {
//TODO ha ezt felcsereled neha nem kapja meg aza aladot es csak feldolgozas lesz, mert elotte kuldom mikor megvarom, most ugy van jo, hogy elobb varja es utana kuldom
                generatePdf();
                await service.http({
                    url: `/api/queue/template-instance/increment/${this.foundTemplate.partialName}/${this.data[this.schemaName]._id}`,
                    method: 'POST',
                    data: {
                        requestId: requestId
                    }
                })
            } else {
                generatePdf();
            }

            return promise;
        };

        async generate(options) {
            this.generateOptions = options;

            const self = this;
            try {
                await this.boot();

                if (options !== undefined) {
                    if (options.hasOwnProperty('data')) {
                        this.data = this.options.data
                    }
                    if (options.hasOwnProperty('dataRaw')) {
                        this.data = options.dataRaw;
                    }
                    if (options.hasOwnProperty('templateRaw')) {
                        this.templateRaw = options.templateRaw;
                    }
                }

                if (this.template === undefined && this.templateRaw === undefined) {
                    return Promise.resolve(self.resultError(ngivr.strings.htmlTemplate.missing.template));
                }

                if (templates === undefined) {
                    return Promise.resolve(self.resultError(ngivr.strings.htmlTemplate.missing.templates));
                }

                this.findTemplate();

                if (this.foundTemplate === undefined) {
                    const string = $interpolate(ngivr.strings.htmlTemplate.missing.templateNotFound)(this);
                    return Promise.resolve(self.resultError(string));
                }

                if (this.data === undefined) {
                    return Promise.resolve(self.resultError(ngivr.strings.htmlTemplate.missing.data));
                }

                return new Promise(async (resolve, reject) => {

                    const qrResult = await this.generateQr();
                    let html = this.foundTemplate.html;
                    let qrImage = '';
                    if (!_.isEmpty(this.foundTemplate.qrAlignment)) {
                        qrImage = '<img class="ngivr-html-template-qr-style ngivr-position-fixed-' + this.foundTemplate.qrAlignment + '" src="' + qrResult.data + '"/>';
                    }
                    this.qrImageGlobal = `<img class="ngivr-html-template-qr-style" src="${qrResult.data}"/>`;
                    try {
                        let { generateHtml, instanceCount } = await this.generateHtml({
                            rawHtml: `<div>${html}</div>`,
                            qrRaw: qrResult.data
                        });
                        const result = this.generateTemplate(qrImage + generateHtml)
                        //console.warn('result', result)
                        resolve({
                            html: result,
                            instanceCount: instanceCount,
                            qr: this.qrImageGlobal,
                        });
                    } catch (error) {
                        ngivr.exception.handler(error);
                        const result = self.resultError(error.message);
                        resolve(result);
                    }
                })
            } catch (e) {
                ngivr.exception.handler(e);
            }
        }

        findTemplate() {
            if (this.templateRaw !== undefined) {
                this.foundTemplate = this.templateRaw;
            } else {
                this.foundTemplate = templates.find((element) => {
                    return element.partialName === this.template
                });
            }
            if (this.foundTemplate !== undefined && this.foundTemplate !== null) {
                this.schemaName = _.camelCase(this.foundTemplate.mainSchema);
            }
        }

        resultError(message) {
            const errorHtml = $interpolate(this.generateTemplate(`<div class="ngivr-html-template-error">${message}</div>`))();
            return errorHtml;
        }

    }
});


