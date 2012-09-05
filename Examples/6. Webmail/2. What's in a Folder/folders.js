ko.composite.registerModel(function (pubsub, data, pane) {
    var self = this;
    
    self.folders = ['Inbox', 'Archive', 'Sent', 'Spam'];
    self.selectedFolder = ko.observable();

    self.selectFolder = function (folder) {
        self.selectedFolder(folder);
        pubsub.publish('folderSelected', folder);
    };

    self.childrenRendered = function() {
        self.selectFolder(self.folders[0]);
    };
});