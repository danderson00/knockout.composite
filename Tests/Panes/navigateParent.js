
(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        Helpers.testContext.models.navigateParent = this;
        this.pubsub = pubsub;
        this.data = data;
        this.pane = pane;
    });
})();
