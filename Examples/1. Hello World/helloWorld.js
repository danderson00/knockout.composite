(function () {
    // this is the standard signature for registering models
    ko.composite.registerModel(function (pubsub, data, pane) {
        
        // pass on the message from the data. In this simple case, we could have not created this
        // model at all - knockout.composite will create one containing 'data' and 'pane' properties
        this.message = data.message;
    });
})();