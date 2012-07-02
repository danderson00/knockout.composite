(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        var self = this;
        
        this.value = ko.observable('Test...');

        this.send = function () {
            pubsub.publish('message', self.value());
        };
    });
})();