var path = require('path');
var fs = require('fs');

// TODO Do not expect require to be included before plugins
var requireUsed = function(files) {
    if (files) {
        for (var i = files.length, pattern; i > 0; i--) {
            pattern = files[i] && files[i].pattern;

            if (typeof pattern === 'string' && (pattern.indexOf("\\karma-requirejs\\") !== -1 || pattern.indexOf("/karma-requirejs/") !== -1)) {
                return true;
            }
        }
    }

    return false;
};

var pattern = function(file, exclude) {
    return {pattern: file, included: !exclude, served: true, watched: false};
};

var requireAdapter = function(plugin, filePath, files, use) {
    var name = path.join(__dirname, '_' + plugin + '-require-adapter.js');
    filePath = path.resolve(filePath).replace(/\.js$/,'');

    // Fix path in windows environment
    filePath = filePath.split('\\').join('/');

    var content  = 'requirejs.config({\n' +
                   '  "paths": {\n' +
                   '    "' + plugin + '": "/absolute' + filePath + '"\n' +
                   '  }\n' +
                   '});\n\n';
    if (use) {
        content += 'require(["chai", "' + plugin + '"], function(chai, plugin){\n' +
                   '    chai.use(plugin);\n' +
                   '});';
    } else {
        content += 'require(["chai"], function(chai){\n' +
                   '    chai.should();\n' +
                   '});';
    }

    fs.writeFileSync(name, content);

    files.push(pattern(name));
};

var plugins = {
    'chai': function(name, files) {
        var filePath = path.resolve(require.resolve('chai'), '../chai.js');

        // RequireJS environment also need chai-adapter, as in most other karma-chai-*
        files.unshift(pattern(path.join(__dirname, 'chai-adapter.js')));
        requireAdapter(name, filePath, files);
        files.unshift(pattern(filePath));
    },
    'chai-as-promised': function(name, files) {
        var filePath = require.resolve(name);
        var required = requireUsed(files);

        if (!required) {
            files.unshift(pattern(path.join(__dirname, 'function-bind-polyfill.js')));
        } else {
            requireAdapter(name, filePath, files, true);
        }

        files.push(pattern(filePath, required));
    },
    'sinon-chai': function(name, files) {
        var filePath = require.resolve(name);
        var required = requireUsed(files);

        if (required) {
            requireAdapter(name, filePath, files, true);
        }

        files.push(pattern(filePath, required));
        files.unshift(pattern(path.resolve(require.resolve('sinon'), '../../pkg/sinon.js')));
    },
    'chai-jquery': function(name, files) {
         var filePath = require.resolve(name);
         var required = requireUsed(files);

         if (required) {
             requireAdapter(name, filePath, files, true);
         }

         files.push(pattern(filePath, required));
    },
    'chai-things': function(name, files) {
         var filePath = require.resolve(name);
         var required = requireUsed(files);

         if (required) {
             requireAdapter(name, filePath, files, true);
         }

         files.push(pattern(filePath, required));
    }
};

var $inject = ['config.files'];
var exports = {};
var label, plugin;

for (label in plugins) {
    plugin = plugins[label].bind(null, label);
    plugin.$inject = $inject;

    exports['framework:' + label] = ['factory', plugin];
}

module.exports = exports;