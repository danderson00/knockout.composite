(function (resources) {
    var options = ko.composite.options;

    resources.loadPaneStylesheet = function (path) {
        if(!(options.noPaneStylesheets === true))
            return resources.loadStylesheet(ko.composite.utils.resourcePath(options.stylesheetPath, path, options.stylesheetExtension));
    };

    resources.loadStylesheet = function (url) {
        return resources.loadResource(url, function () {
            return $.ajax({ 
                url: url,
                dataType: 'text',
                async: !ko.composite.options.synchronous,
                cache: false,
                success: renderStylesheet                 
            }); 
        });
    };
    
    function renderStylesheet(stylesheet) {
        $("<style>" + stylesheet + "</style>").appendTo("head");
    }
})(ko.composite.resources);