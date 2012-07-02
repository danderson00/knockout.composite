ko.composite.resources = {};
(function (resources) {
    var logger = ko.composite.logger;
    
    var loadedUrls = {};
    var failedUrls = { };
    var loadingUrls = {};

    resources.loadResource = function(url, loadDeferredAccessor) {
        if(failedUrls[url])
            return $.Deferred().reject();

        if(loadedUrls[url])
            return null;
        
        if(loadingUrls[url])
            return loadingUrls[url];

        var deferred = loadDeferredAccessor();
        logResourceLoad(deferred);
        
        loadingUrls[url] = deferred;
        $.when(deferred)
            .done(function () {
                loadedUrls[url] = true;
            })
            .fail(function () {
                failedUrls[url] = true;                
            })
            .always(function () {
                loadingUrls[url] = undefined;
            });

        return deferred;
        
        function logResourceLoad() {
            $.when(deferred).done(function() {
                logger.info("Loaded resource: " + url);
            })
            .fail(function() {
                logger.info("Failed loading resource: " + url);
            });
        }
    };
    
    resources.reload = function () {
        loadedUrls = { };
        failedUrls = { };
    };
})(ko.composite.resources);