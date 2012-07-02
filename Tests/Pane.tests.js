$(function () {
    module('Pane');

    var utils = ko.composite.utils;

    test('constructor sets correct path from options', function () {
        var pane = new ko.composite.Pane(null, { path: 'path/to/content' });
        equal(pane.path, '/path/to/content');
    });

    test('setProperty sets default', function () {
        var pane = new ko.composite.Pane();
        utils.setProperty(pane, 'test', 'default', {}, {});
        equal(pane.test, 'default');
    });

    test('setProperty sets default from function', function () {
        var pane = new ko.composite.Pane();
        utils.setProperty(pane, 'test', function () { return 'default'; }, {}, {});
        equal(pane.test, 'default');
    });

    test('setProperty inherits when default is set', function () {
        var pane = new ko.composite.Pane();
        utils.setProperty(pane, 'test', 'default', {}, { test: 'inherited' });
        equal(pane.test, 'inherited');
    });

    test('setProperty sets from source when default is set', function () {
        var pane = new ko.composite.Pane();
        utils.setProperty(pane, 'test', 'default', { test: 'fromSource' }, {});
        equal(pane.test, 'fromSource');
    });

    test('setProperty sets from source when inherit is set', function () {
        var pane = new ko.composite.Pane();
        utils.setProperty(pane, 'test', 'default', { test: 'fromSource' }, { test: 'inherited' });
        equal(pane.test, 'fromSource');
    });

    test('setProperty sets option explicitly to false', function () {
        var pane = new ko.composite.Pane();
        utils.setProperty(pane, 'test', true, { test: false }, { test: false });
        equal(pane.test, false);
    });

    test('navigate raises event with specified pane path', function () {
        expect(1);
        var pane = new ko.composite.Pane();
        mockPubSub(pane, function (message, data) {
            equal(data.path, '/panes/pane');
        });
        pane.navigate('/panes/pane');
    });

    test('navigate raises event with inherited location', function () {
        expect(1);
        var pane = new ko.composite.Pane();
        pane.path = '/panes/oldPane';
        mockPubSub(pane, function (message, data) {
            equal(data.path, '/panes/newPane');
        });
        pane.navigate('newPane');
    });

    test('navigate raises event with specified absolute location', function () {
        expect(1);
        var pane = new ko.composite.Pane();
        pane.path = '/old/pane';
        mockPubSub(pane, function (message, data) {
            equal(data.path, '/panes/pane');
        });
        pane.navigate('/panes/pane', null);
    });

    test('Pane adds global subscriptions to pub sub', function () {
        var test;
        ko.composite.options.globalSubscribers = {
            'test': function () { test = 'test'; }
        };
        var pane = new ko.composite.Pane();
        pane.pubsub.publishSync('test');
        equal(test, 'test', 'Message correctly published to global subscriber');
        ko.composite.options.globalSubscribers = null;
    });

    // ergh... hate the setTimeouts. refactor. 
    asyncTest('Pane.addPane adds pane to existing pane', function () {
        expect(1);
        Helpers.renderPane('addPane', 'test', function () {
            Helpers.testContext.models.addPane.pane.addPane({ path: 'addPane', data: 'test2' });
            setTimeout(function () {
                equal($('#qunit-fixture div span').text(), 'test2');
                start();
            }, 50);
        }, 50, false);
    });

    asyncTest('Pane.remove removes pane from DOM', function () {
        expect(1);
        Helpers.renderPane('addPane', null, function () {
            Helpers.testContext.models.addPane.pane.addPane({ path: 'addPane', data: 'test2' });
            setTimeout(function () {
                Helpers.testContext.models.addPane.pane.remove();
                equal($('#qunit-fixture div').length, 0, "Element has been removed from DOM");
                start();
            }, 50);
        }, 50, false);
    });

    asyncTest('document rendered event is fired', function () {
        expect(1);
        window.document.addEventListener("rendered", handleRendered);
        Helpers.renderPane('pane', null, null, 0, false);
        function handleRendered() {
            window.document.removeEventListener("rendered", handleRendered);
            ok(true);
            start();
        }
    });

    function mockPubSub(pane, publishMethod) {
        pane.pubsub = Helpers.mockPubSub(publishMethod);
    }
});