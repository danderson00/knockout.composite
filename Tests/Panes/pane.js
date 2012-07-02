
(function () {
    ko.composite.registerModel(function(pubsub, data, pane) {
        var self = this;
        Helpers.testContext.models.pane = this;
        this.pubsub = pubsub;
        this.data = data;
        this.pane = pane;

        this.value = ko.observable('test');
        this.initialisedValue = ko.observable('');
        this.secondInitialisedValue = ko.observable('');

        this.rendered = function () {
            if (self.modelRendered)
                throw 'rendered called twice';
            self.modelRendered = true;
        };

        this.initialise = function() {
            return $.Deferred(function(deferred) {
                setTimeout(function() {
                    self.secondInitialisedValue('test');
                    deferred.resolve();
                }, 0);
            });
        };

        this.dispose = function () {
            if (self.disposed)
                throw 'dispose called twice';
            self.disposed = true;
        };
    });
})();
