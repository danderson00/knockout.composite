function PubSub(options) {
    var self = this;
    this.forceSync = getOptions().forceSync;

    var messages = {};
    this.messages = messages;
    var lastUid = -1;

    function publish(envelope) {
        var subscribers = getSubscribers(envelope.message);
        var subscribersCopy = subscribers.concat(getSubscribers('*'));
        addGlobalSubscribers(envelope.message, subscribersCopy);        

        if (subscribersCopy.length == 0)
            return false;

        for (var i = 0; i < subscribersCopy.length; i++) {            
            removeSubscriberIfOnceOnly(subscribersCopy[i]);
            if (envelope.sync === true || self.forceSync === true)
                executeSubscriber(subscribersCopy[i].func);
            else {
                (function (subscriber) {
                    setTimeout(function () {
                        executeSubscriber(subscriber.func);
                    });
                })(subscribersCopy[i]);
            }
        }

        return true;

        function executeSubscriber(func) {
            if (ko.composite.options.debug.handleExceptions)
                try {
                    func(envelope.data, envelope);
                } catch (e) {
                    if (envelope.sync || self.forceSync)
                    // if we are running synchronously, rethrow the exception after a timeout, 
                    // or it will prevent the rest of the subscribers from receiving the message
                        setTimeout(handleException(e, envelope.message), 0);
                    else
                        handleException(e, envelope.message)();
                }
            else
                func(envelope.data, envelope);
        }

        function handleException(e, message) {
            return function () {
                ko.composite.logger.error("Error occurred in subscriber to '" + message + "'", e);
            };
        };

        function removeSubscriberIfOnceOnly(subscriber) {
            if (subscriber.onceOnly)
                subscribers.splice(subscribers.indexOf(subscriber), 1);
        }
    };

    this.publish = function (messageOrEnvelope, data) {
        var envelope = messageOrEnvelope && messageOrEnvelope.message ?
            messageOrEnvelope : { message: messageOrEnvelope, data: data, sync: false };
        return publish(envelope);
    };

    this.publishSync = function (message, data) {
        return publish({ message: message, data: data, sync: true });
    };

    this.subscribeOnce = function (message, func) {
        return this.subscribe(message, func, { onceOnly: true });
    };

    this.subscribePersistent = function (message, func) {
        return this.subscribe(message, func, { persistent: true });
    };

    this.subscribe = function (message, func, subscriptionOptions) {
        if (typeof (message) === "string")
            return registerSubscription(message, func, subscriptionOptions);
        else {
            var tokens = [];
            for (var messageName in message)
                if (message.hasOwnProperty(messageName))
                    tokens.push(registerSubscription(messageName, message[messageName]));
            return tokens;
        }
    };
    
    function registerSubscription(message, func, subscriptionOptions) {
        if (!messages.hasOwnProperty(message))
            messages[message] = [];

        subscriptionOptions = subscriptionOptions ? subscriptionOptions : {};

        var token = (++lastUid).toString();
        messages[message].push({ token: token, func: func, onceOnly: subscriptionOptions.onceOnly, persistent: subscriptionOptions.persistent });

        return token;
    }

    this.unsubscribe = function (tokens) {
        if ($.isArray(tokens))
            return $.map(tokens, function (token) {
                return unsubscribe(token);
            });
        return unsubscribe(tokens);
    };
    
    function unsubscribe(token) {
        for (var m in messages) {
            if (messages.hasOwnProperty(m)) {
                for (var i = 0, j = messages[m].length; i < j; i++) {
                    if (messages[m][i].token === token) {
                        messages[m].splice(i, 1);
                        return token;
                    }
                }
            }
        }
        return false;
    }

    this.unsubscribeAllExceptInternal = function () {
        for (var message in messages) {
            if (messages.hasOwnProperty(message) && !messageIsInternal(message)) {
                delete messages[message];
            }
        }
    };

    this.unsubscribeTransient = function () {
        for (var message in messages) {
            if (messages.hasOwnProperty(message) && !messageIsInternal(message)) {
                var subscribers = messages[message];
                for (var i = subscribers.length - 1; i >= 0; i--)
                    if (!subscribers[i].persistent)
                        subscribers.splice(i, 1);

                if (subscribers.length == 0)
                    delete messages[message];
            }
        }
    };
    
    function messageIsInternal(message) {
        return typeof(message) == 'string' && message.substr(0, 2) == '__';
    }

    function getOptions() {
        return options ? options : { };
    }

    function getSubscribers(message) {
        var subscribers;
        
        if (messages.hasOwnProperty(message)) {
            subscribers = messages[message];
        } else {
            subscribers = [];
        }

        return subscribers;
    }
    
    function addGlobalSubscribers(message, subscribers) {
        var globalSubscribers = getOptions().globalSubscribers;

        if (globalSubscribers && globalSubscribers.hasOwnProperty(message))
            subscribers.push({ func: globalSubscribers[message] });
    }
};