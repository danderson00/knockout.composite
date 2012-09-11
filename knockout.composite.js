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
                $.when(ko.composite.resources.loadDependencies("", { requires: preload })).done(function () {
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

    function publish(envelope) {
        var subscribers = getSubscribers(envelope.message);
        var subscribersCopy = subscribers.concat(getSubscribers('*'));
        addGlobalSubscribers(envelope.message, subscribersCopy);        

        if (subscribersCopy.length == 0)
            return false;

        for (var i = 0; i < subscribersCopy.length; i++) {            
            removeSubscriberIfOnceOnly(subscribersCopy[i]);
            if (envelope.sync === true || self.forceSync === true)
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
                    func(envelope.data, envelope);
                } catch (e) {
                    if (envelope.sync || self.forceSync)
                    // if we are running synchronously, rethrow the exception after a timeout, 
                    // or it will prevent the rest of the subscribers from receiving the message
                        setTimeout(handleException(e, envelope.message), 0);
                    else
                        handleException(e, envelope.message)();
                }
            else
                func(envelope.data, envelope);
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

    this.publish = function (messageOrEnvelope, data) {
        var envelope = messageOrEnvelope && messageOrEnvelope.message ?
            messageOrEnvelope : { message: messageOrEnvelope, data: data, sync: false };
        return publish(envelope);
    };

    this.publishSync = function (message, data) {
        return publish({ message: message, data: data, sync: true });
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
        var logString;
        if (error && error.stack)
            logString = message + ' ' + error.stack;
        else if (error && error.message)
            logString = message + ' ' + error.message;
        else
            logString = message + ' ' + (error ? error : '');

        if (logLevel <= 3)
            this.log('error', logString);

        if (this.errorCallback)
            $.when(this.errorCallback(logString))
                .fail(function () {
                    self.log('error', 'Unable to successfully log error!');
                });
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

    utils.isFullUrl = function(path) {
        return path.indexOf('://') > 0;
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
        if(!element) throw "bindPane: argument element must be provided";
        return ko.bindingHandlers.pane.update(element, function () { return utils.inheritParentPath(options); }, function () { return {}; }, { __pane: parentPane });                
    };

    utils.addPane = function(parentElement, options, parentPane) {
        if(!parentElement) throw "addPane: argument parentElement must be provided";
        var container = $('<div></div').appendTo(parentElement)[0];
        return utils.bindPane(container, options, parentPane);
    };

    utils.addPaneAfter = function(element, options, parentPane) {
        if(!element) throw "addPaneAfter: argument element must be provided";
        var container = $('<div></div').insertAfter(element)[0];
        return utils.bindPane(container, options, parentPane);
    };

    utils.openWindow = function(options, parentPane) {
        var newWindow = window.open();
        $('head link,style').clone().appendTo(newWindow.document.head);
        ko.composite.utils.bindPane(newWindow.document.body, options, parentPane);
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

    // this is taken from http://stackoverflow.com/questions/201183/how-do-you-determine-equality-for-two-javascript-objects
    // while succinct, it's far from the most efficient implementation. If better efficiency is required, rip isEqual from underscore.
    utils.equal = function(obj1, obj2) {
        function equals(obj1, obj2) {
            return JSON.stringify(obj1) === JSON.stringify($.extend(true, { }, obj1, obj2));
        }

        return obj1 === obj2 || (equals(obj1, obj2) && equals(obj2, obj1));
    };
    
    function isPopulatedObservable(target) {
        return ko.isObservable(target) && !ko.isComputed(target) && target();
    }

    utils.objectHasProperties = function(source) {
        for (var property in source)
            if (source.hasOwnProperty(property))
                return true;
        return false;
    };
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
            if (ko.composite.options.debug.splitScripts === true && shouldSplit(script)) {
                var scripts = script.match(/(.*(\r|\n))*?(.*\/{2}\@ sourceURL.*)/g);

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

        function shouldSplit(script) {
            var tagMatches = script.match("(//@ sourceURL=)");
            return tagMatches && tagMatches.length > 1;
        }
    };

    resources.loadCrossDomainScript = function (url) {
        return resources.loadResource(url, function () {
            return resources.loadResource(url, function () {
                var deferred = $.Deferred();

                var head = document.getElementsByTagName('head')[0];
                var script = document.createElement('script');
                var failed = false;

                script.addEventListener("load", function () {
                    if (!failed)
                        deferred.resolve();
                }, false);

                script.addEventListener("error", function () {
                    failed = true;
                    deferred.reject();
                }, false);

                script.src = url;
                head.appendChild(script);

                return deferred;
            });
        });
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
                            : loadFunction(dependencyPath(path, thisDependencyPath, basePath)));
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
                callbacks[i]();
//                setTimeout(callbacks[i]);
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
        if (shouldRender()) self.render();
    }
    
    function shouldRender() {
        return (pane.path || pane.inlineHtml) &&
            !(options && options.delayRender) &&
            !(registration && registration.options && registration.options.delayRender) &&
            renderCancelled !== true;
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
            if ((self.path || self.inlineHtml) && transition)
                self.element = transition.start(self.element);

            if (ko.composite.history)
                ko.composite.history.initialise(self);

            self.pubsub.subscribe("__navigate", function (navigateOptions) {
                // should this be sync?
                self.pubsub.publish("navigating", self);
                self.pubsub.unsubscribeTransient();

                clean();
                self.path = navigateOptions.path;
                self.data = navigateOptions.data;

                var transitionName = navigateOptions.hasOwnProperty('transition') ? navigateOptions.transition : self.transition;
                transition = transitions.create(transitionName);
                if (transition) self.element = transition.start(self.element);

                self.monitor = new ko.composite.Monitor(rendered);
                // this is duplicated in constructPubSub
                self.monitor.registerCallback(heirarchyRendered);
                self.monitor.enter();
                binder.loadAndBind();
            });

            if (self.parentPane && !self.parentPane.handlesNavigation && self.parentPane.pubsub !== self.pubsub) {
                self.parentPane.pubsub.subscribe("__navigate", function (navigateOptions) {
                    self.navigate(navigateOptions.path, navigateOptions.data);
                });
            }
        }

        function rendered() {
            delete self.monitor;
            if ((self.path || self.inlineHtml) && transition)
                self.element = transition.end(self.element);
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
(function () {
    var lastUpdatedValue;
    var callbacks = [];

    if ($(window).hashchange !== undefined) {
        $(function() {
            $(window).hashchange(function() {
                if(currentHash() !== lastUpdatedValue)
                    for (var i = 0; i < callbacks.length; i++)
                        callbacks[i]();
                lastUpdatedValue = null;
            });
        });
    }
    
    ko.composite.hashProvider = {
        addExternalChange: function(callback) {
            callbacks.push(callback);
        },
        removeExternalChange: function (callback) {
            callbacks.splice(callbacks.indexOf(callback), 1);
        },
        update: function (value) {
            throttle(function() {
                var hash = value && ko.composite.utils.objectHasProperties(value) ? JSON.stringify(value) : '';
                lastUpdatedValue = hash;
                window.location.hash = hash;
            });
        },
        query: function () {
            var hash = currentHash();
            return hash ? JSON.parse(hash) : { };
        }
    };
    
    function currentHash() {
        return window.location.hash.replace(/^#/, '');
    } 

    var updateTimer;
    function throttle(action) {
        if (updateTimer)
            clearTimeout(updateTimer);
        updateTimer = setTimeout(action, 20);
    }
})();
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

(function() {
    ko.extenders.history = function (target, options) {
        if (!options || !options.key) return;

        var key = options.key;
        var history = ko.composite.history;
        ko.composite.hashProvider.addExternalChange(updateTarget);
        var defaultValue = target();

        var storedValue = history.getProperty(key);
        if (storedValue !== undefined)
            target(storedValue);

        target.subscribe(function (value) {
            history.setProperty(key, value);
            history.update();
        });

        function updateTarget() {
            target(history.getProperty(key) || defaultValue);
        }

        ko.composite.hashProvider.addExternalChange(updateTarget);
        
        if(options.pane) {
            var oldDispose = options.pane.dispose;
            options.pane.dispose = function() {
                if (oldDispose) oldDispose();
                ko.composite.hashProvider.removeExternalChange(updateTarget);
            };
        }
        
        return target;
    };
})();
ko.composite.transitions = {
    create: function(name) {
        return name && ko.composite.transitions[name] ? new ko.composite.transitions[name]() : null;
    }
};(function () {
    ko.composite.transitions.fade = function () {
        var $originalElement;

        this.start = function (element) {
            $originalElement = $(element);
            if ($originalElement.children().length > 0)
                $originalElement.fadeOut(100);
            else
                $originalElement.hide();
            return createTemporaryElement();
        };

        this.end = function (element) {
            var $element = $(element);
            if ($originalElement) {
                $originalElement
                    .stop(false, true)
                    .empty()
                    .append($element.children());
                $element.remove();
            }

            var target = $originalElement || $element;
            return target.fadeIn(200)[0];
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
