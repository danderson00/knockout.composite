(function () {
    var lastUpdatedValue;
    var callbacks = [];

    if ($(window).hashchange !== undefined) {
        $(function() {
            $(window).hashchange(function() {
                if(currentHash() !== lastUpdatedValue)
                    for (var i = 0; i < callbacks.length; i++)
                        callbacks[i]();
                lastUpdatedValue = null;
            });
        });
    }
    
    ko.composite.hashProvider = {
        addExternalChange: function(callback) {
            callbacks.push(callback);
        },
        removeExternalChange: function (callback) {
            callbacks.splice(callbacks.indexOf(callback), 1);
        },
        update: function (value) {
            throttle(function() {
                var hash = value && ko.composite.utils.objectHasProperties(value) ? JSON.stringify(value) : '';
                lastUpdatedValue = hash;
                window.location.hash = hash;
            });
        },
        query: function () {
            var hash = currentHash();
            return hash ? JSON.parse(hash) : { };
        }
    };
    
    function currentHash() {
        return window.location.hash.replace(/^#/, '');
    } 

    var updateTimer;
    function throttle(action) {
        if (updateTimer)
            clearTimeout(updateTimer);
        updateTimer = setTimeout(action, 20);
    }
})();
