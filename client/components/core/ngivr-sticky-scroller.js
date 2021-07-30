ngivr.stickyScroller = function(opts) {
    const { scrollingContainerId , listHeaderId, leftOffset, $scope } = opts

    let $listHeader
    const $container = $('#' + scrollingContainerId)
    const listHeaderInterval = setInterval(() => {
        $listHeader = $('#' + listHeaderId)
        if ($listHeader.length > 0) {
            clearInterval(listHeaderInterval)
        }
    })
    const containerScroll = (event) => {
        if ($listHeader.css('position') === 'fixed') {
            //console.log('containerScroll', $container.offset().left , $container[0].scrollLeft)
            // ezzel kell beallitani, pixelben
            const left = - $container[0].scrollLeft + $container.offset().left + leftOffset
            $listHeader.css('left', `${left}px`);
        }
    }
    $container.on('scroll', containerScroll)

    $scope.$on('$destroy', async () => {
        $container.off('scroll', containerScroll)
        clearInterval(listHeaderInterval)
    });

}
