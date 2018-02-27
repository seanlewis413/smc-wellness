"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers = require("./helpers");
const yargs = require("yargs");
class OptionsBase {
    constructor(options, $errors, $staticConfig, $settingsService) {
        this.options = options;
        this.$errors = $errors;
        this.$staticConfig = $staticConfig;
        this.$settingsService = $settingsService;
        this.optionsWhiteList = ["ui", "recursive", "reporter", "require", "timeout", "_", "$0"];
        this.globalOptions = {
            log: { type: "string" },
            verbose: { type: "boolean", alias: "v" },
            version: { type: "boolean" },
            help: { type: "boolean", alias: "h" },
            profileDir: { type: "string" },
            analyticsClient: { type: "string" },
            path: { type: "string", alias: "p" },
            _: { type: "string" }
        };
        this.options = _.extend({}, this.commonOptions, this.options, this.globalOptions);
        this.setArgv();
    }
    get shorthands() {
        const result = [];
        _.each(_.keys(this.options), optionName => {
            if (this.options[optionName].alias) {
                result.push(this.options[optionName].alias);
            }
        });
        return result;
    }
    get commonOptions() {
        return {
            all: { type: "boolean" },
            json: { type: "boolean" },
            watch: { type: "boolean" },
            avd: { type: "string" },
            config: { type: "array" },
            insecure: { type: "boolean", alias: "k" },
            debug: { type: "boolean", alias: "d" },
            timeout: { type: "string" },
            device: { type: "string" },
            availableDevices: { type: "boolean" },
            appid: { type: "string" },
            geny: { type: "string" },
            debugBrk: { type: "boolean" },
            debugPort: { type: "number" },
            start: { type: "boolean" },
            stop: { type: "boolean" },
            ddi: { type: "string" },
            justlaunch: { type: "boolean" },
            file: { type: "string" },
            force: { type: "boolean", alias: "f" },
            companion: { type: "boolean" },
            emulator: { type: "boolean" },
            sdk: { type: "string" },
            template: { type: "string" },
            certificate: { type: "string" },
            certificatePassword: { type: "string" },
            release: { type: "boolean", alias: "r" },
            var: { type: "object" },
            default: { type: "boolean" },
            count: { type: "number" },
            hooks: { type: "boolean", default: true }
        };
    }
    get optionNames() {
        return _.keys(this.options);
    }
    getOptionValue(optionName) {
        optionName = this.getCorrectOptionName(optionName);
        return this.argv[optionName];
    }
    validateOptions(commandSpecificDashedOptions) {
        if (commandSpecificDashedOptions) {
            _.extend(this.options, commandSpecificDashedOptions);
            this.setArgv();
        }
        const parsed = Object.create(null);
        _.each(_.keys(this.argv), optionName => {
            parsed[optionName] = this.getOptionValue(optionName);
        });
        _.each(parsed, (value, originalOptionName) => {
            if (value === undefined) {
                return;
            }
            const optionName = this.getCorrectOptionName(originalOptionName);
            if (!_.includes(this.optionsWhiteList, optionName)) {
                if (!this.isOptionSupported(optionName)) {
                    this.$errors.failWithoutHelp(`The option '${originalOptionName}' is not supported. To see command's options, use '$ ${this.$staticConfig.CLIENT_NAME.toLowerCase()} help ${process.argv[2]}'. To see all commands use '$ ${this.$staticConfig.CLIENT_NAME.toLowerCase()} help'.`);
                }
                const optionType = this.getOptionType(optionName), optionValue = parsed[optionName];
                if (_.isArray(optionValue) && optionType !== "array") {
                    this.$errors.fail("You have set the %s option multiple times. Check the correct command syntax below and try again.", originalOptionName);
                }
                else if (optionType === "string" && helpers.isNullOrWhitespace(optionValue)) {
                    this.$errors.failWithoutHelp("The option '%s' requires non-empty value.", originalOptionName);
                }
                else if (optionType === "array" && optionValue.length === 0) {
                    this.$errors.failWithoutHelp(`The option '${originalOptionName}' requires one or more values, separated by a space.`);
                }
            }
        });
    }
    getCorrectOptionName(optionName) {
        const secondaryOptionName = this.getNonDashedOptionName(optionName);
        return _.includes(this.optionNames, secondaryOptionName) ? secondaryOptionName : optionName;
    }
    getOptionType(optionName) {
        const option = this.options[optionName] || this.tryGetOptionByAliasName(optionName);
        return option ? option.type : "";
    }
    tryGetOptionByAliasName(aliasName) {
        const option = _.find(this.options, opt => opt.alias === aliasName);
        return option;
    }
    isOptionSupported(option) {
        if (!this.options[option]) {
            const opt = this.tryGetOptionByAliasName(option);
            return !!opt;
        }
        return true;
    }
    getNonDashedOptionName(optionName) {
        const matchUpperCaseLetters = optionName.match(OptionsBase.NONDASHED_OPTION_REGEX);
        if (matchUpperCaseLetters) {
            const secondaryOptionName = matchUpperCaseLetters[1] + matchUpperCaseLetters[2].toUpperCase() + matchUpperCaseLetters[3] || '';
            return this.getNonDashedOptionName(secondaryOptionName);
        }
        return optionName;
    }
    getDashedOptionName(optionName) {
        const matchUpperCaseLetters = optionName.match(OptionsBase.DASHED_OPTION_REGEX);
        if (matchUpperCaseLetters) {
            const secondaryOptionName = `${matchUpperCaseLetters[1]}-${matchUpperCaseLetters[2].toLowerCase()}${matchUpperCaseLetters[3] || ''}`;
            return this.getDashedOptionName(secondaryOptionName);
        }
        return optionName;
    }
    setArgv() {
        const opts = {};
        _.each(this.options, (value, key) => {
            opts[this.getDashedOptionName(key)] = value;
        });
        this.argv = yargs(process.argv.slice(2)).options(opts).argv;
        this.$settingsService.setSettings({ profileDir: this.argv.profileDir });
        this.argv.profileDir = this.argv["profile-dir"] = this.$settingsService.getProfileDir();
        if (this.argv.bundle !== undefined) {
            this.argv.bundle = this.argv.bundle || "webpack";
        }
        this.adjustDashedOptions();
    }
    adjustDashedOptions() {
        _.each(this.optionNames, optionName => {
            Object.defineProperty(OptionsBase.prototype, optionName, {
                configurable: true,
                get: () => {
                    return this.getOptionValue(optionName);
                },
                set: (value) => {
                    this.argv[optionName] = value;
                }
            });
        });
    }
}
OptionsBase.DASHED_OPTION_REGEX = /(.+?)([A-Z])(.*)/;
OptionsBase.NONDASHED_OPTION_REGEX = /(.+?)[-]([a-zA-Z])(.*)/;
exports.OptionsBase = OptionsBase;
