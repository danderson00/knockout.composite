ko.composite.Monitor = function (callback) {
    var count = 0;
    var callbacks = [];
    if (callback) callbacks.push(callback);

    this.registerCallback = function (callback) {
        callbacks.push(callback);
    };

    this.enter = function () {
        count++;
    };

    this.exit = function () {
        count--;
        if (count === 0)
            for (var i = callbacks.length - 1; i >= 0; i--) {
                setTimeout(callbacks[i]);
                callbacks.splice(i, 1);
            }
    };
};