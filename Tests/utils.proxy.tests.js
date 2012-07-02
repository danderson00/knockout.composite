$(function () {
    module("utils.proxy");

    var utils = ko.composite.utils;

    test("proxy copies all properties as observables", function () {
        var source = { test1: 1, test2: '2', test3: ko.observable(3) };
        var target = utils.proxy(source);
        ok(ko.isObservable(target.test1));
        ok(ko.isObservable(target.test2));
        ok(ko.isObservable(target.test3));
    });

    test("reading from proxied property returns correct value", function () {
        var source = { test: 1 };
        var target = utils.proxy(source);
        equal(target.test(), 1);
    });

    test("writing to proxied property sets value on source", function () {
        var source = { test: 1 };
        var target = utils.proxy(source);
        target.test(2);
        equal(source.test, 2);
    });

    test("proxy copies reference to functions", function () {
        var source = { test: function () { } };
        var target = utils.proxy(source);
        equal(target.test, source.test);
    });

    test("proxy does not duplicate existing observables", function () {
        var source = { test: ko.observable() };
        var target = utils.proxy(source);
        equal(target.test, source.test);
    });

    test("proxy creates a deep proxy of objects", function() {
        var source = { test: { test: 1 } };
        var target = utils.proxy(source);
        notEqual(target.test.test, source.test.test);
    });

    test("proxy creates a proxy for all elements of an array", function () {
        var source = [{ test: 0 }, { test: 1 }];
        var target = utils.proxy(source);
        equal(target.length, 2);
        equal(target[0].test(), 0);
        equal(target[1].test(), 1);
    });

    test("proxy applies iterator to each proxy for an array", function () {
        var source = [{ test: 0 }, { test: 1}];
        var target = utils.proxy(source, function (proxy) {
            proxy.visited = true;
        });
        ok(target[0].visited);
        ok(target[1].visited);
    });

    test("proxy updates when source observableArray changes", function () {
        var source = ko.observableArray();
        var target = utils.proxy(source);

        source.push({});
        equal(target().length, 1);
    });

    test("source updates when proxied observableArray changes", function () {
        var source = ko.observableArray();
        var target = utils.proxy(source);

        target.push({});
        equal(source().length, 1);
    });

    test("push adds proxied object to observableArray", function () {
        var source = ko.observableArray();
        var target = utils.proxy(source, function (item) { item.test = true; });

        target.push({});
        ok(target()[0].test);
    });

    test("push adds original object to source observableArray", function () {
        var source = ko.observableArray();
        var target = utils.proxy(source, function (item) { item.proxied = true; });

        target.push({ proxied: false });
        ok(source()[0].proxied === false);
        ok(target()[0].proxied === true);
    });

    test("observableArrays do not synchronise after calling dispose", function () {
        var source = ko.observableArray();
        var target = utils.proxy(source, function (item) { item.test = true; });

        target.dispose();
        target.push({});
        equal(source().length, 0);
        source.push({});
        equal(target().length, 1);
    });

});