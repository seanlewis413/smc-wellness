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
const os_1 = require("os");
class InstallCommand {
    constructor($options, $platformsData, $platformService, $projectData, $projectDataService, $pluginsService, $logger, $fs, $stringParameter, $npm) {
        this.$options = $options;
        this.$platformsData = $platformsData;
        this.$platformService = $platformService;
        this.$projectData = $projectData;
        this.$projectDataService = $projectDataService;
        this.$pluginsService = $pluginsService;
        this.$logger = $logger;
        this.$fs = $fs;
        this.$stringParameter = $stringParameter;
        this.$npm = $npm;
        this.enableHooks = false;
        this.allowedParameters = [this.$stringParameter];
        this.$projectData.initializeProjectData();
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            return args[0] ? this.installModule(args[0]) : this.installProjectDependencies();
        });
    }
    installProjectDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            let error = "";
            yield this.$pluginsService.ensureAllDependenciesAreInstalled(this.$projectData);
            for (const platform of this.$platformsData.platformsNames) {
                const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
                const frameworkPackageData = this.$projectDataService.getNSValue(this.$projectData.projectDir, platformData.frameworkPackageName);
                if (frameworkPackageData && frameworkPackageData.version) {
                    try {
                        const platformProjectService = platformData.platformProjectService;
                        yield platformProjectService.validate(this.$projectData);
                        yield this.$platformService.addPlatforms([`${platform}@${frameworkPackageData.version}`], this.$options.platformTemplate, this.$projectData, this.$options, this.$options.frameworkPath);
                    }
                    catch (err) {
                        error = `${error}${os_1.EOL}${err}`;
                    }
                }
            }
            if (error) {
                this.$logger.error(error);
            }
        });
    }
    installModule(moduleName) {
        return __awaiter(this, void 0, void 0, function* () {
            const projectDir = this.$projectData.projectDir;
            const devPrefix = 'nativescript-dev-';
            if (!this.$fs.exists(moduleName) && moduleName.indexOf(devPrefix) !== 0) {
                moduleName = devPrefix + moduleName;
            }
            yield this.$npm.install(moduleName, projectDir, {
                'save-dev': true,
                disableNpmInstall: this.$options.disableNpmInstall,
                frameworkPath: this.$options.frameworkPath,
                ignoreScripts: this.$options.ignoreScripts,
                path: this.$options.path
            });
        });
    }
}
exports.InstallCommand = InstallCommand;
$injector.registerCommand("install", InstallCommand);
