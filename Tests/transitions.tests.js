$(function () {
    module("transitions");

    asyncTest("navigating with fade transition renders successfully", function () {
        expect(1);
        Helpers.renderPane('navigateParent', null, function () {
            Helpers.navigate(Helpers.testContext.models.navigateChild.pane, { path: 'navigateChild', data: 2, transition: 'fade' }, null, function () {
                equal($('#qunit-fixture #navigateData').text(), '2', "rendered successfully");
            });
        }, 100, false);
    });
});