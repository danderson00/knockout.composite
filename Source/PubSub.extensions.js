PubSub.prototype.subscribeOnceFor = function (messages, func) {
    var pubsub = this;
    
    var tokens = pubsub.subscribe(mapMessagesToHandler());

    // this could be extended to pass the message as well, though maybe that should be done from PubSub itself
    function handleMessage(data) {
        pubsub.unsubscribe(tokens);
        func(data);
    }

    function mapMessagesToHandler() {
        var subscribers = {};
        $.each(messages, function (index, message) {
            subscribers[message] = handleMessage;
        });
        return subscribers;
    }
};