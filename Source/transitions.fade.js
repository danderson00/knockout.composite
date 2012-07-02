(function () {
    ko.composite.transitions.fade = function () {
        var $originalElement;

        this.start = function (element) {
            $originalElement = $(element).fadeOut(100);
            return createTemporaryElement();
        };

        this.end = function (element) {
            var $element = $(element);
            $originalElement
                .stop(false, true)
                .empty()
                .append($element.children())
                .fadeIn(200);
            $element.remove();
            return $originalElement[0];
        };
    };

    function createTemporaryElement() {
        var newElement = $('<div></div>').css({ left: -10000, top: -10000, position: 'fixed' });
        newElement.appendTo('body');
        return newElement[0];
    }
})();