
(function () {
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
        pane.navigate(path, data);
        executeTestsWhenRendered(pane.pubsub, tests, startQunit);
    };

    Helpers.navigateParent = function (pane, path, data, tests, timeout, startQunit) {
        pane.parentPane.navigate(path, data);
        executeTestsWhenRendered(pane.pubsub, tests, startQunit);
    };

    function executeTestsWhenRendered(pubsub, tests, startQunit) {
        pubsub.subscribeOnce('rendered', function () {
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
})();