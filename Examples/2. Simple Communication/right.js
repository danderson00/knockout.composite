(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        var self = this;

        this.value = ko.observable();

        pubsub.subscribe('message', function (value) {
            self.value(value);
        });
    });
})();