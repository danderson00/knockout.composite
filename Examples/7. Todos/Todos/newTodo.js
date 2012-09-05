ko.composite.registerModel({ requires: { scripts: ['/bindingHandlers.js'] } }, function(pubsub, data, pane) {
    var self = this;

    self.todos = data.todos;
    self.current = ko.observable();

    self.add = function () {
        var current = self.current().trim();
        if (current) {
            self.todos.push(new Todo(current));
            self.current('');
        }
    };
});