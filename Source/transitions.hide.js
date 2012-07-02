(function () {
    ko.composite.transitions.hide = function () {
        this.start = function (element) {
            //$(element).css({ left: -10000, top: -10000 });
            $(element).hide();
            return element;
        };

        this.end = function (element) {
            //$(element).css({ left: '', top: '' });
            $(element).show();
            return element;
        };
    };
})();