ko.composite.registerModel({ requires: { scripts: ['/bindingHandlers.js', 'Todo.js'] } }, function(pubsub, data, pane) {
    var self = this;

    self.todos = data.todos;
    self.showMode = data.showMode;

    self.setMode = function(mode) {
        return function() {
            self.showMode(mode);
        };
    };
});