(function() {
    ko.composite.utils = ko.composite.utils || {};
    ko.composite.utils.createHistory = createHistory;

    if (ko.composite.hashProvider !== undefined)
        ko.composite.history = createHistory();

    function createHistory() {
        var history = {};
        var current = {};
        var defaultOptions;
        var pane;

        ko.composite.hashProvider.addExternalChange(externalChange);

        history.initialise = function (navigationPane) {
            pane = navigationPane;

            current = ko.composite.hashProvider.query();
            navigationPane.path = current.path || navigationPane.path;
            navigationPane.data = current.data || navigationPane.data;
            current.path = navigationPane.path;
            current.data = navigationPane.data;
            defaultOptions = { path: current.path, data: current.data };
            
            pane.pubsub.subscribePersistent('__navigate', navigating);
        };

        history.update = function () {
            updateHash();
        };

        history.setProperty = function(name, value) {
            if (value === undefined) {
                if (current.p) delete current.p[name];
            } else {
                if (!current.p) current.p = {};
                current.p[name] = value;
            }
            updateHash();
        };

        history.getProperty = function(name) {
            return current.p && current.p[name];
        };
        
        function externalChange() {
            var previous = current;
            current = getCurrentFromHashObject();
            if (current.path !== previous.path || !ko.composite.utils.equal(current.data, previous.data))
                pane.navigate(current.path, current.data);
        }
        
        function navigating(navigateOptions) {
            current.path = navigateOptions.path;
            current.data = navigateOptions.data;
            updateHash();
        }
        
        function updateHash() {
            var hashObject = {};
            if (current.path && current.path != defaultOptions.path) hashObject.path = current.path;
            if (current.data && !ko.composite.utils.equal(current.data, defaultOptions.data)) hashObject.data = current.data;
            if (ko.composite.utils.objectHasProperties(current.p)) hashObject.p = current.p;
            ko.composite.hashProvider.update(hashObject);
        }
        
        function getCurrentFromHashObject() {
            var currentHash = ko.composite.hashProvider.query();
            if (!currentHash.path && defaultOptions) currentHash.path = defaultOptions.path;
            if (!currentHash.data && defaultOptions) currentHash.data = defaultOptions.data;
            return currentHash;
        }
        
        return history;
    }
})();

