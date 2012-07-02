
(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        Helpers.testContext.models.optionsChild = this;
        this.pubsub = pubsub;
        this.data = data;
        this.pane = pane;

        this.passedData = ko.observable(data);
    });
})();