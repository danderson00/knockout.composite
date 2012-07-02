(function ($) {
    var oldClean = jQuery.cleanData;
    
    // knockout also calls cleanData from it's cleanNode method - avoid any loops
    var cleaning = {};

    $.cleanData = function (elements) {
        for (var i = 0, element; (element = elements[i]) !== undefined; i++) {
            if (!cleaning[element]) {
                cleaning[element] = true;
                $(element).triggerHandler("destroyed");
                delete cleaning[element];
            }
        }
        oldClean(elements);
    };
})(jQuery);