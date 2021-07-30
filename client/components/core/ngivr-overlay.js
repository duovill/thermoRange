ngivr.overlay = new function() {

    let $overlay

    $(() => {
        $overlay = $('#ngivr-global-overlay')
    })

    this.show = () => {
        $overlay.show();
    }

    this.hide = () => {
        $overlay.hide()
    }

}
