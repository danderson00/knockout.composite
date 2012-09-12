$(function() {
    module("webmail.folders");

    test("selecting a folder sets selectedFolder observable", function () {
        var pubsub = { publish: function () { } };
        var model = createModel('folders', pubsub);
        model.selectFolder('Sent');
        equal(model.selectedFolder(), 'Sent');
    });

    test("selecting a folder publishes folderSelected method", function () {
        var pubsub = { publish: sinon.spy() };
        var model = createModel('folders', pubsub);
        model.selectFolder('Sent');

        ok(pubsub.publish.calledOnce);
        equal(pubsub.publish.firstCall.args[0], 'folderSelected');
        equal(pubsub.publish.firstCall.args[1], 'Sent');
    });
    

    module("webmail.layout");

    test("model navigates when folderSelected message is published", function () {
        var pubsub = new PubSub({ forceSync: true });
        var pane = { navigate: sinon.spy() };
        var model = createModel('layout', pubsub, null, pane);
        
        pubsub.publish('folderSelected', 'Sent');
        ok(pane.navigate.calledOnce);
        equal(pane.navigate.firstCall.args[0], 'mails');
        deepEqual(pane.navigate.firstCall.args[1], { folder: 'Sent' });
    });


    module("webmail.mails");

    test("initialise loads specified folder and sets data observable", function () {
        $.mockjax({
            url: '../data/folder/Sent',
            responseText: JSON.stringify({ test: 'test' }),
            responseTime: 0
        });

        var model = createModel('mails', null, { folder: 'Sent' });
        model.initialise();
        deepEqual(model.data(), { test: 'test' });
    });
});