$(function() {
    function createFrame(url, tests) {
        $('iframe').remove();
        var targetFrame = $('<iframe></iframe>').appendTo('body');
        targetFrame.attr({ 'src': url, width: screen.width, height: screen.height });

        var contentWindow = targetFrame[0].contentWindow;

        targetFrame[0].onload = function () {
            targetFrame[0].onload = undefined;
            contentWindow.document.addEventListener("rendered", handleRendered);

            function handleRendered() {
                contentWindow.document.removeEventListener("rendered", handleRendered);
                window.$$ = contentWindow.jQuery;

                tests();
                start();
            }
        };
    }

    module("webmail.functional");

    asyncTest("", function () {
        createFrame('../6. Webmail/4. The Final Pieces/index.html', function () {
            equal($('.mails tbody tr').length, 12);
        });
    });
});