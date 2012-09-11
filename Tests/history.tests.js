$(function () {
    var history;
    var hash;
    var pubsub;
    var pane;

    module("history", {
        setup: function () {
            hash = Helpers.setHashProvider();
            history = ko.composite.utils.createHistory();
            pubsub = new PubSub({ forceSync: true });
            pane = { pubsub: pubsub, navigate: sinon.spy() };
        }
    });

    test("hash contains history property after setting property and calling update", function() {
        history.setProperty('test', 'test');
        history.update();
        equal(hash.query().p.test, 'test');
    });

    test("hash properties is undefined after calling update on empty history", function () {
        history.update();
        equal(hash.query().p, undefined);
    });

    test("hash is empty after calling initialise", function () {
        pane.path = '/test';
        pane.data = 'test';
        history.initialise(pane);
        deepEqual(hash.query(), {});
    });

    asyncTest("hash contains navigation path and data after __navigate message is published", function () {
        expect(2);
        history.initialise(pane);
        pubsub.publish('__navigate', { path: '/test', data: { test: 'test' } });
        Helpers.delay(function() {
            equal(hash.query().path, '/test');
            deepEqual(hash.query().data, { test: 'test' });
        });
    });

    test("history calls navigate after hash is changed externally", function () {
        history.initialise(pane);

        hash.update({ path: '/test', data: { test: 'test' } });
        hash.triggerChange();
        ok(pane.navigate.calledOnce);
    });

    asyncTest("setting hash to empty navigates to path set in pane when initialised", function () {
        expect(3);
        pane.path = '/test';
        pane.data = { test: 'test' };
        history.initialise(pane);
        pubsub.publish('__navigate', { path: '/test2', data: { test: 'test2' } });
        Helpers.delay(function () {
            hash.update('');
            hash.triggerChange();
            ok(pane.navigate.calledOnce);
            equal(pane.navigate.firstCall.args[0], '/test');
            deepEqual(pane.navigate.firstCall.args[1], { test: 'test' });
        });
    });

    test("changing properties does not navigate", function () {
        history.initialise(pane);
        history.setProperty('test', 'test');
        history.update();
        hash.triggerChange();
        ok(pane.navigate.notCalled);
    });

    test("pane path and data are set to current hash values after calling initialise", function() {
        hash.update({ path: '/test', data: { test: 'test' } });
        history.initialise(pane);
        equal(pane.path, '/test');
        deepEqual(pane.data, { test: 'test' });
    });

    test("triggering hash changed with same path and data does not navigate", function () {
        hash.update({ path: '/test', data: { test: 'test' } });
        history.initialise(pane);
        hash.triggerChange();
        ok(pane.navigate.notCalled);
    });
});