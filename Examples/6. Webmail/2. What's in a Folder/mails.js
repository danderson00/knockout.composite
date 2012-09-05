ko.composite.registerModel(function (pubsub, data, pane) {
    var self = this;

    self.data = ko.observable();

    pubsub.subscribe('folderSelected', function(folder) {
        $.getJSON('../data/folder/' + folder, self.data);
    });
});