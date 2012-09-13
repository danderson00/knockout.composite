ko.composite.ModelBinder = function (pane, options) {
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
        pane.model = model;

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
};