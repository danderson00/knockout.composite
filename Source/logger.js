function Logger() {
    var self = this;
    var logLevel = 0;

    this.debug = function (message) {
        if(logLevel <= 0)
            this.log('debug', message);
    };

    this.info = function (message) {
        if (logLevel <= 1)
            this.log('info', message);
    };

    this.warn = function (message) {
        if (logLevel <= 2)
            this.log('warn', message);
    };

    this.error = function (message, error) {
        if (logLevel <= 3) {
            var logString;
            if (error && error.stack)
                logString = message + ' ' + error.stack;
            else if (error && error.message)
                logString = message + ' ' + error.message;
            else
                logString = message + ' ' + (error ? error : '');


            this.log('error', logString);
            if (this.errorCallback)
                $.when(this.errorCallback(logString))
                    .fail(function() {
                        self.log('error', 'Unable to successfully log error!');
                    });
        }
    };

    this.ajax = function (url, jqXHR, textStatus, errorThrown) {
        if (jqXHR.status === 404)
            this.info('Resource not found: ' + url);
        else
            this.error('Error loading resource: ' + url, errorThrown);
    };

    this.log = function (level, message) {
        if(window.console && window.console.log)
            window.console.log(level.toUpperCase() + ': ' + message);
    };

    this.errorCallback = null;

    this.setLogLevel = function (level) {
        switch (level) {
            case 'debug': return (logLevel = 0);
            case 'info': return (logLevel = 1);
            case 'warn': return (logLevel = 2);
            case 'error': return (logLevel = 3);
            case 'none': return (logLevel = 4);
            default: return (logLevel = 0);
        }
    };
}