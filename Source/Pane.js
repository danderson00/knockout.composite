(function () {
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
