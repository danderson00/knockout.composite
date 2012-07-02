
(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        Helpers.testContext.models.optionsParent = this;
        this.pubsub = pubsub;
        this.data = data;
        this.pane = pane;

        this.dataToPass = ko.observable(1);
    });
})();