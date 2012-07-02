(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        var self = this;

        this.value = ko.observable('Test...');
        this.next = function () {
            pane.navigate('end', { value: self.value() });
        };

        // the dispose method is called when the pane's root element is destroyed
        // use this to unsubscribe from any pubsub messages or global DOM events
        this.dispose = function () {
            console.log('The start was destroyed!');
        };
    });
})();