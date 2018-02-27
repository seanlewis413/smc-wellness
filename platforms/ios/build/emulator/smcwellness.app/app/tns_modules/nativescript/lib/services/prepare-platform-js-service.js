"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants = require("../constants");
const path = require("path");
const shell = require("shelljs");
const temp = require("temp");
const helpers_1 = require("../common/helpers");
const prepare_platform_service_1 = require("./prepare-platform-service");
temp.track();
class PreparePlatformJSService extends prepare_platform_service_1.PreparePlatformService {
    constructor($fs, $xmlValidator, $hooksService, $errors, $logger, $projectDataService, $nodeModulesBuilder, $npm) {
        super($fs, $hooksService, $xmlValidator);
        this.$errors = $errors;
        this.$logger = $logger;
        this.$projectDataService = $projectDataService;
        this.$nodeModulesBuilder = $nodeModulesBuilder;
        this.$npm = $npm;
    }
    addPlatform(info) {
        return __awaiter(this, void 0, void 0, function* () {
            const customTemplateOptions = yield this.getPathToPlatformTemplate(info.platformTemplate, info.platformData.frameworkPackageName, info.projectData.projectDir);
            info.config.pathToTemplate = customTemplateOptions && customTemplateOptions.pathToTemplate;
            const frameworkPackageNameData = { version: info.installedVersion };
            if (customTemplateOptions) {
                frameworkPackageNameData.template = customTemplateOptions.selectedTemplate;
            }
            this.$projectDataService.setNSValue(info.projectData.projectDir, info.platformData.frameworkPackageName, frameworkPackageNameData);
        });
    }
    preparePlatform(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!config.changesInfo || config.changesInfo.appFilesChanged || config.changesInfo.changesRequirePrepare) {
                yield this.copyAppFiles(config);
            }
            if (config.changesInfo && !config.changesInfo.changesRequirePrepare) {
                const appDestinationDirectoryPath = path.join(config.platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
                const appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);
                if (this.$fs.exists(appResourcesDirectoryPath)) {
                    this.$fs.deleteDirectory(appResourcesDirectoryPath);
                }
            }
            if (!config.changesInfo || config.changesInfo.modulesChanged) {
                yield this.copyTnsModules(config.platform, config.platformData, config.projectData, config.appFilesUpdaterOptions, config.projectFilesConfig);
            }
        });
    }
    getPathToPlatformTemplate(selectedTemplate, frameworkPackageName, projectDir) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!selectedTemplate) {
                const nativescriptPlatformData = this.$projectDataService.getNSValue(projectDir, frameworkPackageName);
                selectedTemplate = nativescriptPlatformData && nativescriptPlatformData.template;
            }
            if (selectedTemplate) {
                const tempDir = temp.mkdirSync("platform-template");
                this.$fs.writeJson(path.join(tempDir, constants.PACKAGE_JSON_FILE_NAME), {});
                try {
                    const npmInstallResult = yield this.$npm.install(selectedTemplate, tempDir, {
                        disableNpmInstall: false,
                        frameworkPath: null,
                        ignoreScripts: false
                    });
                    const pathToTemplate = path.join(tempDir, constants.NODE_MODULES_FOLDER_NAME, npmInstallResult.name);
                    return { selectedTemplate, pathToTemplate };
                }
                catch (err) {
                    this.$logger.trace("Error while trying to install specified template: ", err);
                    this.$errors.failWithoutHelp(`Unable to install platform template ${selectedTemplate}. Make sure the specified value is valid.`);
                }
            }
            return null;
        });
    }
    copyTnsModules(platform, platformData, projectData, appFilesUpdaterOptions, projectFilesConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
            const lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath) ? this.$fs.getFsStats(appDestinationDirectoryPath).mtime : null;
            try {
                const absoluteOutputPath = path.join(appDestinationDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);
                yield this.$nodeModulesBuilder.prepareJSNodeModules({
                    absoluteOutputPath,
                    platform,
                    lastModifiedTime,
                    projectData,
                    appFilesUpdaterOptions,
                    projectFilesConfig
                });
            }
            catch (error) {
                this.$logger.debug(error);
                shell.rm("-rf", appDestinationDirectoryPath);
                this.$errors.failWithoutHelp(`Processing node_modules failed. ${error}`);
            }
        });
    }
}
__decorate([
    helpers_1.hook('prepareJSApp')
], PreparePlatformJSService.prototype, "preparePlatform", null);
exports.PreparePlatformJSService = PreparePlatformJSService;
$injector.register("preparePlatformJSService", PreparePlatformJSService);
