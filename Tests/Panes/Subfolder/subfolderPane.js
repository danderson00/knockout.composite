$(function () {
    ko.composite.registerModel(function (pubsub, data, pane) {
        Helpers.testContext.models.subfolderPane = this;
        this.testData = 'test';
    });
});