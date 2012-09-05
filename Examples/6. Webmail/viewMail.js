ko.composite.registerModel(function(pubsub, data, pane) {
    var self = this;
    
    self.data = ko.observable();

    self.initialise = function () {
        $.getJSON('data/mail/' + data.mailId, self.data);
    };
});