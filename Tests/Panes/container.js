
(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        var self = this;

        Helpers.testContext.models.container = this;
        this.pubsub = pubsub;
        this.data = data;
        this.pane = pane;

        this.rendered = function () {
            if (self.modelRendered)
                throw 'rendered called twice';
            self.modelRendered = true;
        };

        pubsub.subscribeOnce('rendered', function () {
            if (self.renderedMessage)
                throw 'rendered message raised twice';
            self.renderedMessage = true;
        });
    });
})();
