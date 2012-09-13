$(function() {
    function render(options, tests) {
        var pane = ko.composite.utils.addPane(document.body, options);
        pane.pubsub.subscribe('rendered', function () {
            tests();
            start();
        });
        return pane;
    };

    module("webmail.integration");

    asyncTest("Folders pane renders the correct number of buttons", function() {
        render('folders', function() {
            equal($('.folders li').length, 4);
        });
    });

    asyncTest("Clicking a folder name sets the selected class", function () {
        render('folders', function () {
            ok($('.folders li:contains("Sent")')
                .click()
                .hasClass('selected'));
        });
    });

    asyncTest("Clicking a folder name sets the selectedFolder property", function () {
        var pane = render('folders', function () {
            $('.folders li:contains("Sent")').click();
            equal(pane.model.selectedFolder(), 'Sent');
        });
    });
});