(function () {
    var utils = ko.composite.utils;

    ko.bindingHandlers.pane = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return updateBinding(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext, false);
        },
        init: controlsDescendantBindings
    };

    ko.bindingHandlers.region = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return updateBinding(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext, true);
        },
        init: controlsDescendantBindings
    };

    function updateBinding(element, optionsAccessor, allBindingsAccessor, viewModel, bindingContext, isRegion) {
        var options = getBindingOptions();

        var pane = new ko.composite.Pane(utils.extractPane(viewModel, bindingContext), options, isRegion, element);
        setTimeout(pane.loadAndBind);
        return pane;

        function getBindingOptions() {
            var binding = ko.utils.unwrapObservable(optionsAccessor());
            var allBindings = allBindingsAccessor();

            var result = (typeof (binding) == 'string') ? { path: binding} : binding;

            if (!result.data)
                if (allBindings.data)
                    result.data = allBindings.data;
                //else result.data = viewModel;
            
            return result;
        }
    }

    function controlsDescendantBindings() {
        return { controlsDescendantBindings: true };
    }
})();
