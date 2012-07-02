
(function () {
    ko.composite.registerModel(function(pubsub, data, pane) {
        var self = this;
        Helpers.testContext.models.addPane = this;
        this.pubsub = pubsub;
        this.data = data;
        this.pane = pane;
    });
})();
