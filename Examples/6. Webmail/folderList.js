ko.composite.registerModel(function (pubsub, data, pane) {
    var self = this;

    self.folders = data.folders;
    self.selectedFolder = ko.observable(data.folder).extend({ history: { key: 'folder' } });

    self.selectFolder = function (folder) {
        self.selectedFolder(folder);
        pubsub.publish('folderSelected', folder);
    };
});