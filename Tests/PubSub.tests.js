$(function () {
    module('PubSub');

    test('publish method accepts evelope as first parameter', function () {
        var pubsub = new PubSub();
        var spy = sinon.spy();

        pubsub.subscribe('testMessage', spy);
        pubsub.publish({ message: 'testMessage', data: 'test', sync: true });

        ok(spy.calledWith('test'));
        
    });

    test('unsubscribeAllExceptInternal unsubscribes all listeners except internals', function () {
        var pubsub = new PubSub();
        var normalToken = pubsub.subscribe('test', function () { });
        var internalToken = pubsub.subscribe('__test', function () { });
        pubsub.unsubscribeAllExceptInternal();
        ok(!(pubsub.unsubscribe(normalToken)), 'Normal token is unsubscribed');
        ok(pubsub.unsubscribe(internalToken), 'Internal token is not unsubscribed');
    });

    test('passing multiple handlers to subscribe returns correct number of tokens', function () {
        var pubsub = new PubSub();
        var tokens = pubsub.subscribe({
            'test': function () { },
            'test2': function () { }
        });
        equal(tokens.length, 2, 'Return type has correct length');
    });

    test('passing multiple handlers to subscribe returns array of string tokens', function () {
        var pubsub = new PubSub();
        var tokens = pubsub.subscribe({
            'test': function () { },
            'test2': function () { }
        });
        ok($.isArray(tokens));
        equal(tokens.length, 2);
        ok(tokens[0].constructor === String);
        ok(tokens[1].constructor === String);
    });

    test('passing multiple handlers to subscribe correctly subscribes messages', function () {
        var pubsub = new PubSub();
        var spy1 = sinon.spy(), spy2 = sinon.spy();
        pubsub.subscribe({
            'test': spy1,
            'test2': spy2
        });

        pubsub.publishSync('test');
        ok(spy1.called, "First subscription successful");

        pubsub.publishSync('test2');
        ok(spy2.called, "Second subscription successful");
    });

    test('passing multiple handlers to unsubscribe correctly unsubscribes messages', function () {
        var pubsub = new PubSub();
        var spy1 = sinon.spy(), spy2 = sinon.spy();
        var tokens = pubsub.subscribe({
            'test': spy1,
            'test2': spy2
        });
        pubsub.unsubscribe(tokens);

        pubsub.publishSync('test');
        ok(!spy1.called, "First subscription successful");

        pubsub.publishSync('test2');
        ok(!spy2.called, "Second subscription successful");
    });

    // add some subscribers around the subscribe once to ensure it is spliced from the subscribers array correctly.
    test('subscribeOnce only publishes message to subscriber once', function () {
        var pubsub = new PubSub();
        var test1Count = 0;
        var test2Count = 0;
        var count = 0;

        pubsub.subscribe('test', function () { test1Count++; });
        pubsub.subscribeOnce('test', function () { count++; });
        pubsub.subscribe('test', function () { test2Count++; });
        pubsub.publishSync('test');
        pubsub.publishSync('test');
        equal(test1Count, 2);
        equal(count, 1);
        equal(test2Count, 2);
    });

    test("globalSubscribers passed in options are called", function () {
        var globalSubscribers = {
            'test': function (data) {
                window.globalSubscriberTest = data;
            }
        };
        var pubsub = new PubSub({ globalSubscribers: globalSubscribers });
        pubsub.publishSync('test', 'testData');
        equal(window.globalSubscriberTest, 'testData');
    });

    test("globalSubscribers passed in options as function are called", function () {
        var globalSubscribers = function () {
            return {
                'test': function (data) {
                    window.globalSubscriberTest = data;
                }
            };
        };
        var pubsub = new PubSub({ globalSubscribers: globalSubscribers });
        pubsub.publishSync('test', 'testData');
        equal(window.globalSubscriberTest, 'testData');
    });

    test("transient subscriptions are removed when calling unsubscribeTransient", function () {
        var pubsub = new PubSub({ forceSync: true });
        var spy = sinon.spy();
        pubsub.subscribe('test', function () { });
        pubsub.subscribe('test', spy);
        pubsub.subscribe('test', function () { });
        pubsub.unsubscribeTransient();
        pubsub.publish('test');
        equal(spy.callCount, 0);
    });

    test("persistent subscriptions are not removed when calling unsubscribeTransient", function () {
        var pubsub = new PubSub({ forceSync: true });
        var spy = sinon.spy();
        pubsub.subscribe('test', function () { });
        pubsub.subscribePersistent('test', spy);
        pubsub.subscribe('test', function () { });
        pubsub.unsubscribeTransient();
        pubsub.publish('test');
        equal(spy.callCount, 1);
    });

    test("subscribeOnceFor is triggered by first passed message", function () {
        var pubsub = new PubSub({ forceSync: true });
        var spy = sinon.spy();
        pubsub.subscribeOnceFor(['test1', 'test2'], spy);
        pubsub.publish('test1');
        ok(spy.called);
    });

    test("subscribeOnceFor is triggered by second passed message", function () {
        var pubsub = new PubSub({ forceSync: true });
        var spy = sinon.spy();
        pubsub.subscribeOnceFor(['test1', 'test2'], spy);
        pubsub.publish('test2');
        ok(spy.called);
    });

    test("subscribeOnceFor is only triggered once by any passed message", function () {
        var pubsub = new PubSub({ forceSync: true });
        var spy = sinon.spy();
        pubsub.subscribeOnceFor(['test1', 'test2'], spy);
        pubsub.publish('test1');
        pubsub.publish('test2');
        equal(spy.callCount, 1);
    });

    test("subscribers are passed data as first argument and envelope as second", function () {
        var pubsub = new PubSub({ forceSync: true });
        var spy = sinon.spy();
        pubsub.subscribe('test1', spy);
        pubsub.publish('test1', 'test');
        ok(spy.calledOnce);
        equal(spy.firstCall.args[1].message, 'test1');
        equal(spy.firstCall.args[1].data, 'test');
    });

    test("subscribers to '*' are executed for every message", function () {
        var pubsub = new PubSub({ forceSync: true });
        var spy = sinon.spy();
        pubsub.subscribe('*', spy);
        pubsub.publish('test1');
        pubsub.publish('test2');
        equal(spy.callCount, 2);
    });

    test("subscribers to '*' are passed correct message names", function () {
        var pubsub = new PubSub({ forceSync: true });
        var spy = sinon.spy();
        pubsub.subscribe('*', spy);
        pubsub.publish('test1', '1');
        pubsub.publish('test2', '2');
        equal(spy.firstCall.args[1].message, 'test1');
        equal(spy.secondCall.args[1].message, 'test2');
    });


    module("PubSub.original", {
        setup: function () {
            window.pubsub = new PubSub();
        },
        teardown: function () {
            delete (window.pubsub);
        }
    });

    // helps us make sure that the order of the tests have no impact on their succes
    function getUniqueString() {
        if (getUniqueString.uid === undefined) {
            getUniqueString.uid = 0;
        }
        getUniqueString.uid++;

        return "my unique String number " + getUniqueString.uid.toString();
    }

    // makes sure that all tokens in the passed array are different
    function assertAllTokensDifferent(tokens) {
        var length = tokens.length;
        var j, k;
        ok(tokens.length > 0);

        // compare all tokens
        for (j = 0; j < length; j++)
            for (k = j + 1; k < length; k++)
                ok(tokens[j] !== tokens[k]);

        equal(j, length);
        equal(k, length);
    }

    test("subscribe method should return token as String", function () {
        var func = function () { },
		message = getUniqueString(),
		token = pubsub.subscribe(message, func);
        ok(typeof (token) == "string");
    });

    test("subscribe method should return new token for several subscribtions with same function", function () {
        var func = function () { },
		tokens = [],
		iterations = 10,
		message = getUniqueString(),
		i;

        // build an array of tokens
        for (i = 0; i < iterations; i++) {
            tokens.push(pubsub.subscribe(message, func));
        }
        // make sure all tokens are different
        assertAllTokensDifferent(tokens);
    });

    test("subscribe method should return unique token for unique functions", function () {
        var tokens = [],
		iterations = 10,
		message = getUniqueString(),
		i;

        function bakeFunc(value) {
            return function () {
                return value;
            };
        }

        // build an array of tokens, passing in a different function for each subscription
        for (i = 0; i < iterations; i++) {
            tokens.push(pubsub.subscribe(message, bakeFunc(i)));
        }

        // make sure all tokens are different
        assertAllTokensDifferent(tokens);
    });

    test("publish method should return false if there are no subscribers", function () {
        var message = getUniqueString();
        equal(pubsub.publish(message), false);
    });

    test("publish method should return true if there are subscribers to a message", function () {
        var message = getUniqueString(),
		func = function () { };

        pubsub.subscribe(message, func);
        ok(pubsub.publish(message));
    });

    test("publish method should call all subscribers for a message exactly once", function () {
        var message = getUniqueString(),
		spy1 = sinon.spy(),
		spy2 = sinon.spy();

        pubsub.subscribe(message, spy1);
        pubsub.subscribe(message, spy2);

        pubsub.publishSync(message, 'my payload'); // force sync here, easier to test

        ok(spy1.calledOnce);
        ok(spy2.calledOnce);
    });

    test("publish method should call all ONLY subscribers of the published message", function () {
        var message1 = getUniqueString(),
		message2 = getUniqueString(),
		spy1 = sinon.spy(),
		spy2 = sinon.spy();

        pubsub.subscribe(message1, spy1);
        pubsub.subscribe(message2, spy2);

        pubsub.publishSync(message1, 'some payload');

        // ensure the first subscriber IS called
        ok(spy1.called);
        // ensure the second subscriber IS NOT called
        equal(spy2.callCount, 0);
    });

    test("publish method should call subscribers with data as first argument", function () {
        var message = getUniqueString(),
		spy = sinon.spy(),
		data = getUniqueString();

        pubsub.subscribe(message, spy);
        pubsub.publishSync(message, data);

        ok(spy.calledWith(data));
    });

    test("publish method should publish method asynchronously", function () {
        var setTimeout = sinon.stub(window, 'setTimeout'),
		message = getUniqueString(),
		spy = sinon.spy(),
		data = getUniqueString();

        pubsub.subscribe(message, spy);
        pubsub.publish(message, data);

        ok(setTimeout.calledOnce);

        setTimeout.restore();
    });

    test("publishSync method should allow synchronous publication", function () {
        var setTimeout = sinon.stub(window, 'setTimeout'),
		message = getUniqueString(),
		spy = sinon.spy(),
		data = getUniqueString();

        pubsub.subscribe(message, spy);
        pubsub.publishSync(message, data);

        // make sure that setTimeout was never called
        equal(setTimeout.callCount, 0);

        setTimeout.restore();
    });

    test("publish method should call all subscribers, even if there are exceptions", function () {
        ko.composite.options.debug.handleExceptions = true;
        var message = getUniqueString(),
		func1 = function () {
		    throw ('some error');
		},
		spy1 = sinon.spy(),
		spy2 = sinon.spy();

        pubsub.subscribe(message, func1);
        pubsub.subscribe(message, spy1);
        pubsub.subscribe(message, spy2);

        pubsub.publishSync(message, undefined);

        ok(spy1.called);
        ok(spy2.called);
        ko.composite.options.debug.handleExceptions = false;
    });

    test("unsubscribe method should return token when succesful", function () {
        var func = function () { },
		message = getUniqueString(),
		token = pubsub.subscribe(message, func),
		result = pubsub.unsubscribe(token);

        equal(result, token);
    });

    test("unsubscribe method should return false when unsuccesful", function () {
        var unknownToken = 'my unknown token',
		result = pubsub.unsubscribe(unknownToken),
		func = function () { },
		message = getUniqueString(),
		token = pubsub.subscribe(message, func);

        // first, let's try a completely unknown token
        equal(result, false);

        // now let's try unsubscribing the same method twice
        pubsub.unsubscribe(token);
        equal(pubsub.unsubscribe(token), false);
    });
});