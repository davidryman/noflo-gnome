const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Utils = imports.utils;

/* Module listing */

let getModuleAtPath = function(path) {
    if (!GLib.file_test(path, GLib.FileTest.IS_DIR))
        return null;

    let manifestPath = path + '/component.json';
    if (!GLib.file_test(manifestPath, GLib.FileTest.IS_REGULAR))
        return null;

    let file = Gio.File.new_for_path(manifestPath);
    let [, manifestContent] = file.load_contents(null);
    let manifest;

    try {
        manifest = JSON.parse('' + manifestContent);
        manifest.path = path;
    } catch (e) {
        return null;
    }

    /* Quick sanity check */
    if (!manifest.name ||
        !manifest.noflo)
        return null;

    return manifest;
};

let getModulesInPath = function(path) {
    let modules = {};

    if (!GLib.file_test(path, GLib.FileTest.IS_DIR))
        return modules;

    Utils.forEachInDirectory(Gio.File.new_for_path(path), function(child) {
        let module = getModuleAtPath(child.get_path());

        if (module)
            modules[module.name] = module;
    });

    return modules;
};

let getModules = function(paths) {
    let modules = {};
    for (let i in paths) {
        Utils.mergeProps(modules, getModulesInPath(paths[i]));
    }
    return modules;
};

/* Component loader to be injected into the runtime base */

let ComponentLoader = function(options) {
    let self = this;

    /* Ensure with have valid options */
    self.options = options;
    if (!self.options)
        self.options = { paths: [ '.' ] };
    if (!self.options.path)
        self.options.path = ['.'];

    self.components = {};
    self.listCallbacks = [];

    let logFunc = function(name) {
        log('calling : ' +  name);
    };

    let normalizeName = function(name) {
        return name.replace('noflo-', '');
    };

    let removeExtension = function(path) {
        let ret = path.replace(/\.coffee$/, '');
        return ret.replace(/\.js$/, '');
    };

    let generateComponentInstance = function(path) {
        return function(metadata) {
            let implementation = require(path);
            let instance = implementation.getComponent(metadata);
            return instance;
        };
    };

    let getComponentRequirePath = function(module, component) {
        let path = module.path + '/' + module.noflo.components[component];
        path = removeExtension(path);
        return path;
    };

    self.listComponents = function(callback) {
        // List is built already
        if (self.builtList) {
            callback(self.components);
            return;
        }

        self.listCallbacks.push(callback);

        // Building list
        if (self.buildingList)
            return;

        self.buildingList = true;

        Mainloop.timeout_add(0, Lang.bind(this, function() {
            let modules = getModules(self.options.paths);
            self.components = {};
            for (let i in modules) {
                let module = modules[i];
                for (let j in module.noflo.components) {
                    let path = normalizeName(module.name + '/' + j);
                    self.components[path] = {
                        //module: module,
                        //component: j,
                        create: generateComponentInstance(getComponentRequirePath(module, j))
                    };
                }

                if (module.noflo.loader) {
                    let path = module.path + '/' + module.noflo.loader;
                    path = removeExtension(path);
                    let loader = require(path);
                    loader(self);
                }
            }

            let callbacks = self.listCallbacks;
            self.listCallbacks = [];
            self.buildingList = false;
            self.builtList = true;
            for (let i in callbacks)
                callbacks[i](self.components);

            return false;
        }));
    };

    self.load = function(name, callback, delayed, metadata) {
        if (!self.components[name])
            throw new Error('Component ' + name + ' not available');

        Mainloop.timeout_add(0, Lang.bind(this, function() {
            callback(self.components[name].create(metadata));
            return false;
        }));
    };

    self.loadGraph = function(name, component, callback, delayed, metadata) {
        log('loadGraph ' + name);
    };

    self.registerComponent = function(packageId, name, cPath, callback) {
        self.components[packageId + '/' + name] = {
            create: cPath,
        };
        log('registerComponent ' + packageId + ' / ' + name);
    };

    self.registerGraph = function(packageId, name, gPath, callback) {
        log('registerGraph ' + packageId + ' / ' + name);
    };

    self.setSource = function(packageId, name, source, language, callback) {
        log('setSource ' + packageId + ' / ' + name);
    };

    self.getSource = function(name, callback) {
        log('getSource ' + name);
    };
};
