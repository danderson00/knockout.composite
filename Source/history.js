if ($(window).hashchange !== undefined) {
    ko.composite.history = {};
    (function (history) {
        var updateTimer;
        var pane;
        var defaultHash;
        var defaultOptions;
        var defaultOptionsJson;
        var currentOptionsJson;

        history.properties = {};
        history.currentOptions = parseCurrentOptions();
        
        $(window).hashchange(hashChanged);

        history.initialise = function (navigationPane) {
            pane = navigationPane;
            defaultHash = currentHash();
            defaultOptions = { path: navigationPane.path, data: navigationPane.data, p: {} };
            defaultOptionsJson = JSON.stringify(defaultOptions);

            history.currentOptions = parseCurrentOptions();
            currentOptionsJson = JSON.stringify(history.currentOptions);

            navigationPane.path = history.currentOptions.path;
            navigationPane.data = history.currentOptions.data;


            pane.pubsub.subscribe('__navigate', navigating);
        };

        history.update = function() {
            window.location.hash = JSON.stringify(getOptions(history.currentOptions));
        };

        function getOptions(navigateOptions) {
            return {
                path: navigateOptions ? navigateOptions.path : undefined,
                data: navigateOptions ? navigateOptions.data : undefined,
                p: history.properties
            };
        }

        function hashChanged() {
            var hashOptions = parseCurrentOptions() || {};
            var hashData = JSON.stringify(hashOptions.data);
            var currentOptions = currentOptionsJson ? JSON.parse(currentOptionsJson) : {};
            var currentData = JSON.stringify(currentOptions.data);

            if (hashOptions.path !== currentOptions.path || hashData != currentData)
                if(pane) pane.navigate(hashOptions.path, hashOptions.data);
        };
        
        function navigating(navigateOptions) {
            currentOptionsJson = JSON.stringify(getOptions(navigateOptions));
            if (currentOptionsJson !== defaultOptionsJson || currentHash() !== defaultHash)
                queueAction(function () {
                    window.location.hash = currentOptionsJson;
                    if (ko.composite.options.navigateMode === 'reload')
                        window.location.reload();
                });
        }

        function parseCurrentOptions() {
            var hash = currentHash();
            var options;

            if (ko.composite.options.bootstrapper)
                options = ko.composite.options.bootstrapper(hash);

            if (!options) {
                if (hash)
                    try {
                        options = JSON.parse(hash);
                        history.properties = options.p || { };
                    } catch (e) { }
                else
                    history.properties = { };
            }

            return options ? options : defaultOptions;
        }

        function queueAction(action) {
            if (updateTimer)
                clearTimeout(updateTimer);
            updateTimer = setTimeout(action, 0);
        }

        function currentHash() {
            return unescape(window.location.hash.replace(/^#/, ''));
        }
    })(ko.composite.history);
}