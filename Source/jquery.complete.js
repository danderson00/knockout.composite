(function ($) {
    $.complete = function () {
        var wrappers = [];
        for (var index = 0; index < arguments.length; index++) {
            var argument = arguments[index];
            wrappers.push($.Deferred(function (deferred) {
                $.when(argument)
                    .always(function () {
                        deferred.resolve();
                    });
            }));
        }
        return $.when.apply($, wrappers);
    };
})(jQuery);