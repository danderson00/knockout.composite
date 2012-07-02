$(function () {
    var resources = ko.composite.resources;

    module("resources");

    test("initial loadResource returns deferred", function () {
        var result = resources.loadResource('initial', function () { return $.Deferred(); }, '');
        ok(result.promise);
    });

    test("concurrent calls to loadResource return same deferred", function () {
        var firstResult = resources.loadResource('concurrentTest', function () { return $.Deferred(); }, 'concurrentTest');
        var secondResult = resources.loadResource('concurrentTest', function () { return $.Deferred(); }, 'concurrentTest');
        equal(firstResult, secondResult);
    });

    asyncTest("subsequent calls to successful loadResource return null", function () {
        var firstResult = resources.loadResource('subsequentTest', function () { return $.Deferred(function () { this.resolve(); }); });
        setTimeout(function () {
            var secondResult = resources.loadResource('subsequentTest', function () { return $.Deferred(function () { this.resolve(); }); });
            equal(secondResult, null);
            start();
        });
    });

    asyncTest("subsequent calls to failed loadResource returns rejected deferred", function () {
        var firstResult = resources.loadResource('/failed/load', function () { return $.Deferred(function () { this.reject(); }); });
        setTimeout(function () {
            var secondResult = resources.loadResource('/failed/load', function () { return $.Deferred(function () { this.reject(); }); });
            ok(secondResult.isRejected());
            start();
        });
    });


    module("resources.stylesheets");

    asyncTest("loadStylesheet loads and renders CSS", function () {
        $('#qunit-fixture').html('<div class="testClass"></div>');
        $.when(resources.loadPaneStylesheet('stylesheet'))
         .always(function () {
             var colour = $('.testClass').css('background-color');
             ok(colour === "rgb(0, 0, 255)" || colour === "blue");
             start();
         });
    });


    module("resources.templates", {
        teardown: function () {
            $('script[type="text/template"]').remove();
        }
    });

    asyncTest("loadTemplate loads html to target", function () {
        $.when(resources.loadPaneTemplate('loadResource', $('#qunit-fixture')[0]))
         .done(function () {
             equal($('#qunit-fixture').text(), 'test');
             start();
         });
    });

    test("storeTemplate stores templates to script tag if not already embedded", function () {
        resources.storeTemplate('/Templates/test.htm', '<div></div>');
        equal($('script[id="Templates-test"]').html(), '<div></div>');
    });

    test("storeTemplate stores templates directly to head tag if already embdedded", function () {
        resources.storeTemplate('/Templates/test.htm', '<script type="text/template" id="Templates.test"><div></div></script>');
        equal($('script[id="Templates.test"]').html(), '<div></div>');
    });

    test("storeTemplate stores multiple templates directly to head tag if already embdedded", function () {
        resources.storeTemplate('/Templates/test.htm', '<script type="text/template" id="Templates.test"><div></div></script><script type="text/template" id="Another.template"><div></div></script>');
        equal($('script[id="Templates.test"]').html(), '<div></div>');
    });

    test("templateIsLoaded returns true if corresponding script tag exists in head tag", function () {

    });

    test("retrieveTemplate returns HTML for stored template", function () {

    });

    module("resources.scripts");

    // this ensures we can rely on a function being executed immediately (synchronously) after the script in a dynamically
    // loaded file has been executed. means we can apply context to functions executed in the dynamic script such as
    // path information. Used to associate path information with models loaded dynamically.

    // unfortunately this doesn't prove shit. This can fail with multiple concurrent requests.
    asyncTest("script element load event executes callbacks synchronously when load complete", function () {
        var sync = ko.composite.options.synchronous;
        ko.composite.options.synchronous = false;
        var complete = false;
        $.when(ko.composite.resources.loadScript('Panes/scriptTagLoadTest.js'))
            .always(function () {
                equal(window.scriptTagLoadTest, 'loaded', 'script was executed and this function executed synchronously');
                setTimeout(function () {
                    ok(!window.scriptTagLoadTest, 'timeout reset value after load');
                    complete = true;
                    start();
                }, 50);
            });
        (function timeout() {
            if (!complete) {
                window.scriptTagLoadTest = undefined;
                setTimeout(function () {
                    timeout();
                });
            }
        })();
        ko.composite.options.synchronous = sync;
    });

    asyncTest("loadScript evaluates loaded script", function () {
        expect(1);
        $.when(resources.loadScript('Panes/loadResource.js'))
         .done(function () {
             ok(window.loadScriptTestObject);
         })
         .always(function () {
             start();
         });
    });

    asyncTest("loadScript rejects deferred if script does not exist", function () {
        expect(1);
        $.when(resources.loadScript('url/does/not/exist.js'))
         .fail(function () {
             ok(true);
         })
         .always(function () {
             start();
         });
    });

     test("executeScript executes all split scripts", function () {
         $.mockjax({ url: 'split', responseText: "var split1 = '1';\n//@ sourceURL=1.js\nvar split2 = '2';\n//@ sourceURL=2.js\n" });
         ko.composite.resources.loadScript('split');
         equal(split1, 1, "First script block executed");
         equal(split2, 2, "Second script block executed");
     });

     test("executeScript splits scripts and executes sequentially", function () {
         $.mockjax({ url: 'split', responseText: "var split1 = splitTestFunction === undefined;\n//@ sourceURL=1.js\nfunction splitTestFunction() { }\nvar split2 = splitTestFunction !== undefined;\n" });
         ko.composite.resources.loadScript('split');
         ok(split1, "Function not available in first script block");
         ok(split2, "Function available in second script block");
     });


    module("resources.models");

    test("registerModel accepts constructor as second argument", function () {
        ko.composite.registerModel(function () { return "test"; }, { option: 'test' });
        ko.composite.resources.assignModelPath('test');
        equal(ko.composite.models.test.constructor(), "test");
        equal(ko.composite.models.test.options.option, 'test');
    });

    test("registerModel accepts constructor as third argument", function () {
        ko.composite.registerModel({ option: 'test' }, function () { return "test"; });
        ko.composite.resources.assignModelPath('test');
        equal(ko.composite.models.test.constructor(), "test");
        equal(ko.composite.models.test.options.option, 'test');
    });
});