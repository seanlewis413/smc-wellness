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
const constants_1 = require("../constants");
class DeployOnDeviceCommand {
    constructor($platformService, $platformCommandParameter, $options, $projectData, $errors, $mobileHelper, $platformsData) {
        this.$platformService = $platformService;
        this.$platformCommandParameter = $platformCommandParameter;
        this.$options = $options;
        this.$projectData = $projectData;
        this.$errors = $errors;
        this.$mobileHelper = $mobileHelper;
        this.$platformsData = $platformsData;
        this.allowedParameters = [];
        this.$projectData.initializeProjectData();
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const appFilesUpdaterOptions = { bundle: !!this.$options.bundle, release: this.$options.release };
            const deployOptions = {
                clean: this.$options.clean,
                device: this.$options.device,
                projectDir: this.$options.path,
                emulator: this.$options.emulator,
                platformTemplate: this.$options.platformTemplate,
                release: this.$options.release,
                forceInstall: true,
                provision: this.$options.provision,
                teamId: this.$options.teamId,
                keyStoreAlias: this.$options.keyStoreAlias,
                keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
                keyStorePassword: this.$options.keyStorePassword,
                keyStorePath: this.$options.keyStorePath
            };
            const deployPlatformInfo = {
                platform: args[0],
                appFilesUpdaterOptions,
                deployOptions,
                projectData: this.$projectData,
                config: this.$options,
                env: this.$options.env
            };
            return this.$platformService.deployPlatform(deployPlatformInfo);
        });
    }
    canExecute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args || !args.length || args.length > 1) {
                return false;
            }
            if (!(yield this.$platformCommandParameter.validate(args[0]))) {
                return false;
            }
            if (this.$mobileHelper.isAndroidPlatform(args[0]) && this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
                this.$errors.fail(constants_1.ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
            }
            const platformData = this.$platformsData.getPlatformData(args[0], this.$projectData);
            const platformProjectService = platformData.platformProjectService;
            yield platformProjectService.validate(this.$projectData);
            return this.$platformService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, args[0]);
        });
    }
}
exports.DeployOnDeviceCommand = DeployOnDeviceCommand;
$injector.registerCommand("deploy", DeployOnDeviceCommand);
