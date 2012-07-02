(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        var self = this;

        // an initialise function on a model will be called after the
        // model is constructed. You can return a deferred object 
        // (such as one returned from the $.ajax method)
        // and rendering will wait until the deferred has completed
        this.initialise = function () {
            var deferred = $.Deferred();
            setTimeout(deferred.resolve, 1000);
            return deferred;
        };

        // the rendered function is called when this pane has completed rendering
        // the childrenRendered function is called when this pane and all child panes have been rendered
        // the childRendered function will likely be renamed to rendered in a future version

        // use these to manipulate the DOM programmatically
        // manipulate the DOM from your models sparingly! testing DOM changes requires significantly more effort than a simple property
        // where possible, expose a property and use binding handlers to perform any necessary DOM manipulation
        this.childrenRendered = function () {
            centerElement('.end');
        };

        function centerElement(element) {
            var $element = $(element);
            $element.css({
                left: ($(window).width() - $element.outerWidth()) / 2,
                top: ($(window).height() - $element.outerHeight()) / 2
            });
        }

        this.value = data.value;
    });
})();