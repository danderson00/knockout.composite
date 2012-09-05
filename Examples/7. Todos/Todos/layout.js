ko.composite.registerModel({ requires: { scripts: ['/bindingHandlers.js', 'Todo.js'] } }, function(pubsub, data, pane) {
    var self = this;

    var todos = ko.utils.parseJson(localStorage.getItem('todos-knockout.composite')) || [];

    self.todos = createTodoList(todos);
    self.showMode = ko.observable('all').extend({ history: { key: 'mode' } });
    
    // helper function to keep expressions out of markup
    self.getLabel = function (count) {
        return ko.utils.unwrapObservable(count) === 1 ? 'item' : 'items';
    };

    // internal computed observable that fires whenever anything changes in our todos
    ko.computed(function () {
        // store a clean copy to local storage, which also creates a dependency on the observableArray and all observables in each item
        localStorage.setItem('todos-knockout.composite', ko.toJSON(self.todos));
    }).extend({
        throttle: 500
    }); // save at most twice per second
});