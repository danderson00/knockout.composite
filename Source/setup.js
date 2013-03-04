// knockout.composite JavaScript library v0.1
// (c) Dale Anderson - http://danderson00.blogspot.com.au/
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
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
                return $.when(ko.composite.resources.loadDependencies("", { requires: preload })).done(function () {
                    ko.applyBindings(model);
                });
            } else {
                ko.applyBindings(model);
            }
        }
    };
})();
