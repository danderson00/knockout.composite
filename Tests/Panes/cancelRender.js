
(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        this.initialise = function () {
            pane.cancelRender();
        };
    });
})();
