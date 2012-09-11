(function () {
    ko.composite.options.debug.handleExceptions = false;
    QUnit.testStart = setHashProvider;

    if (!window.Helpers)
        Helpers = {};

    Helpers.testContext = {};
    Helpers.testContext.models = {};

    Helpers.render = function (options, tests, element) {
        return render(ko.bindingHandlers.pane, options, tests, element);
    };

    Helpers.renderPane = function (name, data, tests, timeout, startQunit) {
        return render(ko.bindingHandlers.pane, { path: name, data: data, startQunit: startQunit }, tests);
    };

    Helpers.renderRegion = function (name, data, tests, timeout, startQunit) {
        return render(ko.bindingHandlers.region, { path: name, data: data, startQunit: startQunit }, tests);
    };

    function render(bindingHandler, options, tests, element) {
        Helpers.testContext = {};
        Helpers.testContext.models = {};

        var pane = bindingHandler.update(
            $(element ? element : '#qunit-fixture')[0],
            function () { return options; },
            function () { return {}; });
        executeTestsWhenRendered(pane.pubsub, tests, options.startQunit);
        return pane;
    }

    Helpers.addPane = function (parentPane, path, data, tests, startQunit) {
        Helpers.testContext = {};
        Helpers.testContext.models = {};

        var pane = ko.composite.utils.addPane($('#qunit-fixture')[0], { path: path, data: data }, parentPane);
        executeTestsWhenRendered(pane.pubsub, tests, startQunit);
        return pane;
    };

    Helpers.navigate = function (pane, path, data, tests, timeout, startQunit) {
        executeTestsWhenRendered(pane.pubsub, tests, startQunit);
        pane.navigate(path, data);
    };

    Helpers.navigateParent = function (pane, path, data, tests, timeout, startQunit) {
        executeTestsWhenRendered(pane.pubsub, tests, startQunit);
        pane.parentPane.navigate(path, data);
    };

    function executeTestsWhenRendered(pubsub, tests, startQunit) {
        var token = pubsub.subscribePersistent('rendered', function () {
            pubsub.unsubscribe(token);
            if (tests)
                tests();

            if (!(startQunit === false))
                start();

            cleanUp();
        });
    }

    window.onerror = function (msg, url, line) {
        ok(false, "Error occurred at " + url + ":" + line + ": " + msg);
        console.log(msg);
    };

    function cleanUp() {
        //ko.composite.models = {};
        //$('script[type="text/template"]').remove();
    }

    Helpers.mockPubSub = function (publishMethod) {
        if (!publishMethod)
            publishMethod = sinon.spy();

        return {
            publish: publishMethod,
            publishSync: publishMethod,
            unsubscribeAllExceptInternal: sinon.spy(),
            unsubscribe: sinon.spy()
        };
    };

    Helpers.setHashProvider = setHashProvider;
    function setHashProvider() {
        var callback;
        var currentHash = '';

        ko.composite.hashProvider = {
            addExternalChange: function (callbackToSet) {
                callback = callbackToSet;
            },
            removeExternalChange: function () {
                callback = undefined;
            },
            update: function (value) {
                currentHash = value ? JSON.stringify(value) : '';
            },
            query: function () {
                return currentHash ? JSON.parse(currentHash) : {};
            },
            triggerChange: function () {
                if (callback) callback();
            }
        };

        return ko.composite.hashProvider;
    };

    Helpers.delay = function(tests, delay) {
        setTimeout(function() {
            tests();
            start();
        }, delay || 0);
    };
})();