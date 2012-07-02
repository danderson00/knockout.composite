(function (resources) {
    resources.loadScript = function (url) {
        return resources.loadResource(url, function () {
            return $.ajax({
                url: url,
                dataType: 'text',
                async: !ko.composite.options.synchronous,
                cache: false,
                success: executeScript
            });
        });

        function executeScript(script) {
            if (ko.composite.options.debug.splitScripts === true) {
                var scripts = script.match(/(.*(\r|\n))*?(.*\/{2}\@ sourceURL.*)/g);
                //var scripts = script.match(/(.|\r|\n)*?(\/{2}\@ sourceURL.*)/g);

                if (scripts === null)
                    $.globalEval(appendSourceUrl(script));
                else {
                    for (var i = 0; i < scripts.length; i++)
                        $.globalEval(scripts[i]);
                }

            } else {
                $.globalEval(appendSourceUrl(script));
                ko.composite.logger.debug('Loaded script block from ' + url);
            }
        }

        function appendSourceUrl(script) {
            return script + '\n//@ sourceURL=' + url;
        }
    };
})(ko.composite.resources);