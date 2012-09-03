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
                $.when(ko.composite.resources.loadDependencies("", preload)).done(function () {
                    ko.applyBindings(model);
                });
            } else {
                ko.applyBindings(model);
            }
        }
    };
})();
function PubSub(options) {
    var self = this;
    this.forceSync = getOptions().forceSync;

    var messages = {};
    this.messages = messages;
    var lastUid = -1;

    function publish(message, data, sync) {
        var subscribers = getSubscribers(message);
        var subscribersCopy = subscribers.slice(0);

        if (subscribers.length == 0)
            return false;

        for (var i = 0; i < subscribersCopy.length; i++) {            
            removeSubscriberIfOnceOnly(subscribersCopy[i]);
            if (sync === true || self.forceSync === true)
                executeSubscriber(subscribersCopy[i].func);
            else {
                (function (subscriber) {
                    setTimeout(function () {
                        executeSubscriber(subscriber.func);
                    });
                })(subscribersCopy[i]);
            }
        }

        return true;

        function executeSubscriber(func) {
            if (ko.composite.options.debug.handleExceptions)
                try {
                    func(data);
                } catch (e) {
                    if (sync || self.forceSync)
                    // if we are running synchronously, rethrow the exception after a timeout, 
                    // or it will prevent the rest of the subscribers from receiving the message
                        setTimeout(handleException(e, message), 0);
                    else
                        handleException(e, message)();
                }
            else
                func(data);
        }

        function handleException(e, message) {
            return function () {
                ko.composite.logger.error("Error occurred in subscriber to '" + message + "'", e);
            };
        };

        function removeSubscriberIfOnceOnly(subscriber) {
            if (subscriber.onceOnly)
                subscribers.splice(subscribers.indexOf(subscriber), 1);
        }
    };

    this.publish = function (message, data) {
        return publish(message, data, false);
    };

    this.publishSync = function (message, data) {
        return publish(message, data, true);
    };

    this.subscribeOnce = function (message, func) {
        return this.subscribe(message, func, { onceOnly: true });
    };

    this.subscribePersistent = function (message, func) {
        return this.subscribe(message, func, { persistent: true });
    };

    this.subscribe = function (message, func, subscriptionOptions) {
        if (typeof (message) === "string")
            return registerSubscription(message, func, subscriptionOptions);
        else {
            var tokens = [];
            for (var messageName in message)
                if (message.hasOwnProperty(messageName))
                    tokens.push(registerSubscription(messageName, message[messageName]));
            return tokens;
        }
    };
    
    function registerSubscription(message, func, subscriptionOptions) {
        if (!messages.hasOwnProperty(message))
            messages[message] = [];

        subscriptionOptions = subscriptionOptions ? subscriptionOptions : {};

        var token = (++lastUid).toString();
        messages[message].push({ token: token, func: func, onceOnly: subscriptionOptions.onceOnly, persistent: subscriptionOptions.persistent });

        return token;
    }

    this.unsubscribe = function (tokens) {
        if ($.isArray(tokens))
            return $.map(tokens, function (token) {
                return unsubscribe(token);
            });
        return unsubscribe(tokens);
    };
    
    function unsubscribe(token) {
        for (var m in messages) {
            if (messages.hasOwnProperty(m)) {
                for (var i = 0, j = messages[m].length; i < j; i++) {
                    if (messages[m][i].token === token) {
                        messages[m].splice(i, 1);
                        return token;
                    }
                }
            }
        }
        return false;
    }

    this.unsubscribeAllExceptInternal = function () {
        for (var message in messages) {
            if (messages.hasOwnProperty(message) && !messageIsInternal(message)) {
                delete messages[message];
            }
        }
    };

    this.unsubscribeTransient = function () {
        for (var message in messages) {
            if (messages.hasOwnProperty(message) && !messageIsInternal(message)) {
                var subscribers = messages[message];
                for (var i = subscribers.length - 1; i >= 0; i--)
                    if (!subscribers[i].persistent)
                        subscribers.splice(i, 1);

                if (subscribers.length == 0)
                    delete messages[message];
            }
        }
    };
    
    function messageIsInternal(message) {
        return typeof(message) == 'string' && message.substr(0, 2) == '__';
    }

    function getOptions() {
        return options ? options : { };
    }

    function getSubscribers(message) {
        var subscribers;
        
        if (messages.hasOwnProperty(message)) {
            subscribers = messages[message];
        } else {
            subscribers = [];
        }

        addGlobalSubscribers(message, subscribers);

        return subscribers;
    }
    
    function addGlobalSubscribers(message, subscribers) {
        var globalSubscribers = getOptions().globalSubscribers;

        if (globalSubscribers && globalSubscribers.hasOwnProperty(message))
            subscribers.push({ func: globalSubscribers[message] });
    }
};PubSub.prototype.subscribeOnceFor = function (messages, func) {
    var pubsub = this;
    
    var tokens = pubsub.subscribe(mapMessagesToHandler());

    // this could be extended to pass the message as well, though maybe that should be done from PubSub itself
    function handleMessage(data) {
        pubsub.unsubscribe(tokens);
        func(data);
    }

    function mapMessagesToHandler() {
        var subscribers = {};
        $.each(messages, function (index, message) {
            subscribers[message] = handleMessage;
        });
        return subscribers;
    }
};(function ($) {
    $.complete = function () {
        var wrappers = [];
        for (var index = 0; index < arguments.length; index++) {
            var argument = arguments[index];
            wrappers.push($.Deferred(function (deferred) {
                $.when(argument)
                    .always(function () {
                        deferred.resolve();
                    });
            }));
        }
        return $.when.apply($, wrappers);
    };
})(jQuery);(function ($) {
    var oldClean = jQuery.cleanData;
    
    // knockout also calls cleanData from it's cleanNode method - avoid any loops
    var cleaning = {};

    $.cleanData = function (elements) {
        for (var i = 0, element; (element = elements[i]) !== undefined; i++) {
            if (!cleaning[element]) {
                cleaning[element] = true;
                $(element).triggerHandler("destroyed");
                delete cleaning[element];
            }
        }
        oldClean(elements);
    };
})(jQuery);function Logger() {
    var self = this;
    var logLevel = 0;

    this.debug = function (message) {
        if(logLevel <= 0)
            this.log('debug', message);
    };

    this.info = function (message) {
        if (logLevel <= 1)
            this.log('info', message);
    };

    this.warn = function (message) {
        if (logLevel <= 2)
            this.log('warn', message);
    };

    this.error = function (message, error) {
        if (logLevel <= 3) {
            var logString;
            if (error && error.stack)
                logString = message + ' ' + error.stack;
            else if (error && error.message)
                logString = message + ' ' + error.message;
            else
                logString = message + ' ' + (error ? error : '');


            this.log('error', logString);
            if (this.errorCallback)
                $.when(this.errorCallback(logString))
                    .fail(function() {
                        self.log('error', 'Unable to successfully log error!');
                    });
        }
    };

    this.ajax = function (url, jqXHR, textStatus, errorThrown) {
        if (jqXHR.status === 404)
            this.info('Resource not found: ' + url);
        else
            this.error('Error loading resource: ' + url, errorThrown);
    };

    this.log = function (level, message) {
        if(window.console && window.console.log)
            window.console.log(level.toUpperCase() + ': ' + message);
    };

    this.errorCallback = null;

    this.setLogLevel = function (level) {
        switch (level) {
            case 'debug': return (logLevel = 0);
            case 'info': return (logLevel = 1);
            case 'warn': return (logLevel = 2);
            case 'error': return (logLevel = 3);
            case 'none': return (logLevel = 4);
            default: return (logLevel = 0);
        }
    };
}if(!ko.composite.utils)
    ko.composite.utils = {};

