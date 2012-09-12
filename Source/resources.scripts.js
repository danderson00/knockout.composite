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
            if (ko.composite.options.debug.splitScripts === true && shouldSplit(script)) {
                var scripts = script.match(/(.*(\r|\n))*?(.*\/{2}\@ sourceURL.*)/g);

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
            return script + '\n//@ sourceURL=' + url.replace(/ /g, "_");
        }

        function shouldSplit(script) {
            var tagMatches = script.match("(//@ sourceURL=)");
            return tagMatches && tagMatches.length > 1;
        }
    };

    resources.loadCrossDomainScript = function (url) {
        return resources.loadResource(url, function () {
            return resources.loadResource(url, function () {
                var deferred = $.Deferred();

                var head = document.getElementsByTagName('head')[0];
                var script = document.createElement('script');
                var failed = false;

                script.addEventListener("load", function () {
                    if (!failed)
                        deferred.resolve();
                }, false);

                script.addEventListener("error", function () {
                    failed = true;
                    deferred.reject();
                }, false);

                script.src = url;
                head.appendChild(script);

                return deferred;
            });
        });
    };
})(ko.composite.resources);