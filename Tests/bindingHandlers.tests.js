// for some reason, qUnit.equals doesn't work when comparing our pane objects, results in a stack overflow. Using qUnit.ok instead.

// in serious need of refactoring
// - -> ModelBinder
// - -> Pane?
$(function () {
    module("bindingHandlers", {
        teardown: function () {
            ko.composite.resources.reload();
        }
    });

    asyncTest("data is passed to view model constructor", function () {
        expect(1);
        var data = {};
        Helpers.renderPane('pane', data, function () {
            equal(Helpers.testContext.models.pane.data, data);
        });
    });

    asyncTest("pane is passed to model constructor", function () {
        expect(1);
        Helpers.renderPane('pane', null, function () {
            ok(Helpers.testContext.models.pane.pane, 'pane is set');
        });
    });

    asyncTest("pane is passed to region constructor", function () {
        expect(1);
        Helpers.renderPane('region', null, function () {
            ok(Helpers.testContext.models.region.pane, 'pane is set');
        });
    });

    asyncTest("pubsub is set on pane", function () {
        expect(1);
        Helpers.renderPane('pane', null, function () {
            ok(Helpers.testContext.models.pane.pubsub, 'pubsub is set');
        });
    });

    asyncTest("child pane is rendered by region", function () {
        expect(2);
        Helpers.renderPane('region', null, function () {
            equal($('#paneValue').length, 1, 'child element rendered');
            equal($('#paneValue').text(), 'test', 'child element contained expected text');
        });
    });

    asyncTest("pane.pubsub is the same as region.pubsub", function () {
        expect(1);
        Helpers.renderPane('region', null, function () {
            ok(Helpers.testContext.models.region.pubsub === Helpers.testContext.models.pane.pubsub);
        });
    });

    asyncTest("pane and region pubsub objects are not the same as parent region pubsub object", function () {
        expect(2);
        Helpers.renderPane('container', null, function () {
            ok(!(Helpers.testContext.models.container.pubsub === Helpers.testContext.models.region.pubsub), 'Child region pubsub is not the same as container region pubsub');
            ok(!(Helpers.testContext.models.container.pubsub === Helpers.testContext.models.pane.pubsub), 'Child pane pubsub is not the same as container region pubsub');
        });
    });

    asyncTest("rootPane of child region is the parent region pane", function () {
        expect(1);
        Helpers.renderPane('container', null, function () {
            ok(Helpers.testContext.models.container.pane === Helpers.testContext.models.region.pane.rootPane);
        });
    });

    asyncTest("initialise function on model is called", function () {
        expect(1);
        Helpers.renderPane('pane', null, function () {
            equal(Helpers.testContext.models.pane.secondInitialisedValue(), 'test');
        });
    });

    asyncTest("pane specified in options is rendered", function () {
        expect(1);
        Helpers.renderPane('optionsParent', null, function () {
            equal($('#child').length, 1);
        });
    });

    asyncTest("data option in markup is passed to child panes", function () {
        expect(1);
        Helpers.renderPane('optionsParent', null, function () {
            equal(Helpers.testContext.models.optionsChild.passedData(), 1);
        });
    });

    asyncTest("pane without model is rendered", function () {
        expect(1);
        Helpers.renderPane('noModel', null, function () {
            equal($('#element').length, 1);
        });
    });

    asyncTest("pane without model renders child panes", function () {
        expect(1);
        Helpers.renderPane('noModel', null, function () {
            equal($('#paneValue').text(), 'test');
        });
    });

    asyncTest("inline pane renders and binds all child elements", function () {
        expect(1);
        Helpers.renderPane('inline', null, function () {
            equal($('.inlineChildSpan').length, 2);
        });
    });

    asyncTest("inline pane with no model passes data specifies in options", function () {
        expect(2);
        Helpers.renderPane('inline', null, function () {
            equal($('.inlineChildSpan:eq(0)').text(), '1');
            equal($('.inlineChildSpan:eq(1)').text(), '2');
        });
    });

    asyncTest("pane in subfolder renders", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderPane', null, function () {
            equal($('#testData').text(), 'test');
        });
    });

    asyncTest("pane in subfolder loads model", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderPane', null, function () {
            ok(Helpers.testContext.models.subfolderPane);
        });
    });

    asyncTest("child pane in subfolder renders", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderPane', null, function () {
            equal($('#childTestData').text(), 'child');
        });
    });

    asyncTest("child pane in subfolder loads model", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderPane', null, function () {
            ok(Helpers.testContext.models.subfolderChild);
        });
    });

    asyncTest("child pane in subfolder with no model renders", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderPane', null, function () {
            equal($('#noModelTestData').text(), 'no model');
        });
    });

    asyncTest("pane renders stylesheet", function () {
        expect(1);
        Helpers.renderPane('stylesheet', null, function () {
            var colour = $('.testClass').css('background-color');
            ok(colour === "rgb(0, 0, 255)" || colour === "blue");
        });
    });

    asyncTest("pane loads script dependencies", function () {
        expect(1);
        Helpers.renderPane('dependencyPane', null, function () {
            equal(dependencyTest, 'test');
        });
    });

    asyncTest("pane loads stylesheet dependencies", function () {
        expect(1);
        Helpers.renderPane('dependencyPane', null, function () {
            equal($('.testClass').css('font-family'), 'Courier');
        });
    });

    asyncTest("pane loads script dependencies in subfolder", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderDependencyPane', null, function () {
            equal(subfolderDependencyTest, 'test');
        });
    });

    asyncTest("pane loads stylesheet dependencies in subfolder", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderDependencyPane', null, function () {
            equal($('.subfolderTestClass').css('font-family'), 'Courier');
        });
    });

    asyncTest("pane loads script dependencies from absolute path", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderDependencyPane', null, function () {
            equal(subfolderAbsoluteDependencyTest, 'test');
        });
    });

    asyncTest("pane loads template dependencies", function () {
        expect(1);
        Helpers.renderPane('template', null, function () {
            ok($('script#Panes-basicTemplate').length > 0, 'template is loaded and rendered to script tag');
            $('#Panes-basicTemplate').remove();
            ko.composite.models = {};
        });
    });

    asyncTest("pane loads template dependencies and renders template", function () {
        expect(1);
        Helpers.renderPane('template', null, function () {
            equal($('#testText').html(), 'test', 'template is loaded and rendered');
            $('#Panes-basicTemplate').remove();
            ko.composite.models = {};
        });
    });

    asyncTest("pane in subfolder loads panes in nested subfolder", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderPane', null, function () {
            equal($('#nested').text(), 'test', "template is rendered and bindings applied");
        });
    });

    asyncTest("pane in nested subfolder loads panes in nested subfolder", function () {
        expect(1);
        Helpers.renderPane('Subfolder/subfolderPane', null, function () {
            equal($('#nestedChild').text(), 'nestedChild', "child pane template is rendered");
        });
    });

    asyncTest('panes with duplicate names are rendered correctly', function () {
        expect(2);
        Helpers.renderPane('Subfolder/duplicateName', null, function () {
            equal($('#duplicateName').text(), 'duplicateName', "first pane with duplicate name is loaded and rendered");
            equal($('#nestedDuplicateName').text(), 'nestedDuplicateName', "second pane with duplicate name is loaded and rendered");
        });
    });

    asyncTest('binding handler passes correct element to pane', function () {
        expect(1);
        Helpers.renderPane('region', null, function () {
            equal(Helpers.testContext.models.pane.pane.element, $('#region')[0]);
        });
    });

    asyncTest('data shortcut binding passes data to model', function () {
        expect(1);
        Helpers.renderPane('shortcutBindings', null, function () {
            equal(Helpers.testContext.models.pane.data, 'test');
        });
    });

    asyncTest('model.rendered is called after pane finishes rendering', function () {
        expect(1);
        Helpers.renderPane('rendered', null, function () {
            equal($('#qunit-fixture span:eq(0)').text(), 'test');
        });
    });

    asyncTest('model.rendered is called once and only once per pane', function () {
        expect(3);
        Helpers.renderPane('container', null, function () {
            ok(Helpers.testContext.models.container.modelRendered, "rendered called on parent container");
            ok(Helpers.testContext.models.region.modelRendered, "rendered called on child region");
            ok(Helpers.testContext.models.pane.modelRendered, "rendered called on child pane");
        });
    });

    asyncTest('model.childrenRendered is called after all child panes finish rendering', function () {
        expect(2);
        Helpers.renderPane('rendered', null, function () {
            equal($('#qunit-fixture span:eq(1)').text(), 'test');
            equal($('#qunit-fixture #paneValue').text(), 'test');
        });
    });

    asyncTest("rendered event is published once and only once on each region's pubsub", function () {
        expect(2);
        Helpers.renderPane('container', null, function () {
            setTimeout(function () {
                ok(Helpers.testContext.models.container.renderedMessage, "rendered called on parent container");
                ok(Helpers.testContext.models.region.renderedMessage, "rendered called on child region");
                start();
            });
        }, 0, false);
    });

    asyncTest("calling addPane without parent publishes rendered event once and only once on each region's pubsub", function () {
        expect(2);
        Helpers.addPane(null, 'container', null, function () {
            setTimeout(function () {
                ok(Helpers.testContext.models.container.renderedMessage, "rendered called on parent container");
                ok(Helpers.testContext.models.region.renderedMessage, "rendered called on child region");
                start();
            });
        }, false);
    });

    asyncTest("calling addPane with parent pane publishes rendered event once and only once on each region's pubsub", function () {
        expect(2);
        var parent = Helpers.renderPane('pane', null, function () {
            Helpers.addPane(parent, 'container', null, function () {
                setTimeout(function () {
                    ok(Helpers.testContext.models.container.renderedMessage, "rendered called on parent container");
                    ok(Helpers.testContext.models.region.renderedMessage, "rendered called on child region");
                    start();
                });
            }, false);
        }, 0, false);
    });

    asyncTest("inline content is restored when pane does not render any content", function () {
        expect(1);
        Helpers.renderPane('restoreInlineContainer', null, function () {
            equal($('.inlineChildSpan').length, 2);
        });
    });

    asyncTest("inline content is passed to pane", function () {
        expect(2);
        Helpers.renderPane('inlinePassingParent', null, function () {
            equal($('.inlineContainer').length, 1);
            equal($('.inlineContent').length, 1);
        });
    });

    asyncTest("model.rendered is not called when delayRender is true", function () {
        expect(1);
        Helpers.render({ path: 'pane', delayRender: true }, function () {
            ok(!Helpers.testContext.models.pane.modelRendered, "rendered not called on model");
        });
    });

    asyncTest("pane does not render template immediately when delayRender is true", function () {
        expect(1);
        Helpers.render({ path: 'pane', delayRender: true }, function () {
            equal($('#qunit-fixture #paneValue').length, 0, 'template not rendered');
        });
    });

    // this is here because it is really linked to above test
    asyncTest("Pane.render renders and binds template synchronously", function () {
        expect(2);
        var pane = Helpers.render({ path: 'pane', delayRender: true }, function () {
            equal($('#qunit-fixture #paneValue').length, 0, 'template not rendered');
            pane.render();
            equal($('#qunit-fixture #paneValue').length, 1, 'template rendered after calling render()');
        });
    });

    asyncTest("ModelBinder delays rendering when delayRender is true in model registration options", function () {
        expect(1);
        Helpers.render({ path: 'delayRender' }, function () {
            equal($('#qunit-fixture #paneValue').length, 0, 'template not rendered');
        });
    });

    asyncTest("Returning false from initialise cancels render", function () {
        expect(1);
        Helpers.render({ path: 'cancel' }, function () {
            equal($('#qunit-fixture span').length, 0);
        });
    });

    asyncTest("Calling cancelRender from initialise cancels render", function () {
        expect(1);
        Helpers.render({ path: 'cancelRender' }, function () {
            equal($('#qunit-fixture span').length, 0);
        });
    });

    asyncTest("Dispose is called once on each model when pane element is removed", function () {
        expect(2);
        var $element = $('<div></div>').appendTo('#qunit-fixture');
        Helpers.render({ path: 'region' }, function () {
            $element.remove();
            ok(Helpers.testContext.models.region.disposed, "Region disposed");
            ok(Helpers.testContext.models.pane.disposed, "Pane disposed");
        }, $element[0]);
    });
});
