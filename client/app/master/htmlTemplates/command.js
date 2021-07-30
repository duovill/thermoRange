'use strict';
/**
 * Global commands in the controller.
 *
 * Requires: $scope
 */
ngivr.api.htmlTemplate.command = class {

  constructor($scope, $state, service, templateSchemaHelper) {
    this.$scope = $scope;
    this.$state = $state;
    this.template = new ngivr.api.htmlTemplate.controller.template($scope, $state, service);
    this.schema = new ngivr.api.htmlTemplate.controller.schema($scope, $state, service, templateSchemaHelper);
    this.editor = new ngivr.api.htmlTemplate.controller.editor($scope);
    this.qr = new ngivr.api.htmlTemplate.controller.qr();
    this.service = service;
  }

  /**
   * Reset the whole controller.
   */
  reset() {
//    this.schema.reset();
//    this.$scope.setting.preview.show = false;
//    this.$scope.setting.preview.html = undefined;
  }

  /**
   * create a new template. Empty.
   */
  new() {
    this.$scope.template = new ngivr.model.htmlTemplate();
    this.reset();
    if (this.$scope.htmlTemplateForm) {
      this.$scope.ngivr.form.clear(this.$scope.htmlTemplateForm);
      this.$state.go('.', {id: undefined}, {notify: false});
    }
  }

  async remove(id) {
    try {
      const $scope = this.$scope;
      await this.service.confirm(ngivr.strings.question.remove);
      await this.service.api.remove('HtmlTemplate', id);
      await ngivr.growl(ngivr.strings.message.removed);
      this.new();
    } catch(e) {
      if (e !== undefined) {
        ngivr.growl.error(e);
      }
    }
  }

  /**
   * show the current template using partials with Handlebars. -> GeneratePreview.
   */
  togglePreview() {
    this.$scope.setting.preview.show = !this.$scope.setting.preview.show;
  }

  togglePdfPreview() {
    this.$scope.setting.preview.showPdf = !this.$scope.setting.preview.showPdf;
  }

  /**
   * Finds out if the preview show.
   * @returns {boolean}
   */
  showPreview() {
    const showPreview = this.$scope.setting.preview.show && this.$scope.command.schema.data != undefined;
    return showPreview;
  }

  showPdfPreview() {
    const showPreview = this.$scope.setting.preview.showPdf && this.$scope.command.schema.data != undefined;
    return showPreview;
  }


  partialTemplates() {
    const $scope = this.$scope;
    const partialTemplates = $scope.setting.htmlTemplates.filter((element) => {
      if (!$scope.template.hasOwnProperty('_id')) {
        return true;
      }
      let allow =  element._id !== $scope.template._id && (element.mainSchema === undefined || element.mainSchema.trim() === '' || element.mainSchema === $scope.template.mainSchema) ;
      return allow;
    });
    return partialTemplates;
  }

};
