$(function () {
    module("history");

    // need to figure out a way for the hashchange stuff to not interfere with qunit.

//    test("initialise creates event handler and subscription", function () {
//        var pane = { pubsub: Helpers.mockPubSub() };
//        ko.composite.history.initialise(pane);
//        
//        ok(pane.pubsub.subscribe.calledOnce());
//        equal($(window).data('events').hashchange.length, 1);

//        $(window).unbind('hashchange');
//    });

//    test("teardown removes event handler and subscription", function () {
//        var pane = { pubsub: Helpers.mockPubSub() };
//        ko.composite.history.initialise(pane);

//        ok(pane.pubsub.unsubscribe.calledOnce());
//        equal($(window).data('events').hashchange.length, 0);
//    });

//    test("pane.navigate is called when URL changes", function () {

//    });

//    test("urlResolver is called", function () {
//        ko.composite.history.initialise();
//    });
});