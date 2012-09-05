;
// the above is a workaround for ajaxmin / resPack gayness
(function () {
    if (!jQuery)
        throw 'jQuery must be loaded before knockout.composite can initialise';
    if (!ko)
        throw 'knockout.js must be loaded before knockout.composite can initialise';

    ko.composite = {
        models: {},
        logger: new Logger(),
        options: {
            basePath: '',
            templatePath: '',
            modelPath: '',
            stylesheetPath: '',
            synchronous: false,
            templateExtension: 'htm',
            modelExtension: 'js',
            stylesheetExtension: 'css',
            globalSubscribers: null,
            debug: {
                handleExceptions: true,
                splitScripts: false
            },
            noPaneStylesheets: false,
            globalRenderFunction: null,
            navigateMode: 'standard',
            logLevel: 'debug',
            singlePubSub: false
        },
        initialise: function (model, preload) {
            if (preload) {
                $.when(ko.composite.resources.loadDependencies("", { requires: preload })).done(function () {
                    ko.applyBindings(model);
                });
            } else {
                ko.applyBindings(model);
            }
        }
    };
})();
