(function() {
    ko.extenders.history = function (target, options) {
        if (!options || !options.key) return;

        var key = options.key;
        var history = ko.composite.history;
        ko.composite.hashProvider.addExternalChange(updateTarget);
        var defaultValue = target();

        var storedValue = history.getProperty(key);
        if (storedValue !== undefined)
            target(storedValue);

        target.subscribe(function (value) {
            history.setProperty(key, value);
            history.update();
        });

        function updateTarget() {
            target(history.getProperty(key) || defaultValue);
        }

        ko.composite.hashProvider.addExternalChange(updateTarget);
        
        if(options.pane) {
            var oldDispose = options.pane.dispose;
            options.pane.dispose = function() {
                if (oldDispose) oldDispose();
                ko.composite.hashProvider.removeExternalChange(updateTarget);
            };
        }
        
        return target;
    };
})();
