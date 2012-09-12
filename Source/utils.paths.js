if(!ko.composite.utils)
    ko.composite.utils = {};

(function (utils) {
    var options = ko.composite.options;
    
    utils.combinePaths = function (basePath, pathToCombine) {
        basePath = basePath ? basePath : '';
        pathToCombine = pathToCombine ? pathToCombine : '';
        var newPath;
        if (utils.isAbsolute(pathToCombine) || !basePath)
            newPath = pathToCombine;
        else {
            basePath = stripFileName(basePath);
            newPath = basePath + pathToCombine;
        }
        return evaluatePathNavigation(newPath);
    };

    function evaluatePathNavigation(path) {
        if (path.substring(0, 3) == '../')
            return '../' + evaluatePathNavigation(path.substring(3, path.length));

        if (path.substring(0, 4) == '/../')
            return '/../' + evaluatePathNavigation(path.substring(4, path.length));

        var location = path.indexOf('/../');

        if (location == -1)
            return path;

        var startOfPrecedingFolder = path.substring(0, location).lastIndexOf('/');

        return evaluatePathNavigation(path.substring(0, startOfPrecedingFolder + 1) + path.substring(location + 4, path.length));
    }

    utils.isAbsolute = function(path) {
        return path.charAt(0) == '/';
    };

    utils.isFullUrl = function(path) {
        return path.indexOf('://') > 0;
    };

    utils.stripPathAndExtension = function(path) {
        var start = path.lastIndexOf('/') + 1;
        var end = path.lastIndexOf('.');
        if (end == -1) end = path.length;
        return path.substring(start, end);
    };   

    utils.resourcePath = function(basePath, path, extension) {
        var fullPath = options.basePath + '/' + basePath + '/' + path;
        
        if(extension && !(fullPath.substr(fullPath.length - extension.length - 1) == '.' + extension))
            fullPath += '.' + extension;
        
        return utils.stripLeadingSlash(removeDoubleSlashes(fullPath));
    };

    utils.pathIdentifier = function(path) {
        return stripExtension(utils.stripLeadingSlash(path)).replace( /\//g , '-').replace(/\./g, '');
    };
    
    utils.resourcePathIdentifier = function(path) {
        return ko.composite.utils.pathIdentifier(utils.resourcePath("", path, ""));
    };
    
    function stripFileName(path) {
        return path.substr(0, path.lastIndexOf('/') + 1);
    }
    
    function stripExtension(path) {
        var end = path.lastIndexOf('.');
        if (end == -1) end = path.length;
        return path.substring(0, end);
    }
    
    function removeDoubleSlashes(path) {
        while(path.indexOf('//') > -1)
            path = path.replace(/\/\//g , "/");
        return path;
    }

    utils.stripLeadingSlash = function(path) {
        return path.charAt(0) == '/' ? path.substring(1, path.length) : path;
    };

    utils.ensureLeadingSlash = function(path) {
        if (path.charAt(0) != '/')
            return '/' + path;
        return path;
    };
})(ko.composite.utils);