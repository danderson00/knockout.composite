$(function () {
    module("utils.objects");

    var utils = ko.composite.utils;

    test("mapToObservables maps properties to new object", function () {
        var target = utils.mapToObservables({ test1: 1, test2: 'Two' });
        equal(target.test1(), 1);
        equal(target.test2(), 'Two');
    });

    test("mapToObservables maps properties to existing object", function () {
        var target = utils.mapToObservables({ test1: 1, test2: 'Two' }, { test1: 2, test3: 3 });
        equal(target.test1(), 1);
        equal(target.test2(), 'Two');
        equal(target.test3, 3);
    });

    test("mapToObservables updates existing observables", function () {
        var observable = ko.observable(1);
        var target = { test1: observable };
        utils.mapToObservables({ test1: 2 }, target);
        equal(target.test1(), 2);
        equal(observable(), 2);
    });

    test("clearAllObservables sets observables to null", function () {
        var target = {
            test1: ko.observable(1),
            test2: ko.observable(2),
            test3: 3
        };
        utils.clearAllObservables(target);
        ok(target.test1() === null);
        ok(target.test2() === null);
        equal(target.test3, 3);
    });

    test("clearObservables does not clear computed observables", function () {
        var target = { test: ko.computed(function () { }) };
        utils.clearAllObservables(target);
        ok(ko.isComputed(target.test));
    });
});