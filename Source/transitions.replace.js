(function () {
    ko.composite.transitions.replace = function () {
        var $originalElement;

        this.start = function (element) {
            $originalElement = $(element);
            return createTemporaryElement();
        };
        
        this.end = function(element) {
            var $element = $(element);
            $originalElement.html($element.children());
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