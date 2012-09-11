ko.composite.registerModel(function (pubsub, data, pane) {
    var self = this;
    
    self.folders = ['Inbox', 'Archive', 'Sent', 'Spam'];
    self.selectedFolder = ko.observable().extend({ history: { key: 'folder' } });

    self.selectFolder = function (folder) {
        self.selectedFolder(folder);
        pubsub.publish('folderSelected', folder);
    };
    
    self.childrenRendered = function () {
        if(!self.selectedFolder())
            self.selectFolder(self.folders[0]);
    };
});