if(!ko.composite.utils)
    ko.composite.utils = {};

(function () {
    var utils = ko.composite.utils;

    utils.proxy = function(objectToProxy, iterator) {
        if(ko.isObservable(objectToProxy) && objectToProxy().constructor === Array)
            return proxyObservableArray(objectToProxy);
        else if($.isArray(objectToProxy))
            return proxyArray(objectToProxy);
        else
            return proxyObject(objectToProxy);

        var synchronising = false;

        // this could possibly be made more efficient by determining which objects had been added or removed 
        // rather than reinitialising the proxy with the entire array contents
        function proxyObservableArray(source) {
            var target = ko.observableArray(proxyArray(source()));
            
            var originalPush = target.push;
            target.push = function(item) {
                return originalPush.call(target, proxyObject(item));
            };
            var originalUnshift = target.unshift;
            target.unshift = function(item) {
                return originalUnshift.call(target, proxyObject(item));
            };
            
            var targetSubscription = target.subscribe(function(contents) {
                if(!synchronising) {
                    synchronising = true;
                    source($.map(contents, function(item) { return item.__original; }));
                    synchronising = false;
                }
            });

            var sourceSubscription = source.subscribe(function(contents) {
                if(!synchronising) {
                    synchronising = true;
                    target(proxyArray(contents));
                    synchronising = false;
                }
            });

            target.dispose = function() {
                sourceSubscription.dispose();
                targetSubscription.dispose();
            };
            
            return target;
        }
        
        function proxyArray(source) {
            return $.map(source, proxyObject);
        }
        
        function proxyObject(source) {
            var target = { __original: source };
            for (var property in source)
                if (source.hasOwnProperty(property))
                    target[property] = proxyFor(property);
            
            if(iterator) iterator(target);
            return target;

            function proxyFor(propertyName) {
                var value = source[propertyName];
                if ($.isFunction(value))
                    return value;
                
                if($.isArray(value))
                    return ko.observableArray(proxyArray(value));
                
                if($.isPlainObject(value))
                    return proxyObject(value);

                return ko.computed({
                    read: function() { return source[propertyName]; },
                    write: function(newValue) { source[propertyName] = newValue; }
                });
            }
        }
    };
})();