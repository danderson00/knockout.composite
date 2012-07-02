$(function () {
    module("navigation");

    asyncTest("navigating region sets new pane", function () {
        expect(2);
        Helpers.renderPane('navigateParent', null, function () {
            equal($('#navigateData').text(), '1', "initial pane rendered");
            Helpers.navigate(Helpers.testContext.models.navigateChild.pane, 'navigateChild', 2, function () {
                equal($('#navigateData').text(), '2', "navigate pane rerendered");
            });
        }, 100, false);
    });

    asyncTest("navigating region by passing options object sets new pane", function () {
        expect(2);
        Helpers.renderPane('navigateParent', null, function () {
            equal($('#navigateData').text(), '1', "initial pane rendered");
            Helpers.navigate(Helpers.testContext.models.navigateChild.pane, { path: 'navigateChild', data: 2 }, null, function () {
                equal($('#navigateData').text(), '2', "navigate pane rerendered");
            });
        }, 100, false);
    });

    asyncTest("navigating parent region with delegateNavigation navigates child region", function () {
        expect(2);
        Helpers.renderPane('navigateParent', null, function () {
            equal($('#navigateData').text(), '1', "initial pane rendered");
            Helpers.navigateParent(Helpers.testContext.models.navigateChild.pane, 'navigateChild', 2, function () {
                equal($('#navigateData').text(), '2', "navigate pane rerendered");
            });
        }, 100, false);
    });

    asyncTest("navigating parent region with delegateNavigation does not navigate child region with handlesNavigation false", function () {
        expect(2);
        Helpers.renderPane('navigateParent', null, function () {
            equal($('#staticText').text(), 'test', "initial pane rendered");
            Helpers.navigateParent(Helpers.testContext.models.navigateChild.pane, 'navigateChild', 2, function () {
                equal($('#staticText').text(), 'test', "navigate pane rerendered");
            });
        }, 100, false);
    });

    asyncTest("navigating region in subfolder passes path", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderPane', null, function () {
            Helpers.navigate(Helpers.testContext.models.subfolderChild.pane, 'subfolderNavigate', null, function () {
                equal(Helpers.testContext.models.subfolderChild.pane.path, '/Subfolder/subfolderNavigate', "incorrect name");
            });
        }, 100, false);
    });

    asyncTest("navigating region in subfolder renders", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderPane', null, function () {
            Helpers.navigateParent(Helpers.testContext.models.subfolderChild.pane, 'subfolderNavigate', null, function () {
                equal($('#navigated').length, 1, "navigate pane rerendered");
            });
        }, 100, false);
    });

    asyncTest("rendered message is published when all child panes have been rendered", function () {
        var messagePublished = false;
        expect(2);
        Helpers.renderPane('navigateParent', null, function () {
            Helpers.testContext.models.navigateChild.pane.pubsub.subscribePersistent("rendered", function () {
                messagePublished = true;
                equal($('#navigateData').text(), '2', "navigate pane rerendered");
            });

            Helpers.navigate(Helpers.testContext.models.navigateChild.pane, 'navigateChild', 2, function () {
                ok(messagePublished);
            });
        }, 100, false);
    });
});