if(!ko.composite.utils)
    ko.composite.utils = {};

(function () {
    var utils = ko.composite.utils;

    utils.inheritProperty = function(source, target, name) {
        if(!target.hasOwnProperty(name))
            utils.setPropertyFrom(source, target, name);
    };

    utils.setPropertyFrom = function(source, target, name) {
        if (source && source[name] !== null && source[name] !== undefined)
            target[name] = source[name];
    };
    
    utils.setProperty = function(target, name, defaultValue, setFrom, inheritFrom) {
        utils.setPropertyFrom(inheritFrom, target, name);
        utils.setPropertyFrom(setFrom, target, name);

        if (target[name] === null || target[name] === undefined)
            target[name] = $.isFunction(defaultValue) ? defaultValue() : defaultValue;
    };

    utils.mapToObservables = function(source, target) {
        if(!target)
            target = { };
        
        for(var property in source)
            if(source.hasOwnProperty(property))
                if(ko.isObservable(target[property]))
                    target[property](source[property]);
                else
                    target[property] = ko.observable(source[property]);

        return target;
    };

    utils.clearAllObservables = function(target) {
        for(var property in target)
            if(target.hasOwnProperty(property) && isPopulatedObservable(target[property]))
                if(target[property]().constructor === Array)
                    target[property]([]);
                else
                    target[property](null);        
    };
    
    function isPopulatedObservable(target) {
        return ko.isObservable(target) && !ko.isComputed(target) && target();
    }
})();