$(function () {
    module("utils.paths");

    var utils = ko.composite.utils;

    test("combinePaths", function () {
        equal(utils.combinePaths('path', '/absolute/file'), '/absolute/file', "absolute path with relative base path remains unchanged");
        equal(utils.combinePaths('path', 'relative/file'), 'relative/file', "relative path with relative base path remains unchanged");
        equal(utils.combinePaths('/base/path', '/absolute/file'), '/absolute/file', "absolute path remains unchanged");
        equal(utils.combinePaths('/base/path', 'file'), '/base/file', "relative path includes base path folder");
        equal(utils.combinePaths('/base/path', 'relative/file'), '/base/relative/file', "relative path with folder includes base path folder");
        equal(utils.combinePaths('/base/path', '../file'), '/file', "parent folder navigates one level");
        equal(utils.combinePaths('/base/long/path', '../../file'), '/file', "two parent folders navigates two levels");
        equal(utils.combinePaths('/base/path', '../../file'), '/../file', "two parent folders against base path with only one level retains single navigation");
        equal(utils.combinePaths('/stupid/../base/long/path', '../file'), '/base/file', "navigation in base path is processed");
        equal(utils.combinePaths('/base/path', 'file'), '/base/file', "file in base path is replaced by target file");
        equal(utils.combinePaths('/base/', 'file'), '/base/file', "no file in base path appends target file");
        equal(utils.combinePaths('/base/', 'relative/file'), '/base/relative/file', "no file in base path appends full target path");
        equal(utils.combinePaths('base/path', 'relative/path'), 'base/relative/path', "relative base path remains relative");
        equal(utils.combinePaths('base/path', '../../file'), '../file', "two parent folders against relative base path with only one level retains single relative navigation");
        equal(utils.combinePaths(null, 'path/file'), 'path/file', "null basePath is ignored");
        equal(utils.combinePaths('path/file', null), 'path/', "null target path is ignored");
        equal(utils.combinePaths(null, null), '', "null target path is ignored");
    });

    test("stripPathAndExtension", function () {
        equal(utils.stripPathAndExtension("test.htm"), "test", "Extension only");
        equal(utils.stripPathAndExtension("/folder/test"), "test", "Path only");
        equal(utils.stripPathAndExtension("/folder/test.htm"), "test", "Full path and extension");
        equal(utils.stripPathAndExtension("folder/test.htm"), "test", "Relative path and extension");
        equal(utils.stripPathAndExtension("folder/test.template.htm"), "test.template", "Multiple periods");
    });

    test("resourcePath", function () {
        var currentBasePath = ko.composite.options.basePath;

        equal(utils.resourcePath('Panes', 'test'), "Panes/test", "paths are combined");
        equal(utils.resourcePath('/Panes/', 'test'), "Panes/test", "leading slash is removed");
        equal(utils.resourcePath('Panes/', 'test', 'htm'), "Panes/test.htm", "extension is added");
        equal(utils.resourcePath('//test/', '/test'), "test/test", "double slashes are removed");

        ko.composite.options.basePath = currentBasePath;
    });

    test("pathIdentifier", function () {
        equal(utils.pathIdentifier("test.htm"), "test", "Extension only");
        equal(utils.pathIdentifier("/folder/test"), "folder-test", "Path only");
        equal(utils.pathIdentifier("/folder/test.htm"), "folder-test", "Full path and extension");
        equal(utils.pathIdentifier("folder/test.htm"), "folder-test", "Relative path and extension");
        equal(utils.pathIdentifier("folder/test.template.htm"), "folder-testtemplate", "Name contains period");
        equal(utils.pathIdentifier("folder/test/template.htm"), "folder-test-template", "Multiple parent folders");
    });

    test("resourcePathIdentifier", function () {
        var currentBasePath = ko.composite.options.basePath;
        ko.composite.options.basePath = '../../Client';
        equal(utils.resourcePathIdentifier("test.htm"), "--Client-test");
        ko.composite.options.basePath = currentBasePath;

    });

    test("resourcePath includes basePath", function () {
        var currentBasePath = ko.composite.options.basePath;
        ko.composite.options.basePath = '/Base/';

        equal(utils.resourcePath('Panes', 'test'), "Base/Panes/test", "paths are combined");
        equal(utils.resourcePath('/Panes/', 'test'), "Base/Panes/test", "leading slash is removed");
        equal(utils.resourcePath('Panes/', 'test', 'htm'), "Base/Panes/test.htm", "extension is added");
        equal(utils.resourcePath('//test/', '/test'), "Base/test/test", "double slashes are removed");

        ko.composite.options.basePath = currentBasePath;
    });

    test('when pane is a string and parentPane is null, inheritParentPane returns the same path', function () {
        equal(utils.inheritParentPath('/Test/test', null), '/Test/test');
    });

    test('when pane is a Pane and parentPane is null, inheritParentPane returns the same Pane without modifying path', function () {
        var pane = { path: '/Test/test' };
        var modifiedPane = utils.inheritParentPath(pane, null);
        equal(modifiedPane, pane);
        equal(modifiedPane.path, '/Test/test');
    });

    test('when pane is a string and parentPane has an absolute path, inheritParentPane returns the combined path', function () {
        equal(utils.inheritParentPath('/Test/test', { path: '/Test2/test' }), '/Test2/test');
    });

    test('when pane is a Pane and parentPane has an absolute path, inheritParentPane returns the same Pane with the combined path', function () {
        var pane = { path: '/Test/test' };
        var modifiedPane = utils.inheritParentPath(pane, { path: '/Test2/test' });
        equal(modifiedPane, pane);
        equal(modifiedPane.path, '/Test2/test');
    });

    test('isFullUrl returns correct results', function () {
        ok(utils.isFullUrl('http://google.com'));
        ok(utils.isFullUrl('https://google.com'));
        ok(utils.isFullUrl('svn://google.com'));
        ok(!utils.isFullUrl('Path'));
        ok(!utils.isFullUrl('/Path'));
    });
});