(function (utils) {
    var options = ko.composite.options;
    
    utils.combinePaths = function (basePath, pathToCombine) {
        basePath = basePath ? basePath : '';
        pathToCombine = pathToCombine ? pathToCombine : '';
        var newPath;
        if (utils.isAbsolute(pathToCombine) || !basePath)
            newPath = pathToCombine;
        else {
            basePath = stripFileName(basePath);
            newPath = basePath + pathToCombine;
        }
        return evaluatePathNavigation(newPath);
    };

    function evaluatePathNavigation(path) {
        if (path.substring(0, 3) == '../')
            return '../' + evaluatePathNavigation(path.substring(3, path.length));

        if (path.substring(0, 4) == '/../')
            return '/../' + evaluatePathNavigation(path.substring(4, path.length));

        var location = path.indexOf('/../');

        if (location == -1)
            return path;

        var startOfPrecedingFolder = path.substring(0, location).lastIndexOf('/');

        return evaluatePathNavigation(path.substring(0, startOfPrecedingFolder + 1) + path.substring(location + 4, path.length));
    }

    utils.isAbsolute = function(path) {
        return path.charAt(0) == '/';
    };

    utils.stripPathAndExtension = function(path) {
        var start = path.lastIndexOf('/') + 1;
        var end = path.lastIndexOf('.');
        if (end == -1) end = path.length;
        return path.substring(start, end);
    };   

    utils.resourcePath = function(basePath, path, extension) {
        var fullPath = options.basePath + '/' + basePath + '/' + path;
        
        if(extension && !(fullPath.substr(fullPath.length - extension.length - 1) == '.' + extension))
            fullPath += '.' + extension;
        
        return utils.stripLeadingSlash(removeDoubleSlashes(fullPath));
    };

    utils.pathIdentifier = function(path) {
        return stripExtension(utils.stripLeadingSlash(path)).replace( /\//g , '-').replace(/\./g, '');
    };
    
    utils.resourcePathIdentifier = function(path) {
        return ko.composite.utils.pathIdentifier(utils.resourcePath("", path, ""));
    };
    
    function stripFileName(path) {
        return path.substr(0, path.lastIndexOf('/') + 1);
    }
    
    function stripExtension(path) {
        var end = path.lastIndexOf('.');
        if (end == -1) end = path.length;
        return path.substring(0, end);
    }
    
    function removeDoubleSlashes(path) {
        while(path.indexOf('//') > -1)
            path = path.replace(/\/\//g , "/");
        return path;
    }

    utils.stripLeadingSlash = function(path) {
        return path.charAt(0) == '/' ? path.substring(1, path.length) : path;
    };

    utils.ensureLeadingSlash = function(path) {
        if (path.charAt(0) != '/')
            return '/' + path;
        return path;
    };

})(ko.composite.utils);if (!ko.composite.utils)
    ko.composite.utils = {};

(function (utils) {
    utils.inheritParentPath = function(pane, parentPane) {
        if(typeof (pane) === 'string')
            return parentPane ? ko.composite.utils.combinePaths(pane, parentPane.path) : pane;
        else {
            pane.path = parentPane ? ko.composite.utils.combinePaths(pane, parentPane.path) : pane.path;
            return pane;
        }
    };
    
    utils.bindPane = function(element, options, parentPane) {
        return ko.bindingHandlers.pane.update(element, function () { return utils.inheritParentPath(options); }, function () { return {}; }, { __pane: parentPane });                
    };

    utils.addPane = function(parentElement, options, parentPane) {
        var container = $('<div></div').appendTo(parentElement)[0];
        return utils.bindPane(container, options, parentPane);
    };

    utils.addPaneAfter = function(element, options, parentPane) {
        var container = $('<div></div').insertAfter(element)[0];
        return utils.bindPane(container, options, parentPane);
    };

    utils.extractPane = function(viewModel, bindingContext) {
        if (viewModel && viewModel.__pane)
            return viewModel.__pane;
        if (bindingContext && bindingContext.$root && bindingContext.$root.__pane)
            return bindingContext.$root.__pane;
        return null;
    };
    
    utils.getUniqueId = (function() {
        var id = 0;
        return function() {
            if (arguments[0] == 0) {
                id = 1;
                return 0;
            } else
                return id++;
        };
    })();
})(ko.composite.utils);if(!ko.composite.utils)
    ko.composite.utils = {};

(function () {
    var utils = ko.composite.utils;

    utils.inheritProperty = function(source, target, name) {
        if(!target.hasOwnProperty(name))
            utils.setPropertyFrom(source, target, name);
    };

    utils.setPropertyFrom = function(source, target, name) {
        if (source && source[name] !== null && source[name] !== undefined)
            target[name] = source[name];
    };
    
    utils.setProperty = function(target, name, defaultValue, setFrom, inheritFrom) {
        utils.setPropertyFrom(inheritFrom, target, name);
        utils.setPropertyFrom(setFrom, target, name);

        if (target[name] === null || target[name] === undefined)
            target[name] = $.isFunction(defaultValue) ? defaultValue() : defaultValue;
    };

    utils.mapToObservables = function(source, target) {
        if(!target)
            target = { };
        
        for(var property in source)
            if(source.hasOwnProperty(property))
                if(ko.isObservable(target[property]))
                    target[property](source[property]);
                else
                    target[property] = ko.observable(source[property]);

        return target;
    };

    utils.clearAllObservables = function(target) {
        for(var property in target)
            if(target.hasOwnProperty(property) && isPopulatedObservable(target[property]))
                if(target[property]().constructor === Array)
                    target[property]([]);
                else
                    target[property](null);        
    };
    
    function isPopulatedObservable(target) {
        return ko.isObservable(target) && !ko.isComputed(target) && target();
    }
})();if(!ko.composite.utils)
    ko.composite.utils = {};

(function () {
    var utils = ko.composite.utils;

    utils.proxy = function(objectToProxy, iterator) {
        if(ko.isObservable(objectToProxy) && objectToProxy().constructor === Array)
            return proxyObservableArray(objectToProxy);
        else if($.isArray(objectToProxy))
            return proxyArray(objectToProxy);
        else
            return proxyObject(objectToProxy);

        var synchronising = false;

        // this could possibly be made more efficient by determining which objects had been added or removed 
        // rather than reinitialising the proxy with the entire array contents
        function proxyObservableArray(source) {
            var target = ko.observableArray(proxyArray(source()));
            
            var originalPush = target.push;
            target.push = function(item) {
                return originalPush.call(target, proxyObject(item));
            };
            var originalUnshift = target.unshift;
            target.unshift = function(item) {
                return originalUnshift.call(target, proxyObject(item));
            };
            
            var targetSubscription = target.subscribe(function(contents) {
                if(!synchronising) {
                    synchronising = true;
                    source($.map(contents, function(item) { return item.__original; }));
                    synchronising = false;
                }
            });

            var sourceSubscription = source.subscribe(function(contents) {
                if(!synchronising) {
                    synchronising = true;
                    target(proxyArray(contents));
                    synchronising = false;
                }
            });

            target.dispose = function() {
                sourceSubscription.dispose();
                targetSubscription.dispose();
            };
            
            return target;
        }
        
        function proxyArray(source) {
            return $.map(source, proxyObject);
        }
        
        function proxyObject(source) {
            var target = { __original: source };
            for (var property in source)
                if (source.hasOwnProperty(property))
                    target[property] = proxyFor(property);
            
            if(iterator) iterator(target);
            return target;

            function proxyFor(propertyName) {
                var value = source[propertyName];
                if ($.isFunction(value))
                    return value;
                
                if($.isArray(value))
                    return ko.observableArray(proxyArray(value));
                
                if($.isPlainObject(value))
                    return proxyObject(value);

                return ko.computed({
                    read: function() { return source[propertyName]; },
                    write: function(newValue) { source[propertyName] = newValue; }
                });
            }
        }
    };
})();ko.composite.resources = {};
(function (resources) {
    var logger = ko.composite.logger;
    
    var loadedUrls = {};
    var failedUrls = { };
    var loadingUrls = {};

    resources.loadResource = function(url, loadDeferredAccessor) {
        if(failedUrls[url])
            return $.Deferred().reject();

        if(loadedUrls[url])
            return null;
        
        if(loadingUrls[url])
            return loadingUrls[url];

        var deferred = loadDeferredAccessor();
        logResourceLoad(deferred);
        
        loadingUrls[url] = deferred;
        $.when(deferred)
            .done(function () {
                loadedUrls[url] = true;
            })
            .fail(function () {
                failedUrls[url] = true;                
            })
            .always(function () {
                loadingUrls[url] = undefined;
            });

        return deferred;
        
        function logResourceLoad() {
            $.when(deferred).done(function() {
                logger.info("Loaded resource: " + url);
            })
            .fail(function() {
                logger.info("Failed loading resource: " + url);
            });
        }
    };
    
    resources.reload = function () {
        loadedUrls = { };
        failedUrls = { };
    };
})(ko.composite.resources);(function (resources) {
    resources.loadScript = function (url) {
        return resources.loadResource(url, function () {
            return $.ajax({
                url: url,
                dataType: 'text',
                async: !ko.composite.options.synchronous,
                cache: false,
                success: executeScript
            });
        });

        function executeScript(script) {
            if (ko.composite.options.debug.splitScripts === true) {
                var scripts = script.match(/(.*(\r|\n))*?(.*\/{2}\@ sourceURL.*)/g);
                //var scripts = script.match(/(.|\r|\n)*?(\/{2}\@ sourceURL.*)/g);

                if (scripts === null)
                    $.globalEval(appendSourceUrl(script));
                else {
                    for (var i = 0; i < scripts.length; i++)
                        $.globalEval(scripts[i]);
                }

            } else {
                $.globalEval(appendSourceUrl(script));
                ko.composite.logger.debug('Loaded script block from ' + url);
            }
        }

        function appendSourceUrl(script) {
            return script + '\n//@ sourceURL=' + url;
        }
    };
})(ko.composite.resources);(function (resources) {
    var options = ko.composite.options;

    resources.loadPaneStylesheet = function (path) {
        if(!(options.noPaneStylesheets === true))
            return resources.loadStylesheet(ko.composite.utils.resourcePath(options.stylesheetPath, path, options.stylesheetExtension));
    };

    resources.loadStylesheet = function (url) {
        return resources.loadResource(url, function () {
            return $.ajax({ 
                url: url,
                dataType: 'text',
                async: !ko.composite.options.synchronous,
                cache: false,
                success: renderStylesheet                 
            }); 
        });
    };
    
    function renderStylesheet(stylesheet) {
        $("<style>" + stylesheet + "</style>").appendTo("head");
    }
})(ko.composite.resources);(function (resources) {
    var options = ko.composite.options;
    var utils = ko.composite.utils;

    var loadedTemplates = {};

    resources.loadPaneTemplate = function (path, target) {
        return resources.loadTemplate(utils.resourcePath(options.templatePath, path, options.templateExtension), target);
    };

    resources.loadTemplate = function (url, target) {
        if (resources.templateIsLoaded(url)) {
            renderTemplate(resources.retrieveTemplate(url), target);
            return null;
        }

        return $.when(resources.loadResource(url, function () {
            return $.ajax({
                url: url,
                dataType: 'html',
                async: !options.synchronous,
                cache: false,
                success: function (template) {
                    resources.storeTemplate(url, template);
                }
            });
        })).done(function () {
            if (target)
                renderTemplate(resources.retrieveTemplate(url), target);
        });
    };

    resources.renderPaneTemplate = function (path, target) {
        var template = resources.retrieveTemplate(templatePath(path));
        renderTemplate(template, target);
    };

    function renderTemplate(template, target) {
        if (target) {
            // can't use html() - this uses the element innerHTML property and IE7 and 8 will strip comments (i.e. containerless control flow bindings)
            $(target).empty().append(template);
        }
    }

    resources.storeTemplate = function (path, template) {
        var $template = $(template);
        if ($template.not("script").length > 0 || $template.length === 0)
            $('<script type="text/template" id="' + utils.pathIdentifier(path) + '"></script>').text(template).appendTo('head');
        else
            $('head').append(template);
    };

    resources.templateIsLoaded = function (path) {
        return $('script[id="' + utils.pathIdentifier(path) + '"]').length > 0;
    };

    resources.retrieveTemplate = function (path) {
        return $('script[id="' + utils.pathIdentifier(path) + '"]').html();
    };

    function templatePath(panePath) {
        return utils.resourcePath(options.templatePath, panePath, options.templateExtension);
    }
})(ko.composite.resources);(function (resources) {
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
})(ko.composite.resources);ko.composite.Monitor = function (callback) {
    var count = 0;
    var callbacks = [];
    if (callback) callbacks.push(callback);

    this.registerCallback = function (callback) {
        callbacks.push(callback);
    };

    this.enter = function () {
        count++;
    };

    this.exit = function () {
        count--;
        if (count === 0)
            for (var i = callbacks.length - 1; i >= 0; i--) {
                setTimeout(callbacks[i]);
                callbacks.splice(i, 1);
            }
    };
};ko.composite.ModelBinder = function (pane, options) {
    var self = this;
    var resources = ko.composite.resources;
    var inlineHtml = saveInlineHtml();
    var model;
    var registration;
    var renderCancelled = false;

    this.loadAndBind = function () {
        $.complete(loadResources())
            .pipe(createModel)
            .done(renderIfNotDelayedOrCancelled)
            .fail(logError)
            .always(pane.monitor.exit);
    };

    function loadResources() {
        if (pane.path)
            return $.complete(
                resources.loadModel(pane.path),
                resources.loadPaneTemplate(pane.path),
                resources.loadPaneStylesheet(pane.path)
            );
    }

    function createModel() {
        registration = ko.composite.models[pane.path];
        if (registration && registration.constructor)
            model = new registration.constructor(pane.pubsub, pane.data, pane);
        else
            model = { pane: pane, data: pane.data };

        embedModelProperties(model, pane);

        if (model.dispose)
            ko.utils.domNodeDisposal.addDisposeCallback(pane.element, model.dispose);

        if (model.initialise) {
            var result = model.initialise();
            if (result === false)
                renderCancelled = true;
            return result;
        }
    }

    function renderIfNotDelayedOrCancelled() {
        if (!(options && options.delayRender) && !(registration && registration.options && registration.options.delayRender) && renderCancelled !== true)
            self.render();
    }

    this.render = function () {
        resources.renderPaneTemplate(pane.path, pane.element);
        inlineHtml.restore();
        if (model.prebind) model.prebind();
        applyBindings();
        if (model.rendered) model.rendered();
        if (options.rendered) options.rendered(pane);
        if (ko.composite.options.globalRenderFunction) ko.composite.options.globalRenderFunction(pane);
    };

    this.renderComplete = function () {
        if (model.childrenRendered) model.childrenRendered();
    };

    this.cancelRender = function () {
        renderCancelled = true;
    };

    function applyBindings() {
        try {
            for (var i = 0; i < pane.element.children.length; i++)
                ko.applyBindings(model, pane.element.children[i]);
        } catch (ex) {
            ko.composite.logger.error('An error occurred applying the bindings for pane ' + pane.path, ex);
        }
    }

    function logError() {
        ko.composite.logger.error("An error occurred in the model initialisation for pane " + pane.path);
    }

    function embedModelProperties() {
        model.__pane = pane;
    }

    function saveInlineHtml() {
        // we need to remove the inline html in case it contains data bindings that shouldn't be
        // processed by the parent pane's applyBindings
        var html = $(pane.element).html();
        pane.inlineHtml = html;
        $(pane.element).empty();

        return {
            restore: function () {
                if ($(pane.element).children().length == 0)
                    $(pane.element).append(html);
            }
        };
    }
};(function () {
    ko.composite.Pane = function (parentPane, sourceOptions, isRegion, element) {
        var utils = ko.composite.utils;
        var transitions = ko.composite.transitions;
        var self = this;

        utils.setProperty(self, 'parentPane', null, null, { parentPane: parentPane });
        utils.setProperty(self, 'rootPane', self, null, parentPane);
        utils.setProperty(self, 'data', null, sourceOptions, parentPane);
        utils.setProperty(self, 'monitor', new ko.composite.Monitor(), sourceOptions, parentPane);
        utils.setProperty(self, 'pubsub', constructPubSub, null, isRegion ? null : parentPane);
        utils.setProperty(self, 'handlesNavigation', isRegion, sourceOptions);
        utils.setProperty(self, 'transition', null, sourceOptions, null);
        utils.setProperty(self, 'requires', null, sourceOptions, null);
        utils.setProperty(self, 'id', utils.getUniqueId, sourceOptions, null);

        this.element = element;
        this.path = constructPath();

        var transition = transitions.create(self.transition);
        var binder = new ko.composite.ModelBinder(self, sourceOptions);

        if (isRootRenderingPane())
            self.monitor.registerCallback(heirarchyRendered);
        self.monitor.registerCallback(rendered);
        self.monitor.enter();

        $(element).on('destroyed', clean);

        if (this.handlesNavigation) {
            if (transition) self.element = transition.start(self.element);

            if (ko.composite.history)
                ko.composite.history.initialise(self);

            self.pubsub.subscribe("__navigate", function (navigateOptions) {
                // should this be sync?
                self.pubsub.publish("navigating", self);
                self.pubsub.unsubscribeTransient();

                clean();

                var transitionName = navigateOptions.hasOwnProperty('transition') ? navigateOptions.transition : self.transition;
                transition = transitions.create(transitionName);
                if (transition) self.element = transition.start(self.element);

                self.path = navigateOptions.path;
                self.data = navigateOptions.data;

                self.monitor = new ko.composite.Monitor(rendered);
                // this is duplicated in constructPubSub
                self.monitor.registerCallback(heirarchyRendered);
                self.monitor.enter();
                binder.loadAndBind();
            });

            if (self.parentPane && !self.parentPane.handlesNavigation && ko.composite.options.singlePubSub !== true) {
                self.parentPane.pubsub.subscribe("__navigate", function (navigateOptions) {
                    self.navigate(navigateOptions.path, navigateOptions.data);
                });
            }
        }

        function rendered() {
            delete self.monitor;
            if (transition) self.element = transition.end(self.element);
            binder.renderComplete();
            self.pubsub.publishSync('paneRendered', self);
        }

        function heirarchyRendered() {
            self.pubsub.publish('rendered', self);
            raiseDocumentRenderedEvent();
        }
        
        function raiseDocumentRenderedEvent() {
            var document = window.document;
            if (document.createEvent) {
                var event = document.createEvent("Event");
                event.initEvent("rendered", true, false);
                document.dispatchEvent(event);
            }
        }

        function clean() {
            // stop knockout calling cleanData
            var func = $.cleanData;
            $.cleanData = undefined;
            ko.cleanNode(element);
            $.cleanData = func;

            ko.composite.logger.debug("Pane " + self.path + " destroyed.");
        }

        this.loadAndBind = function () {
            binder.loadAndBind();
        };

        this.render = function () {
            binder.render();
        };

        this.cancelRender = function () {
            binder.cancelRender();
        };

        this.navigate = function (pathOrOptions, data) {
            var options;

            if (pathOrOptions.constructor === String)
                options = { path: ko.composite.utils.combinePaths(self.path, pathOrOptions), data: data, element: element };
            else {
                options = pathOrOptions;
                if (data) options.data = data;
                if (options.path) options.path = ko.composite.utils.combinePaths(self.path, options.path);
            }

            self.pubsub.publishSync("__navigate", options);
        };

        this.addPane = function (options) {
            return ko.composite.utils.addPane(element, options, self);
        };

        this.remove = function () {
            $(element).remove();
        };

        function constructPubSub() {
            if (ko.composite.options.singlePubSub === true) {
                if (!ko.composite.pubsub)
                    ko.composite.pubsub = create();
                return ko.composite.pubsub;
            }

            return create();

            function create() {
                return new PubSub({
                    forceSync: ko.composite.options.synchronous,
                    globalSubscribers: ko.composite.options.globalSubscribers
                });
            }
        }

        function constructPath() {
            if (sourceOptions) {
                var path = ko.utils.unwrapObservable(sourceOptions.path);
                var parentPath = parentPane ? parentPane.path : '';
                path = utils.ensureLeadingSlash(ko.composite.utils.combinePaths(parentPath, path));
                if (path == '/')
                    path = '';
                return path;
            }
        }

        function isRootRenderingPane() {
            return !parentPane || !parentPane.monitor || (isRegion && ko.composite.options.singlePubSub !== true);
        }
    };
})();
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
}ko.composite.transitions = {
    create: function(name) {
        return name && ko.composite.transitions[name] ? new ko.composite.transitions[name]() : null;
    }
};(function () {
    ko.composite.transitions.fade = function () {
        var $originalElement;

        this.start = function (element) {
            $originalElement = $(element).fadeOut(100);
            return createTemporaryElement();
        };

        this.end = function (element) {
            var $element = $(element);
            $originalElement
                .stop(false, true)
                .empty()
                .append($element.children())
                .fadeIn(200);
            $element.remove();
            return $originalElement[0];
        };
    };

    function createTemporaryElement() {
        var newElement = $('<div></div>').css({ left: -10000, top: -10000, position: 'fixed' });
        newElement.appendTo('body');
        return newElement[0];
    }
})();(function () {
    ko.composite.transitions.hide = function () {
        this.start = function (element) {
            //$(element).css({ left: -10000, top: -10000 });
            $(element).hide();
            return element;
        };

        this.end = function (element) {
            //$(element).css({ left: '', top: '' });
            $(element).show();
            return element;
        };
    };
})();(function () {
    ko.composite.transitions.replace = function () {
        var $originalElement;

        this.start = function (element) {
            $originalElement = $(element);
            return createTemporaryElement();
        };
        
        this.end = function(element) {
            var $element = $(element);
            $originalElement.html($element.children());
            $element.remove();
            return $originalElement[0];
        };
    };

    function createTemporaryElement() {
        var newElement = $('<div></div>').css({ left: -10000, top: -10000, position: 'fixed' });
        newElement.appendTo('body');
        return newElement[0];
    }
})();(function () {
    var utils = ko.composite.utils;

    ko.bindingHandlers.pane = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return updateBinding(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext, false);
        },
        init: controlsDescendantBindings
    };

    ko.bindingHandlers.region = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return updateBinding(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext, true);
        },
        init: controlsDescendantBindings
    };

    function updateBinding(element, optionsAccessor, allBindingsAccessor, viewModel, bindingContext, isRegion) {
        var options = getBindingOptions();

        var pane = new ko.composite.Pane(utils.extractPane(viewModel, bindingContext), options, isRegion, element);
        setTimeout(pane.loadAndBind);
        return pane;

        function getBindingOptions() {
            var binding = ko.utils.unwrapObservable(optionsAccessor());
            var allBindings = allBindingsAccessor();

            var result = (typeof (binding) == 'string') ? { path: binding} : binding;

            if (!result.data)
                if (allBindings.data)
                    result.data = allBindings.data;
                //else result.data = viewModel;
            
            return result;
        }
    }

    function controlsDescendantBindings() {
        return { controlsDescendantBindings: true };
    }
})();