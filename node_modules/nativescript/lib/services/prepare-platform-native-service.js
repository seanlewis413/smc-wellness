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
const constants = require("../constants");
const path = require("path");
const shell = require("shelljs");
const prepare_platform_service_1 = require("./prepare-platform-service");
class PreparePlatformNativeService extends prepare_platform_service_1.PreparePlatformService {
    constructor($fs, $xmlValidator, $hooksService, $nodeModulesBuilder, $pluginsService, $projectChangesService) {
        super($fs, $hooksService, $xmlValidator);
        this.$nodeModulesBuilder = $nodeModulesBuilder;
        this.$pluginsService = $pluginsService;
        this.$projectChangesService = $projectChangesService;
    }
    addPlatform(info) {
        return __awaiter(this, void 0, void 0, function* () {
            yield info.platformData.platformProjectService.createProject(path.resolve(info.frameworkDir), info.installedVersion, info.projectData, info.config);
            info.platformData.platformProjectService.ensureConfigurationFileInAppResources(info.projectData);
            yield info.platformData.platformProjectService.interpolateData(info.projectData, info.config);
            info.platformData.platformProjectService.afterCreateProject(info.platformData.projectRoot, info.projectData);
        });
    }
    preparePlatform(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (config.changesInfo.hasChanges) {
                yield this.cleanProject(config.platform, config.appFilesUpdaterOptions, config.platformData, config.projectData);
            }
            if (!config.changesInfo || config.changesInfo.changesRequirePrepare || config.appFilesUpdaterOptions.bundle) {
                this.copyAppResources(config.platformData, config.projectData);
                yield config.platformData.platformProjectService.prepareProject(config.projectData, config.platformSpecificData);
            }
            if (!config.changesInfo || config.changesInfo.modulesChanged || config.appFilesUpdaterOptions.bundle) {
                yield this.$pluginsService.validate(config.platformData, config.projectData);
                const appDestinationDirectoryPath = path.join(config.platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
                const lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath) ? this.$fs.getFsStats(appDestinationDirectoryPath).mtime : null;
                const tnsModulesDestinationPath = path.join(appDestinationDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);
                const nodeModulesData = {
                    absoluteOutputPath: tnsModulesDestinationPath,
                    appFilesUpdaterOptions: config.appFilesUpdaterOptions,
                    lastModifiedTime,
                    platform: config.platform,
                    projectData: config.projectData,
                    projectFilesConfig: config.projectFilesConfig
                };
                yield this.$nodeModulesBuilder.prepareNodeModules(nodeModulesData);
            }
            if (!config.changesInfo || config.changesInfo.configChanged || config.changesInfo.modulesChanged) {
                yield config.platformData.platformProjectService.processConfigurationFilesFromAppResources(config.appFilesUpdaterOptions.release, config.projectData);
            }
            config.platformData.platformProjectService.interpolateConfigurationFile(config.projectData, config.platformSpecificData);
            this.$projectChangesService.setNativePlatformStatus(config.platform, config.projectData, { nativePlatformStatus: "3" });
        });
    }
    copyAppResources(platformData, projectData) {
        const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
        const appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);
        if (this.$fs.exists(appResourcesDirectoryPath)) {
            platformData.platformProjectService.prepareAppResources(appResourcesDirectoryPath, projectData);
            const appResourcesDestination = platformData.platformProjectService.getAppResourcesDestinationDirectoryPath(projectData);
            this.$fs.ensureDirectoryExists(appResourcesDestination);
            shell.cp("-Rf", path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName, "*"), appResourcesDestination);
            this.$fs.deleteDirectory(appResourcesDirectoryPath);
        }
    }
    cleanProject(platform, appFilesUpdaterOptions, platformData, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (platform.toLowerCase() !== "android") {
                return;
            }
            const previousPrepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
            if (!previousPrepareInfo) {
                return;
            }
            const { release: previousWasRelease, bundle: previousWasBundle } = previousPrepareInfo;
            const { release: currentIsRelease, bundle: currentIsBundle } = appFilesUpdaterOptions;
            if ((previousWasRelease !== currentIsRelease) || (previousWasBundle !== currentIsBundle)) {
                yield platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
            }
        });
    }
}
exports.PreparePlatformNativeService = PreparePlatformNativeService;
$injector.register("preparePlatformNativeService", PreparePlatformNativeService);
