
(function () {
    ko.composite.registerModel({ delayRender: true }, function(pubsub, data, pane) {
        var self = this;
        Helpers.testContext.models.delayRender = this;
        this.pubsub = pubsub;
        this.data = data;
        this.pane = pane;

        this.value = ko.observable(data && data.value);

        this.rendered = function () {
            if (self.modelRendered)
                throw 'rendered called twice';
            self.modelRendered = true;
        };
    });
})();
