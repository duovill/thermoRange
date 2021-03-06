/**
 * Created by Kovács Marcell on 2017.03.01..
 */
var QuickNav = function() {
  return {
    init: function() {
      if ($(".quick-nav").length > 0) {
        var i = $(".quick-nav");
        i.each(function() {
          var i = $(this),
            n = i.find(".quick-nav-trigger");
          n.on("click", function(n) {
            n.preventDefault(), i.toggleClass("nav-is-visible")
          })
        }), $(document).on("click", function(n) {
          !$(n.target).is(".quick-nav-trigger") && !$(n.target).is(".quick-nav-trigger span") && i.removeClass("nav-is-visible")
        })
      }
    }
  }
}();

