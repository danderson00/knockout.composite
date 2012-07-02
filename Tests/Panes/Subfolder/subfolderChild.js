$(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        Helpers.testContext.models.subfolderChild = this;
        this.childTestData = 'child';
        this.pane = pane;
    });
});