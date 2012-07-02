(function (resources) {
    var options = ko.composite.options;
    var utils = ko.composite.utils;
    var loadedModel;

    ko.composite.registerModel = function (constructorAndOrOptions) {
        var constructorFirst = $.isFunction(constructorAndOrOptions);
        var constructor = arguments[constructorFirst ? 0 : 1];
        var modelOptions = arguments[constructorFirst ? 1 : 0];
        if (!modelOptions) modelOptions = {};

        if (loadedModel)
            ko.composite.logger.warn("Model was registered, but there was already one loaded that has not been assigned a path!");

        loadedModel = { constructor: constructor, options: modelOptions };
        ko.composite.logger.debug('Model loaded');
    };

    // firefox sucks. Seems to be no way to hook in to a failure event when loading scripts using a <script /> tag with a src attribute.
    resources.loadModel = function (path) {
        if (ko.composite.models[path])
            return null;

        var deferred = $.Deferred();
        var url = utils.resourcePath(options.modelPath, path, options.modelExtension);

        $.when(resources.loadScript(url))
            .done(function () {
                if (!loadedModel) {
                    ko.composite.logger.warn("Model script loaded for " + path + " but no model registered.");
                    deferred.resolve();
                } else {
                    var model = resources.assignModelPath(path);
                    $.when(resources.loadDependencies(path, model.options.requires))
                        .always(function () {
                            deferred.resolve();
                        });
                }
            })
            .fail(function () {
                deferred.reject();
            })
            .always(function () {
                loadedModel = null;
            });

        return deferred;
    };

    resources.assignModelPath = function (path) {
        ko.composite.models[path] = loadedModel;
        ko.composite.logger.info("Model registered for " + path);
        var model = loadedModel;
        loadedModel = null;
        return model;
    };

    resources.loadDependencies = function (path, dependencies) {
        var deferreds = [];

        if (dependencies) {
            loadDependencyType(resources.loadScript, dependencies.scripts, options.modelPath, options.modelExtension);
            loadDependencyType(resources.loadStylesheet, dependencies.stylesheets, options.stylesheetPath, options.stylesheetExtension);
            loadDependencyType(resources.loadTemplate, dependencies.templates, options.templatePath, options.templateExtension);
        }

        return $.when.apply(window, deferreds);

        function loadDependencyType(loadFunction, list, basePath, extension) {
            if (list)
                for (var i = 0; i < list.length; i++)
                    deferreds.push(loadFunction(dependencyPath(path, list[i], basePath, extension)));
        }

        // :-P
        function dependencyPath(pathToPane, pathToDependency, basePath, extension) {
            if (utils.isAbsolute(pathToDependency))
                return utils.resourcePath('', pathToDependency, extension);
            else
                return utils.resourcePath('', utils.combinePaths(utils.resourcePath(basePath, pathToPane, extension), pathToDependency), extension);
        }
    };
})(ko.composite.resources);