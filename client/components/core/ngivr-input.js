ngivr.input = {
  focus: (input) => {
    ngivr.$timeout(function () {
      const length = input.value.length;
      // For IE Only
      if (document.selection) {
        input.focus();
        const oSel = document.selection.createRange();
        // Reset position to 0 & then set at end
        oSel.moveStart('character', -length);
        oSel.moveStart('character', length);
        oSel.moveEnd('character', 0);
        oSel.select();
      }
      // Firefox/Chrome
      else if (input.selectionStart || input.selectionStart == '0') {
        input.selectionStart = length;
        input.selectionEnd = length;
        input.focus();
      }
    });
  }
}
