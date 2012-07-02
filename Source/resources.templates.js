(function (resources) {
    var options = ko.composite.options;
    var utils = ko.composite.utils;

    var loadedTemplates = {};

    resources.loadPaneTemplate = function (path, target) {
        return resources.loadTemplate(utils.resourcePath(options.templatePath, path, options.templateExtension), target);
    };

    resources.loadTemplate = function (url, target) {
        if (resources.templateIsLoaded(url)) {
            renderTemplate(resources.retrieveTemplate(url), target);
            return null;
        }

        return $.when(resources.loadResource(url, function () {
            return $.ajax({
                url: url,
                dataType: 'html',
                async: !options.synchronous,
                cache: false,
                success: function (template) {
                    resources.storeTemplate(url, template);
                }
            });
        })).done(function () {
            if (target)
                renderTemplate(resources.retrieveTemplate(url), target);
        });
    };

    resources.renderPaneTemplate = function (path, target) {
        var template = resources.retrieveTemplate(templatePath(path));
        renderTemplate(template, target);
    };

    function renderTemplate(template, target) {
        if (target) {
            // can't use html() - this uses the element innerHTML property and IE7 and 8 will strip comments (i.e. containerless control flow bindings)
            $(target).empty().append(template);
        }
    }

    resources.storeTemplate = function (path, template) {
        var $template = $(template);
        if ($template.not("script").length > 0 || $template.length === 0)
            $('<script type="text/template" id="' + utils.pathIdentifier(path) + '"></script>').text(template).appendTo('head');
        else
            $('head').append(template);
    };

    resources.templateIsLoaded = function (path) {
        return $('script[id="' + utils.pathIdentifier(path) + '"]').length > 0;
    };

    resources.retrieveTemplate = function (path) {
        return $('script[id="' + utils.pathIdentifier(path) + '"]').html();
    };

    function templatePath(panePath) {
        return utils.resourcePath(options.templatePath, panePath, options.templateExtension);
    }
})(ko.composite.resources);