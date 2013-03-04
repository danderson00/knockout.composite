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

    resources.loadModel = function (path) {
        if (ko.composite.models[path]) {
            if (ko.composite.models[path].options)
                return resources.loadDependencies(path, ko.composite.models[path].options);
            return null;
        }

        var deferred = $.Deferred();
        var url = utils.resourcePath(options.modelPath, path, options.modelExtension);

        $.when(resources.loadScript(url))
            .done(function () {
                if (!loadedModel) {
                    ko.composite.logger.warn("Model script loaded for " + path + " but no model registered.");
                    deferred.resolve();
                } else {
                    var model = resources.assignModelPath(path);
                    $.when(resources.loadDependencies(path, model.options))
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

    resources.loadDependencies = function (path, modelOptions) {
        var deferreds = [];
        var dependencies = modelOptions.requires;

        if (dependencies) {
            loadDependencyType(resources.loadScript, resources.loadCrossDomainScript, dependencies.scripts, options.modelPath, options.modelExtension);
            loadDependencyType(resources.loadStylesheet, resources.loadStylesheet, dependencies.stylesheets, options.stylesheetPath, options.stylesheetExtension);
            loadDependencyType(resources.loadTemplate, resources.loadTemplate, dependencies.templates, options.templatePath, options.templateExtension);
        }

        modelOptions.requires = null;
        return $.when.apply(window, deferreds);

        function loadDependencyType(loadFunction, crossDomainLoadFunction, list, basePath) {
            if (list)
                for (var i = 0; i < list.length; i++) {
                    var thisDependencyPath = list[i];
                    deferreds.push(utils.isFullUrl(thisDependencyPath)
                            ? crossDomainLoadFunction(thisDependencyPath)
                            : loadFunction(dependencyPath(path, thisDependencyPath, basePath), null, basePath + thisDependencyPath));
                }
        }

        // :-P
        function dependencyPath(pathToPane, pathToDependency, basePath) {
            if (utils.isAbsolute(pathToDependency))
                return utils.resourcePath('', pathToDependency);
            else
                return utils.resourcePath('', utils.combinePaths(utils.resourcePath(basePath, pathToPane), pathToDependency));
        }
    };
})(ko.composite.resources);