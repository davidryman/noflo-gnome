const GLib = imports.gi.GLib;
const Options = imports.options;

const builderAdd = imports.builderAdd;
const builderBundle = imports.builderBundle;
const builderInit = imports.builderInit;
const builderInstall = imports.builderInstall;
const builderRun = imports.builderRun;

/**/

let printProgram = function(msg) {
    print('noflo-gnome: ' + msg);
}

let printHelp = function() {
    for (let i in commands) {
        let command = commands[i];
        print('\t' + i + '\t' + command.help);
    }
};

/**/

let commands = {
    'add': {
        exec: builderAdd.exec,
        help: 'Add content to an application repository',
    },
    'bundle': {
        exec: builderBundle.exec,
        help: 'Create a bundle of an application repository',
    },
    'init': {
        exec: builderInit.exec,
        help: 'Initialize a new application repository',
    },
    'install': {
        exec: builderInstall.exec,
        help: 'Install a noflo component repository',
    },
    'run': {
        exec: builderRun.exec,
        help: 'Run an application repository',
    },
    'help': {
        exec: function(args) {
            printProgram('');
            printHelp();
        },
        help: 'Print this screen',
    },
};

/**/

let execCommand = function(cmd, args) {
    let command = commands[cmd];
    if (command) {
        try {
            return command.exec(args);
        } catch (e) {
            printProgram(cmd + ' : ' + e.message);
        }
    } else {
        printProgram('Unknown command ' + cmd);
        printHelp();
    }
    return -1;
};

/**/

let start = function() {
    if (ARGV[0] == '--' && ARGV[1]) {
        return execCommand(ARGV[1], ARGV.slice(2));
    } else if (ARGV[0]) {
        return execCommand(ARGV[0], ARGV.slice(1));
    }

    printProgram('');
    printHelp();

    return 0;
}
