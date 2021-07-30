/* jshint undef: true, unused: true, esversion: 6*/
/* global ngivr */
ngivr.clipboard = new class {
  constructor() {
    //singleton
    if (ngivr.clipboard) {
      return ngivr.clipboard;
    }
    this.data = null;
    this.hint = "default";
    this.type = null;
  }
  checkInput() {
    if (!this.input) {
      /** Hidden input element to select and copy text*/
      this.input = document.createElement("textarea");
      this.input.style = "height:0px !important;z-index:-1";
      this.input.id = "ngivr-clipboard-hidden"
      document.body.appendChild(this.input);
    }
  }

  copy(toCopy, hint) {

    if (event !== undefined) {
      event.stopPropagation();
    }

    this.checkInput();
    let dType = typeof toCopy;
    if (dType === 'object') {
      toCopy = JSON.stringify(toCopy);
      dType = toCopy ? "JSON" : undefined;
    }
    if (!toCopy && dType !== "boolean") {
      this.clear();
      return false;
    }
    this.data = toCopy;
    this.type = dType;
    this.hint = hint;
    this.input.value = toCopy;
    this.input.select();
    return document.execCommand('copy');

  }
  cut(toCut, hint) {
    return this.copy(toCut, hint);
  }

  paste() {
    return this.data;
  }

  getHint() {
    return this.hint;
  }

  clear() {
    this.data = null;
    this.hint = null;
    this.type = null;
  }

}

