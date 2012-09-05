ko.composite.registerModel(function (pubsub, data, pane) {
    var self = this;
    
    self.folders = ['Inbox', 'Archive', 'Sent', 'Spam'];
    self.selectedFolder = ko.observable('Inbox');
});