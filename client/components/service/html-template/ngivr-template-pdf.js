'use strict';
ngivr.angular.factory('ngivrTemplatePdf', function (ngivrService, ngivrTemplateGenerator) {

    const service = ngivrService;

    return function (options) {

        if (options.hasOwnProperty('templateRaw') && options.templateRaw !== undefined) {
            this.generator = new ngivrTemplateGenerator();
            this.generator.templateRaw = options.templateRaw;
        } else {
            this.generator = new ngivrTemplateGenerator(options);
        }

        if (options.hasOwnProperty('templates')) {
            this.generator.templates = options.templates;
        }

        this.generate = async (optionsGenerate) => {
            //console.warn('generate', optionsGenerate)
            optionsGenerate.hidePagebreak = true;
            const { instanceCount, html , qr} = await this.generator.generate(optionsGenerate);
            const foundTemplate = this.generator.foundTemplate || optionsGenerate.template;


            const additionalTemplatesObj = {}
            if (Array.isArray(optionsGenerate.additionalTemplates) && optionsGenerate.additionalTemplates.length > 0) {
                for (let additionalTemplate of optionsGenerate.additionalTemplates) {
                    const optionsGenerateAdditional = angular.copy(optionsGenerate)
                    optionsGenerateAdditional.template = additionalTemplate
                    optionsGenerateAdditional.templateRaw = optionsGenerate.additionalTemplatesRaw[additionalTemplate]
                    const { html } = await this.generator.generate(optionsGenerateAdditional);
                    additionalTemplatesObj[additionalTemplate ] = {
                        html: html,
                        template: optionsGenerate.additionalTemplatesRaw[additionalTemplate]
                    }
                }
            }

            let base = `${location.protocol}//${location.hostname}`;
            if (location.port !== '') {
                base += `:${location.port}`;
            }
            //console.warn(optionsGenerate)

            const docType = _.camelCase(optionsGenerate.templateRaw.mainSchema)
            const docId = optionsGenerate.dataRaw[docType]._id;

            const response = await service.http({
//        responseType: optionsGenerate.save ? "json" : "arraybuffer",
                responseType: "json",
                url: `/api/pdfDocuments/generate-template`,
                method: 'POST',
                data: {
                    userAgent : navigator.userAgent,
                    save: optionsGenerate.save,
                    base: base,
                    html: html,
                    instanceCount: instanceCount,
                    qr: qr,
                    template: foundTemplate,
                    docType: docType,
                    docId: docId,
                    additionalTemplates: optionsGenerate.additionalTemplates,
                    additionalTemplatesObj: additionalTemplatesObj,
                }
            })
            return response;
        }


    }
});
