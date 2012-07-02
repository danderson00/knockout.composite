(function () {
    ko.composite.registerModel(function () {
        var self = this;
        this.test = ko.observable();
        this.testChildren = ko.observable();

        this.rendered = function () {
            self.test('test');
        };

        this.childrenRendered = function () {
            self.testChildren('test');
        };
    });
})();