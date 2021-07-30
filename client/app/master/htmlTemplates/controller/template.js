'use strict';
/**
 * The template type to render.
 */
ngivr.api.htmlTemplate.controller.template = class {

  constructor($scope, $state, service) {
    this.$scope = $scope;
    this.$state = $state;
    this.service = service;

    const onSave = (e) => {
      this.controlSave(e);
    }
    $(document).on('keydown', onSave );

    $scope.$on('$destroy', () => {
      $(document).off('keydown', onSave );
    });
  }

  controlSave(e) {
    if (e.key.toLowerCase() == 's' && (e.ctrlKey || e.metaKey))
    {
      e.preventDefault();
      this.save(this.$scope.template)
      return false;
    }
    return true;
  }

  /**
   * Saves the template into the database.
   *
   * @param {ngivr.model.htmlTemplate}
   */
  async save(model) {
    if (!this.service.form.validate(this.$scope.htmlTemplateForm)) {
      return;
    }

    try {
      const response = await this.service.api.save('HtmlTemplate',  model)
      this.service.growl(ngivr.strings.message.success.save);
      Object.assign(model, response.data.doc);
      this.$state.go('.', {
        id: model._id,
      }, {notify: false});
    } catch (error) {
      console.log(error);
      this.service.form.error(this.$scope.htmlTemplateForm, error);
    }
  }



  /**
   * Load the current template.
   * @param {Template} templateData
   */
  load(templateData) {
    this.$scope.command.reset();

    this.$scope.template = new ngivr.model.htmlTemplate(templateData);

    if (templateData.mainSchema != undefined) {
      this.$scope.command.schema.load(templateData.mainSchema);
    }

    if (this.$scope.htmlTemplateForm) {
      this.$scope.ngivr.form.clear(this.$scope.htmlTemplateForm);
    }
    this.$state.go('.', {id: templateData._id}, {notify: false});
  }

};
