ko.composite.registerModel(function (pubsub, data, pane) {
    var self = this;

    self.folders = ['Inbox', 'Archive', 'Sent', 'Spam'];
    self.defaultFolder = self.folders[0];

    pubsub.subscribePersistent('folderSelected', function(folder) {
        pane.navigate('folder', { folder: folder });
    });

    pubsub.subscribePersistent('mailSelected', function (mail) {
        pane.navigate('viewMail', { mailId: mail.id });
    });
});