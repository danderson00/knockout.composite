ko.composite.registerModel(function (pubsub, data, pane) {
    pubsub.subscribePersistent('folderSelected', function(folder) {
        pane.navigate('mails', { folder: folder });
    });

    pubsub.subscribePersistent('mailSelected', function (mail) {
        pane.navigate('viewMail', { mailId: mail.id });
    });
});