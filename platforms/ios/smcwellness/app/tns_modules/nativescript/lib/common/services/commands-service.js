"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const jaroWinklerDistance = require("../vendor/jaro-winkler_distance");
const helpers = require("../helpers");
const os_1 = require("os");
class CommandArgumentsValidationHelper {
    constructor(isValid, _remainingArguments) {
        this.isValid = isValid;
        this.remainingArguments = _remainingArguments.slice();
    }
}
class CommandsService {
    constructor($commandsServiceProvider, $errors, $fs, $hooksService, $injector, $logger, $options, $resources, $staticConfig, $helpService) {
        this.$commandsServiceProvider = $commandsServiceProvider;
        this.$errors = $errors;
        this.$fs = $fs;
        this.$hooksService = $hooksService;
        this.$injector = $injector;
        this.$logger = $logger;
        this.$options = $options;
        this.$resources = $resources;
        this.$staticConfig = $staticConfig;
        this.$helpService = $helpService;
        this.areDynamicSubcommandsRegistered = false;
    }
    allCommands(opts) {
        const commands = this.$injector.getRegisteredCommandsNames(opts.includeDevCommands);
        return _.reject(commands, (command) => _.includes(command, '|'));
    }
    executeCommandUnchecked(commandName, commandArguments) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = this.$injector.resolveCommand(commandName);
            if (command) {
                if (!this.$staticConfig.disableAnalytics && !command.disableAnalytics) {
                    const analyticsService = this.$injector.resolve("analyticsService");
                    yield analyticsService.checkConsent();
                    yield analyticsService.trackFeature(commandName);
                    const beautifiedCommandName = this.beautifyCommandName(commandName).replace(/\|/g, " ");
                    const googleAnalyticsPageData = {
                        googleAnalyticsDataType: "pageview",
                        path: beautifiedCommandName,
                        title: beautifiedCommandName
                    };
                    yield analyticsService.trackInGoogleAnalytics(googleAnalyticsPageData);
                }
                if (!this.$staticConfig.disableCommandHooks && (command.enableHooks === undefined || command.enableHooks === true)) {
                    const hierarchicalCommandName = this.$injector.buildHierarchicalCommand(commandName, commandArguments);
                    if (hierarchicalCommandName) {
                        commandName = helpers.stringReplaceAll(hierarchicalCommandName.commandName, CommandsService.HIERARCHICAL_COMMANDS_DEFAULT_COMMAND_DELIMITER, CommandsService.HOOKS_COMMANDS_DELIMITER);
                        commandName = helpers.stringReplaceAll(commandName, CommandsService.HIERARCHICAL_COMMANDS_DELIMITER, CommandsService.HOOKS_COMMANDS_DELIMITER);
                    }
                    yield this.$hooksService.executeBeforeHooks(commandName);
                    yield command.execute(commandArguments);
                    yield this.$hooksService.executeAfterHooks(commandName);
                }
                else {
                    yield command.execute(commandArguments);
                }
                const commandHelp = this.getCommandHelp();
                if (!command.disableCommandHelpSuggestion && commandHelp && commandHelp[commandName]) {
                    const suggestionText = commandHelp[commandName];
                    this.$logger.printMarkdown(~suggestionText.indexOf('%s') ? require('util').format(suggestionText, commandArguments) : suggestionText);
                }
                return true;
            }
            return false;
        });
    }
    printHelp(commandName) {
        return this.$helpService.showCommandLineHelp(this.beautifyCommandName(commandName));
    }
    executeCommandAction(commandName, commandArguments, action) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.$errors.beginCommand(() => action.apply(this, [commandName, commandArguments]), () => this.printHelp(commandName));
        });
    }
    tryExecuteCommandAction(commandName, commandArguments) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = this.$injector.resolveCommand(commandName);
            if (!command || (command && !command.isHierarchicalCommand)) {
                this.$options.validateOptions(command ? command.dashedOptions : null);
            }
            if (!this.areDynamicSubcommandsRegistered) {
                this.$commandsServiceProvider.registerDynamicSubCommands();
                this.areDynamicSubcommandsRegistered = true;
            }
            return this.canExecuteCommand(commandName, commandArguments);
        });
    }
    tryExecuteCommand(commandName, commandArguments) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.executeCommandAction(commandName, commandArguments, this.tryExecuteCommandAction)) {
                yield this.executeCommandAction(commandName, commandArguments, this.executeCommandUnchecked);
            }
            else {
                const command = this.$injector.resolveCommand(commandName);
                if (command) {
                    yield this.printHelp(commandName);
                }
            }
        });
    }
    canExecuteCommand(commandName, commandArguments, isDynamicCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = this.$injector.resolveCommand(commandName);
            const beautifiedName = helpers.stringReplaceAll(commandName, "|", " ");
            if (command) {
                if (command.isDisabled) {
                    this.$errors.failWithoutHelp("This command is not applicable to your environment.");
                }
                if (command.canExecute) {
                    return yield command.canExecute(commandArguments);
                }
                if (yield this.$injector.isValidHierarchicalCommand(commandName, commandArguments)) {
                    return true;
                }
                if (yield this.validateCommandArguments(command, commandArguments)) {
                    return true;
                }
                this.$errors.fail("Unable to execute command '%s'. Use '$ %s %s --help' for help.", beautifiedName, this.$staticConfig.CLIENT_NAME.toLowerCase(), beautifiedName);
                return false;
            }
            else if (!isDynamicCommand && _.startsWith(commandName, this.$commandsServiceProvider.dynamicCommandsPrefix)) {
                if (_.some(yield this.$commandsServiceProvider.getDynamicCommands())) {
                    yield this.$commandsServiceProvider.generateDynamicCommands();
                    return yield this.canExecuteCommand(commandName, commandArguments, true);
                }
            }
            this.$logger.fatal("Unknown command '%s'. Use '%s help' for help.", beautifiedName, this.$staticConfig.CLIENT_NAME.toLowerCase());
            this.tryMatchCommand(commandName);
            return false;
        });
    }
    validateMandatoryParams(commandArguments, mandatoryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const commandArgsHelper = new CommandArgumentsValidationHelper(true, commandArguments);
            if (mandatoryParams.length > 0) {
                if (mandatoryParams.length > commandArguments.length) {
                    const customErrorMessages = _.map(mandatoryParams, mp => mp.errorMessage);
                    customErrorMessages.splice(0, 0, "You need to provide all the required parameters.");
                    this.$errors.fail(customErrorMessages.join(os_1.EOL));
                }
                for (let mandatoryParamIndex = 0; mandatoryParamIndex < mandatoryParams.length; ++mandatoryParamIndex) {
                    const mandatoryParam = mandatoryParams[mandatoryParamIndex];
                    let argument = null;
                    for (let remainingArgsIndex = 0; remainingArgsIndex < commandArgsHelper.remainingArguments.length; ++remainingArgsIndex) {
                        const c = commandArgsHelper.remainingArguments[remainingArgsIndex];
                        if (yield mandatoryParam.validate(c)) {
                            argument = c;
                            break;
                        }
                    }
                    if (argument) {
                        helpers.remove(commandArgsHelper.remainingArguments, arg => arg === argument);
                    }
                    else {
                        this.$errors.fail("Missing mandatory parameter.");
                    }
                }
            }
            return commandArgsHelper;
        });
    }
    validateCommandArguments(command, commandArguments) {
        return __awaiter(this, void 0, void 0, function* () {
            const mandatoryParams = _.filter(command.allowedParameters, (param) => param.mandatory);
            const commandArgsHelper = yield this.validateMandatoryParams(commandArguments, mandatoryParams);
            if (!commandArgsHelper.isValid) {
                return false;
            }
            if (!command.allowedParameters || command.allowedParameters.length === 0) {
                if (commandArguments.length > 0) {
                    this.$errors.fail("This command doesn't accept parameters.");
                }
            }
            else {
                const unverifiedAllowedParams = command.allowedParameters.filter((param) => !param.mandatory);
                for (let remainingArgsIndex = 0; remainingArgsIndex < commandArgsHelper.remainingArguments.length; ++remainingArgsIndex) {
                    const argument = commandArgsHelper.remainingArguments[remainingArgsIndex];
                    let parameter = null;
                    for (let unverifiedIndex = 0; unverifiedIndex < unverifiedAllowedParams.length; ++unverifiedIndex) {
                        const c = unverifiedAllowedParams[unverifiedIndex];
                        if (yield c.validate(argument)) {
                            parameter = c;
                            break;
                        }
                    }
                    if (parameter) {
                        const index = unverifiedAllowedParams.indexOf(parameter);
                        unverifiedAllowedParams.splice(index, 1);
                    }
                    else {
                        this.$errors.fail("The parameter %s is not valid for this command.", parameter);
                    }
                }
            }
            return true;
        });
    }
    tryMatchCommand(commandName) {
        const allCommands = this.allCommands({ includeDevCommands: false });
        let similarCommands = [];
        _.each(allCommands, (command) => {
            if (!this.$injector.isDefaultCommand(command)) {
                command = helpers.stringReplaceAll(command, "|", " ");
                const distance = jaroWinklerDistance(commandName, command);
                if (commandName.length > 3 && command.indexOf(commandName) !== -1) {
                    similarCommands.push({ rating: 1, name: command });
                }
                else if (distance >= 0.65) {
                    similarCommands.push({ rating: distance, name: command });
                }
            }
        });
        similarCommands = _.sortBy(similarCommands, (command) => {
            return -command.rating;
        }).slice(0, 5);
        if (similarCommands.length > 0) {
            const message = ["Did you mean?"];
            _.each(similarCommands, (command) => {
                message.push("\t" + command.name);
            });
            this.$logger.fatal(message.join("\n"));
        }
    }
    completeCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            const tabtab = require("tabtab");
            const completeCallback = (err, data) => {
                if (err || !data) {
                    return;
                }
                const commands = this.$injector.getRegisteredCommandsNames(false);
                const splittedLine = data.line.split(/[ ]+/);
                const line = _.filter(splittedLine, (w) => w !== "");
                let commandName = (line[line.length - 2]);
                const childrenCommands = this.$injector.getChildrenCommandsNames(commandName);
                if (data.last && _.startsWith(data.last, "--")) {
                    return tabtab.log(_.keys(this.$options.options), data, "--");
                }
                if (data.last && _.startsWith(data.last, "-")) {
                    return tabtab.log(this.$options.shorthands, data, "-");
                }
                if (data.words === 1) {
                    const allCommands = this.allCommands({ includeDevCommands: false });
                    return tabtab.log(allCommands, data);
                }
                if (data.words >= 2) {
                    if (data.words !== line.length) {
                        commandName = `${line[data.words - 2]}|${line[data.words - 1]}`;
                    }
                    else {
                        commandName = `${line[line.length - 1]}`;
                    }
                }
                const command = this.$injector.resolveCommand(commandName);
                if (command) {
                    const completionData = command.completionData;
                    if (completionData) {
                        return tabtab.log(completionData, data);
                    }
                    else {
                        return this.logChildrenCommandsNames(commandName, commands, tabtab, data);
                    }
                }
                else if (childrenCommands) {
                    let nonDefaultSubCommands = _.reject(childrenCommands, (children) => children[0] === '*');
                    let sanitizedChildrenCommands = [];
                    if (data.words !== line.length) {
                        sanitizedChildrenCommands = nonDefaultSubCommands.map((commandToMap) => {
                            const pipePosition = commandToMap.indexOf("|");
                            return commandToMap.substring(0, pipePosition !== -1 ? pipePosition : commandToMap.length);
                        });
                    }
                    else {
                        nonDefaultSubCommands = nonDefaultSubCommands.filter((commandNameToFilter) => commandNameToFilter.indexOf("|") !== -1);
                        sanitizedChildrenCommands = nonDefaultSubCommands.map((commandToMap) => {
                            const pipePosition = commandToMap.lastIndexOf("|");
                            return commandToMap.substring(pipePosition !== -1 ? pipePosition + 1 : 0, commandToMap.length);
                        });
                    }
                    return tabtab.log(sanitizedChildrenCommands, data);
                }
                else {
                    return this.logChildrenCommandsNames(commandName, commands, tabtab, data);
                }
            };
            yield tabtab.complete(this.$staticConfig.CLIENT_NAME.toLowerCase(), completeCallback);
            if (this.$staticConfig.CLIENT_NAME_ALIAS) {
                tabtab.complete(this.$staticConfig.CLIENT_NAME_ALIAS.toLowerCase(), completeCallback);
            }
            return true;
        });
    }
    getCommandHelp() {
        let commandHelp = null;
        if (this.$fs.exists(this.$resources.resolvePath(this.$staticConfig.COMMAND_HELP_FILE_NAME))) {
            commandHelp = this.$resources.readJson(this.$staticConfig.COMMAND_HELP_FILE_NAME);
        }
        return commandHelp;
    }
    beautifyCommandName(commandName) {
        if (commandName.indexOf("*") > 0) {
            return commandName.substr(0, commandName.indexOf("|"));
        }
        return commandName;
    }
    logChildrenCommandsNames(commandName, commands, tabtab, data) {
        const matchingCommands = commands.filter((commandToFilter) => {
            return commandToFilter.indexOf(commandName + "|") !== -1 && commandToFilter !== commandName;
        })
            .map((commandToMap) => {
            const commandResult = commandToMap.replace(commandName + "|", "");
            return commandResult.substring(0, commandResult.indexOf("|") !== -1 ? commandResult.indexOf("|") : commandResult.length);
        });
        return tabtab.log(matchingCommands, data);
    }
}
CommandsService.HIERARCHICAL_COMMANDS_DELIMITER = "|";
CommandsService.HIERARCHICAL_COMMANDS_DEFAULT_COMMAND_DELIMITER = "|*";
CommandsService.HOOKS_COMMANDS_DELIMITER = "-";
exports.CommandsService = CommandsService;
$injector.register("commandsService", CommandsService);
