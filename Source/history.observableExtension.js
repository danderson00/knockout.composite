(function() {
    ko.extenders.history = function (target, options) {
        if (!options || !options.key) return;

        var key = options.key;
        var history = ko.composite.history;

        var storedValue = history.properties[key];
        if (storedValue !== undefined)
            target(storedValue);

        target.subscribe(function (value) {
            if (!value)
                delete history.properties[key];
            else
                history.properties[key] = value;
            history.update();
        });

        function updateTarget() {
            target(history.properties[key]);
        }

        $(window).hashchange(updateTarget);
        
        if(options.pane) {
            var oldDispose = options.pane.dispose;
            options.pane.dispose = function() {
                if (oldDispose) oldDispose();
                $(window).unbind('hashchange', updateTarget);
            };
        }
        
        return target;
    };
})();
