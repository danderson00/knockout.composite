(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        var self = this;

        // expose the list that we were passed to our view
        this.list = data.list;
        
        this.newValue = ko.observable('Test...');

        this.add = function () {
            self.list.push(self.newValue());
        };
    });
})();