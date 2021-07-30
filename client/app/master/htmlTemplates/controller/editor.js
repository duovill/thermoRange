'use strict';
ngivr.api.htmlTemplate.controller.editor = class {

    constructor($scope) {
        this.$scope = $scope;
    }

    insertCodeMirrorCode(code) {
        console.warn(this.$scope.setting)
        const doc = this.$scope.setting.codeMirrorInstance.getDoc();
        const cursor = doc.getCursor(); // gets the line number in the cursor position
        const line = doc.getLine(cursor.line); // get the line contents
        const pos = { // create a new object to avoid mutation of the original selection
            line: cursor.line,
            ch: line.length // set the character position to the end of the line
        };
        doc.replaceRange(code, pos); // adds a new line
    }

    /**
     * To insert a variable insert into the editor
     * @param variable
     */
    insertVariable(variable, e) {
        if (e) {
            e.stopImmediatePropagation();
        }
        this.insert(variable.template)
    }

    insertPageBreak() {
        this.insert('<div class="ngivr-template-page-break" style="page-break-after:always;"/> <div></div>');
    }

    insertDefault(code) {
        this.insert('\n' + code + '\n');
    }

    insertQrCode() {
        this.insert('\n${qr}\n');
    }

    /**
     * Insert a partial template into the editor.
     * @param template
     */
    insertTemplate(template) {
        this.insert(`\n<ngivr-html-template-include ngivr-template="${template.partialName}">${template.name}</ngivr-html-template-include>`);
    }

    insert(code) {
        switch (this.$scope.setting.activeTab) {
            case 0:
                this.insertCodeMirrorCode(code);
                break;

            case 1:
                tinyMCE.activeEditor.insertContent(code, {format: 'raw'});
                break;

            default:
                ngivr.growl(ngivr.strings.htmlTemplate.message.invalidView);
                break;
        }
    }

    codemirrorLoaded(editor) {
        this.$scope.setting.codeMirrorInstance = editor;
        /*
        $(editor.display.wrapper).resizable({
          handles: 's',
          autoHide: true,
          resize: function() {
            editor.setSize($(this).width(), $(this).height());
          }
        });
        */
    }

};
