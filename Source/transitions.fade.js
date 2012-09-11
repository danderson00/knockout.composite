(function () {
    ko.composite.transitions.fade = function () {
        var $originalElement;

        this.start = function (element) {
            $originalElement = $(element);
            if ($originalElement.children().length > 0)
                $originalElement.fadeOut(100);
            else
                $originalElement.hide();
            return createTemporaryElement();
        };

        this.end = function (element) {
            var $element = $(element);
            if ($originalElement) {
                $originalElement
                    .stop(false, true)
                    .empty()
                    .append($element.children());
                $element.remove();
            }

            var target = $originalElement || $element;
            return target.fadeIn(200)[0];
        };
    };

    function createTemporaryElement() {
        var newElement = $('<div></div>').css({ left: -10000, top: -10000, position: 'fixed' });
        newElement.appendTo('body');
        return newElement[0];
    }
})();