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
const helpers = require("../helpers");
class AutoCompleteCommand {
    constructor($autoCompletionService, $logger, $prompter) {
        this.$autoCompletionService = $autoCompletionService;
        this.$logger = $logger;
        this.$prompter = $prompter;
        this.disableAnalytics = true;
        this.allowedParameters = [];
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (helpers.isInteractive()) {
                if (this.$autoCompletionService.isAutoCompletionEnabled()) {
                    if (this.$autoCompletionService.isObsoleteAutoCompletionEnabled()) {
                        yield this.$autoCompletionService.enableAutoCompletion();
                    }
                    else {
                        this.$logger.info("Autocompletion is already enabled");
                    }
                }
                else {
                    this.$logger.out("If you are using bash or zsh, you can enable command-line completion.");
                    const message = "Do you want to enable it now?";
                    const autoCompetionStatus = yield this.$prompter.confirm(message, () => true);
                    if (autoCompetionStatus) {
                        yield this.$autoCompletionService.enableAutoCompletion();
                    }
                    else {
                        this.$autoCompletionService.disableAutoCompletion();
                    }
                }
            }
        });
    }
}
exports.AutoCompleteCommand = AutoCompleteCommand;
$injector.registerCommand("autocomplete|*default", AutoCompleteCommand);
class DisableAutoCompleteCommand {
    constructor($autoCompletionService, $logger) {
        this.$autoCompletionService = $autoCompletionService;
        this.$logger = $logger;
        this.disableAnalytics = true;
        this.allowedParameters = [];
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.$autoCompletionService.isAutoCompletionEnabled()) {
                this.$autoCompletionService.disableAutoCompletion();
            }
            else {
                this.$logger.info("Autocompletion is already disabled.");
            }
        });
    }
}
exports.DisableAutoCompleteCommand = DisableAutoCompleteCommand;
$injector.registerCommand("autocomplete|disable", DisableAutoCompleteCommand);
class EnableAutoCompleteCommand {
    constructor($autoCompletionService, $logger) {
        this.$autoCompletionService = $autoCompletionService;
        this.$logger = $logger;
        this.disableAnalytics = true;
        this.allowedParameters = [];
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.$autoCompletionService.isAutoCompletionEnabled()) {
                this.$logger.info("Autocompletion is already enabled.");
            }
            else {
                yield this.$autoCompletionService.enableAutoCompletion();
            }
        });
    }
}
exports.EnableAutoCompleteCommand = EnableAutoCompleteCommand;
$injector.registerCommand("autocomplete|enable", EnableAutoCompleteCommand);
class AutoCompleteStatusCommand {
    constructor($autoCompletionService, $logger) {
        this.$autoCompletionService = $autoCompletionService;
        this.$logger = $logger;
        this.disableAnalytics = true;
        this.allowedParameters = [];
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.$autoCompletionService.isAutoCompletionEnabled()) {
                this.$logger.info("Autocompletion is enabled.");
            }
            else {
                this.$logger.info("Autocompletion is disabled.");
            }
        });
    }
}
exports.AutoCompleteStatusCommand = AutoCompleteStatusCommand;
$injector.registerCommand("autocomplete|status", AutoCompleteStatusCommand);
