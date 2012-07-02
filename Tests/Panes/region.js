
(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        var self = this;

        Helpers.testContext.models.region = this;
        this.pubsub = pubsub;
        this.data = data;
        this.pane = pane;

        this.rendered = function () {
            if (self.modelRendered)
                throw 'rendered called twice';
            self.modelRendered = true;
        };

        this.dispose = function () {
            if (self.disposed)
                throw 'dispose called twice';
            self.disposed = true;
        };

        pubsub.subscribeOnce('rendered', function () {
            if (self.renderedMessage)
                throw 'rendered message raised twice';
            self.renderedMessage = true;
        });
    });
})();
