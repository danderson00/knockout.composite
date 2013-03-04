ko.composite.options.basePath = '../6. Webmail/4. The Final Pieces/';
ko.composite.options.synchronous = true;
$.mockjaxSettings.responseTime = 0;
    
function createModel(path, pubsub, data, pane) {
    ko.composite.resources.loadModel(path);
    return new ko.composite.models[path].constructor(pubsub, data, pane);
}

function render(options, tests) {
    var pane = ko.composite.utils.addPane(document.body, options);
    pane.pubsub.subscribe('rendered', function () {
        tests();
        start();
    });
    return pane;
};

