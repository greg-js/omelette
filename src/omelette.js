// Generated by CoffeeScript 1.10.0

/*
 * Omelette Simple Auto Completion for Node
 */

(function() {
  var EventEmitter, Omelette, fs, os, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  EventEmitter = require("events").EventEmitter;

  path = require("path");

  fs = require("fs");

  os = require("os");

  Omelette = (function(superClass) {
    var log;

    extend(Omelette, superClass);

    log = console.log;

    function Omelette() {
      var isZsh, ref;
      this.compgen = process.argv.indexOf("--compgen");
      this.install = process.argv.indexOf("--completion") > -1;
      isZsh = process.argv.indexOf("--compzsh") > -1;
      this.isDebug = process.argv.indexOf("--debug") > -1;
      this.fragment = parseInt(process.argv[this.compgen + 1]) - (isZsh ? 1 : 0);
      this.word = process.argv[this.compgen + 2];
      this.line = isZsh ? process.argv[this.compgen + 3] : process.argv.slice(this.compgen + 3);
      ref = process.env, this.HOME = ref.HOME, this.SHELL = ref.SHELL;
    }

    Omelette.prototype.setProgram = function(programs) {
      programs = programs.split('|');
      this.program = programs[0];
      return this.programs = programs.map(function(program) {
        return program.replace(/[^A-Za-z0-9\.\_\-]/g, '');
      });
    };

    Omelette.prototype.setFragments = function() {
      var fragments1;
      fragments1 = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.fragments = fragments1;
    };

    Omelette.prototype.generate = function() {
      this.emit("complete", this.fragments[this.fragment - 1], this.word, this.line);
      this.emit(this.fragments[this.fragment - 1], this.word, this.line);
      this.emit("$" + this.fragment, this.word, this.line);
      return process.exit();
    };

    Omelette.prototype.reply = function(words) {
      if (words == null) {
        words = [];
      }
      console.log(words.join("\n"));
      return process.exit();
    };

    Omelette.prototype.generateCompletionCode = function() {
      var completions;
      completions = this.programs.map((function(_this) {
        return function(program) {
          var completion;
          completion = "_" + program + "_complette";
          return "### " + program + " completion - begin. generated by omelette.js ###\nif type compdef &>/dev/null; then\n  " + completion + "() {\n    compadd -- `" + _this.program + " --compzsh --compgen \"${CURRENT}\" \"${words[CURRENT-1]}\" \"${BUFFER}\"`\n  }\n  compdef " + completion + " " + program + "\nelif type complete &>/dev/null; then\n  " + completion + "() {\n    COMPREPLY=( $(compgen -W '$(" + _this.program + " --compbash --compgen \"${COMP_CWORD}\" \"${COMP_WORDS[COMP_CWORD-1]}\" \"${COMP_LINE}\")' -- \"${COMP_WORDS[COMP_CWORD]}\") )\n  }\n  complete -F " + completion + " " + program + "\nfi\n### " + program + " completion - end ###";
        };
      })(this));
      if (this.isDebug) {
        completions.push(this.generateTestAliases());
      }
      return completions.join(os.EOL);
    };

    Omelette.prototype.generateTestAliases = function() {
      var debugAliases, debugUnaliases, fullPath;
      fullPath = path.join(process.cwd(), this.program);
      debugAliases = this.programs.map(function(program) {
        return "  alias " + program + "=" + fullPath;
      }).join(os.EOL);
      debugUnaliases = this.programs.map(function(program) {
        return "  unalias " + program;
      }).join(os.EOL);
      return "### test method ###\nomelette-debug-" + this.program + "() {\n" + debugAliases + "\n}\nomelette-nodebug-" + this.program + "() {\n" + debugUnaliases + "\n}\n### tests ###";
    };

    Omelette.prototype.checkInstall = function() {
      if (this.install) {
        log(this.generateCompletionCode());
        return process.exit();
      }
    };

    Omelette.prototype.getActiveShell = function() {
      var SHELL;
      SHELL = process.env.SHELL;
      if (SHELL.match(/bash/)) {
        return 'bash';
      } else if (SHELL.match(/zsh/)) {
        return 'zsh';
      }
    };

    Omelette.prototype.getDefaultShellInitFile = function() {
      var fileAt, fileAtHome;
      fileAt = function(root) {
        return function(file) {
          return path.join(root, file);
        };
      };
      fileAtHome = fileAt(this.HOME);
      switch (this.shell = this.getActiveShell()) {
        case 'bash':
          return fileAtHome('.bashrc');
        case 'zsh':
          return fileAtHome('.zshrc');
      }
    };

    Omelette.prototype.setupShellInitFile = function(initFile) {
      var completionPath, programFolder, template;
      if (initFile == null) {
        initFile = this.getDefaultShellInitFile();
      }
      template = (function(_this) {
        return function(command) {
          return "\n# begin " + _this.program + " completion\n" + command + "\n# end " + _this.program + " completion\n";
        };
      })(this);
      switch (this.shell) {
        case 'bash':
          programFolder = path.join(this.HOME, "." + this.program);
          completionPath = path.join(programFolder, 'completion.sh');
          if (!fs.existsSync(programFolder)) {
            fs.mkdirSync(programFolder);
          }
          fs.writeFileSync(completionPath, this.generateCompletionCode());
          fs.appendFileSync(initFile, template("source " + completionPath));
          break;
        case 'zsh':
          fs.appendFileSync(initFile, template(". <(" + this.program + " --completion)"));
      }
      return process.exit();
    };

    Omelette.prototype.init = function() {
      if (this.compgen > -1) {
        return this.generate();
      }
    };

    return Omelette;

  })(EventEmitter);

  module.exports = function(template) {
    var _omelette, fragments, program, ref;
    ref = template.split(/\s+/), program = ref[0], fragments = 2 <= ref.length ? slice.call(ref, 1) : [];
    fragments = fragments.map(function(fragment) {
      return fragment.replace(/^\<+|\>+$/g, '');
    });
    _omelette = new Omelette;
    _omelette.setProgram(program);
    _omelette.setFragments.apply(_omelette, fragments);
    _omelette.checkInstall();
    return _omelette;
  };

}).call(this);
