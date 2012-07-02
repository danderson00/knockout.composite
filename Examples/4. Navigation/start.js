(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        var self = this;

        this.value = ko.observable('Test...');
        this.next = function () {
            pane.navigate('end', { value: self.value() });
        };
    });
})();