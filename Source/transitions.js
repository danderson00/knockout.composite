ko.composite.transitions = {
    create: function(name) {
        return name && ko.composite.transitions[name] ? new ko.composite.transitions[name]() : null;
    }
};