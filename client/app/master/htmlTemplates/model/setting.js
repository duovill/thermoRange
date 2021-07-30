'use strict';
/**
 * It includes the settings / variables.
 */
ngivr.api.htmlTemplate.model.setting = class {

  constructor() {
    this.htmlTemplates = [];

    this.preview = {};
    this.preview.show = false;
    this.preview.showPdf = false;
    this.preview.html = undefined;
    this.activeTab = 0;

    /**
     * TinyMCE editor setup parameters
     */
    this.tinymceOptions = {
      document_base_url : location.origin,
      content_css: 'assets/ngivr-html-template/ngivr-html-template.css',
      height: 500,
      entity_encoding: 'raw',
      forced_root_block : 'div',
      valid_elements : '*[*]',
    };

    /**
     * The current code mirror instance.
     */
    this.codeMirrorInstance = undefined;

    /**
     * Code mirror options
     */
    this.codeMirrorOptions = {};
    this.codeMirrorOptions.lineWrapping = true;
    this.codeMirrorOptions.lineNumbers = true;
    this.codeMirrorOptions.mode = {
      name: "handlebars",
      base: "text/html"
    };
    this.codeMirrorOptions.height = true;

  }
};
