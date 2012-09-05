function Todo(title, completed) {
    this.title = ko.observable(title);
    this.completed = ko.observable(completed);
    this.editing = ko.observable(false);
}

// map array of passed in todos to an observableArray of Todo objects and add aggregate functions
function createTodoList(todos) {
    var list = ko.observableArray(ko.utils.arrayMap(todos, function(todo) {
        return new Todo(todo.title, todo.completed);
    }));

    // count of all completed todos
    list.completedCount = ko.computed(function () {
        return ko.utils.arrayFilter(list(), function (todo) {
            return todo.completed();
        }).length;
    });

    // count of todos that are not complete
    list.remainingCount = ko.computed(function () {
        return list().length - list.completedCount();
    });

    // writeable computed observable to handle marking all complete/incomplete
    list.allCompleted = ko.computed({
        //always return true/false based on the done flag of all todos
        read: function () {
            return !list.remainingCount();
        },
        // set all todos to the written value (true/false)
        write: function (newValue) {
            ko.utils.arrayForEach(list(), function (todo) {
                // set even if value is the same, as subscribers are not notified in that case
                todo.completed(newValue);
            });
        }
    });
    
    list.removeCompleted = function () {
        list.remove(function (todo) {
            return todo.completed();
        });
    };

    return list;
}