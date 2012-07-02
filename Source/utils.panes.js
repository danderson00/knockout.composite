if (!ko.composite.utils)
    ko.composite.utils = {};

(function (utils) {
    utils.inheritParentPath = function(pane, parentPane) {
        if(typeof (pane) === 'string')
            return parentPane ? ko.composite.utils.combinePaths(pane, parentPane.path) : pane;
        else {
            pane.path = parentPane ? ko.composite.utils.combinePaths(pane, parentPane.path) : pane.path;
            return pane;
        }
    };
    
    utils.bindPane = function(element, options, parentPane) {
        return ko.bindingHandlers.pane.update(element, function () { return utils.inheritParentPath(options); }, function () { return {}; }, { __pane: parentPane });                
    };

    utils.addPane = function(parentElement, options, parentPane) {
        var container = $('<div></div').appendTo(parentElement)[0];
        return utils.bindPane(container, options, parentPane);
    };

    utils.addPaneAfter = function(element, options, parentPane) {
        var container = $('<div></div').insertAfter(element)[0];
        return utils.bindPane(container, options, parentPane);
    };

    utils.extractPane = function(viewModel, bindingContext) {
        if (viewModel && viewModel.__pane)
            return viewModel.__pane;
        if (bindingContext && bindingContext.$root && bindingContext.$root.__pane)
            return bindingContext.$root.__pane;
        return null;
    };
    
    utils.getUniqueId = (function() {
        var id = 0;
        return function() {
            if (arguments[0] == 0) {
                id = 1;
                return 0;
            } else
                return id++;
        };
    })();
})(ko.composite.utils);