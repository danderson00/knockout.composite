
(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        Helpers.testContext.models.navigateChild = this;
        this.pubsub = pubsub;
        this.data = data;
        this.pane = pane;
    });
})();
