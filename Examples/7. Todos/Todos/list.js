ko.composite.registerModel({ requires: { scripts: ['/bindingHandlers.js', 'Todo.js'] } }, function(pubsub, data, pane) {
    var self = this;

    self.todos = data.todos;
    self.showMode = data.showMode;

    self.filteredTodos = ko.computed(function () {
        switch (self.showMode()) {
            case 'active':
                return self.todos().filter(function (todo) {
                    return !todo.completed();
                });
            case 'completed':
                return self.todos().filter(function (todo) {
                    return todo.completed();
                });
            default:
                return self.todos();
        }
    });

    self.remove = function (todo) {
        self.todos.remove(todo);
    };

    self.editItem = function (item) {
        item.editing(true);
    };

    self.stopEditing = function (item) {
        item.editing(false);

        if (!item.title().trim())
            self.remove(item);
    };
});