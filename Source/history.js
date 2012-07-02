if ($(window).hashchange !== undefined) {
    ko.composite.history = {};
    (function (history) {
        var updateTimer;
        var pane;
        var defaultHash;
        var defaultOptions;
        var defaultOptionsJson;
        var currentOptionsJson;

        history.initialise = function (navigationPane) {
            pane = navigationPane;

            defaultHash = currentHash();
            defaultOptions = { path: navigationPane.path, data: navigationPane.data };
            defaultOptionsJson = JSON.stringify(defaultOptions);

            var currentOptions = parseCurrentOptions();
            currentOptionsJson = JSON.stringify(currentOptions);

            navigationPane.path = currentOptions.path;
            navigationPane.data = currentOptions.data;

            $(window).hashchange(hashChanged);

            pane.pubsub.subscribe('__navigate', function (navigateOptions) {
                currentOptionsJson = JSON.stringify({ path: navigateOptions.path, data: navigateOptions.data });
                if (currentOptionsJson !== defaultOptionsJson || currentHash() !== defaultHash)
                    queueAction(function () {
                        window.location.hash = currentOptionsJson;
                        if (ko.composite.options.navigateMode === 'reload')
                            window.location.reload();
                    });
            });
        };

        function hashChanged() {
            var hashOptions = parseCurrentOptions();
            var hashJson = JSON.stringify(hashOptions);

            if (hashJson != currentOptionsJson) {
                pane.navigate(hashOptions.path, hashOptions.data);
            }
        };

        function queueAction(action) {
            if (updateTimer)
                clearTimeout(updateTimer);
            updateTimer = setTimeout(action, 0);
        }

        function parseCurrentOptions() {
            var hash = currentHash();
            var options;

            if (ko.composite.options.bootstrapper)
                options = ko.composite.options.bootstrapper(hash);

            if (!options && hash)
                try {
                    options = JSON.parse(hash);
                } catch (e) { }

            return options ? options : defaultOptions;
        }

        function currentHash() {
            return unescape(window.location.hash.replace(/^#/, ''));
        }
    })(ko.composite.history);
}