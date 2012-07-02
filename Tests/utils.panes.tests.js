$(function() {
    module("utils.panes");

    var utils = ko.composite.utils;

    //    test("getUniqueId starts at 0 and increments", function () {
    //        equal(utils.getUniqueId(), 0);
    //        equal(utils.getUniqueId(), 1);
    //        equal(utils.getUniqueId(), 2);
    //    });

    test("passing 0 to getUniqueId resets the counter", function() {
        equal(utils.getUniqueId(0), 0);
        equal(utils.getUniqueId(), 1);
        equal(utils.getUniqueId(0), 0);
    });

    //    asyncTest("addPane renders pane to specified element", function () {
    //        expect(1);

    //        Helpers.addPane('optionsParent', null, function() {
    //            equal($('#child').length, 1);
    //        });
    //    });

    //    asyncTest("removePane removes element from DOM", function () {
    //        expect(2);

    //        Helpers.addPane('optionsParent', null, function() {
    //            equal($('#child').length, 1);
    //            ko.composite.utils.removePane('#qunit-fixture div');
    //            equal($('#child').length, 0);
    //        });
    //    });

    //    asyncTest("addPane renders pane relative to parent path", function () {
    //        expect(1);
    //        Helpers.addPane('subfolderPane', { path: '/Subfolder/somePane' }, function () {
    //            equal($('#testData').length, 1, 'subfolderPane was rendered');
    //        });        
    //    });
});