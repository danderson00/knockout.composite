$(function() {
    module("webmail.folders");

    asyncTest("selecting a folder sets selectedFolder observable", function () {
        expect(1);
        $.when(ko.composite.resources.loadModel('folders')).done(function () {
            var pubsub = { publish: function () { } };
            var model = new ko.composite.models['folders'].constructor(pubsub);
            model.selectFolder('Sent');
            equal(model.selectedFolder(), 'Sent');
            start();
        });
    });

    asyncTest("selecting a folder publishes folderSelected method", function () {
        expect(3);
        $.when(ko.composite.resources.loadModel('folders')).done(function () {
            var pubsub = { publish: sinon.spy() };
            var model = new ko.composite.models['folders'].constructor(pubsub);
            model.selectFolder('Sent');
            ok(pubsub.publish.calledOnce);
            equal(pubsub.publish.firstCall.args[0], 'folderSelected');
            equal(pubsub.publish.firstCall.args[1], 'Sent');
            start();
        });
    });
});