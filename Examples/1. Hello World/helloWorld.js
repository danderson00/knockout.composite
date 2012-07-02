(function () {
    // this is the standard signature for registering models
    ko.composite.registerModel(function (pubsub, data, pane) {
        
        // some sort of data to pass to the UI
        this.message = "G'day, mate!";
    });
})();