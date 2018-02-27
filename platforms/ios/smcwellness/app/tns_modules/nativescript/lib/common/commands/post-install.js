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
class PostInstallCommand {
    constructor($fs, $staticConfig, $commandsService, $helpService, $settingsService, $doctorService, $analyticsService, $logger) {
        this.$fs = $fs;
        this.$staticConfig = $staticConfig;
        this.$commandsService = $commandsService;
        this.$helpService = $helpService;
        this.$settingsService = $settingsService;
        this.$doctorService = $doctorService;
        this.$analyticsService = $analyticsService;
        this.$logger = $logger;
        this.disableAnalytics = true;
        this.allowedParameters = [];
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.platform !== "win32") {
                if (process.env.SUDO_USER) {
                    yield this.$fs.setCurrentUserAsOwner(this.$settingsService.getProfileDir(), process.env.SUDO_USER);
                }
            }
            yield this.$helpService.generateHtmlPages();
            const doctorResult = yield this.$doctorService.printWarnings({ trackResult: false });
            yield this.$analyticsService.checkConsent();
            yield this.$commandsService.tryExecuteCommand("autocomplete", []);
            yield this.$analyticsService.track("InstallEnvironmentSetup", doctorResult ? "incorrect" : "correct");
            if (this.$staticConfig.INSTALLATION_SUCCESS_MESSAGE) {
                this.$logger.out();
                this.$logger.printMarkdown(this.$staticConfig.INSTALLATION_SUCCESS_MESSAGE);
            }
        });
    }
}
exports.PostInstallCommand = PostInstallCommand;
$injector.registerCommand("dev-post-install", PostInstallCommand);
