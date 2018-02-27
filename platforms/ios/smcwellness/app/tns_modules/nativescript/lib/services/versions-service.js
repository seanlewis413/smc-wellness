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
const constants = require("../constants");
const semver = require("semver");
const path = require("path");
const helpers_1 = require("../common/helpers");
class VersionsService {
    constructor($fs, $npmInstallationManager, $injector, $staticConfig, $pluginsService, $logger) {
        this.$fs = $fs;
        this.$npmInstallationManager = $npmInstallationManager;
        this.$injector = $injector;
        this.$staticConfig = $staticConfig;
        this.$pluginsService = $pluginsService;
        this.$logger = $logger;
        this.projectData = this.getProjectData();
    }
    getNativescriptCliVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentCliVersion = this.$staticConfig.version;
            const latestCliVersion = yield this.$npmInstallationManager.getLatestVersion(constants.NATIVESCRIPT_KEY_NAME);
            return {
                componentName: constants.NATIVESCRIPT_KEY_NAME,
                currentVersion: currentCliVersion,
                latestVersion: latestCliVersion
            };
        });
    }
    getTnsCoreModulesVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const latestTnsCoreModulesVersion = yield this.$npmInstallationManager.getLatestVersion(constants.TNS_CORE_MODULES_NAME);
            const nativescriptCoreModulesInfo = {
                componentName: constants.TNS_CORE_MODULES_NAME,
                latestVersion: latestTnsCoreModulesVersion
            };
            if (this.projectData) {
                const nodeModulesPath = path.join(this.projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME);
                const tnsCoreModulesPath = path.join(nodeModulesPath, constants.TNS_CORE_MODULES_NAME);
                if (!this.$fs.exists(nodeModulesPath) ||
                    !this.$fs.exists(tnsCoreModulesPath)) {
                    yield this.$pluginsService.ensureAllDependenciesAreInstalled(this.projectData);
                }
                const currentTnsCoreModulesVersion = this.$fs.readJson(path.join(tnsCoreModulesPath, constants.PACKAGE_JSON_FILE_NAME)).version;
                nativescriptCoreModulesInfo.currentVersion = currentTnsCoreModulesVersion;
            }
            return nativescriptCoreModulesInfo;
        });
    }
    getRuntimesVersions() {
        return __awaiter(this, void 0, void 0, function* () {
            const runtimes = [
                constants.TNS_ANDROID_RUNTIME_NAME,
                constants.TNS_IOS_RUNTIME_NAME
            ];
            let projectConfig;
            if (this.projectData) {
                projectConfig = this.$fs.readJson(this.projectData.projectFilePath);
            }
            const runtimesVersions = yield Promise.all(runtimes.map((runtime) => __awaiter(this, void 0, void 0, function* () {
                const latestRuntimeVersion = yield this.$npmInstallationManager.getLatestVersion(runtime);
                const runtimeInformation = {
                    componentName: runtime,
                    latestVersion: latestRuntimeVersion
                };
                if (projectConfig) {
                    const projectRuntimeInformation = projectConfig.nativescript && projectConfig.nativescript[runtime];
                    if (projectRuntimeInformation) {
                        const runtimeVersionInProject = projectRuntimeInformation.version;
                        runtimeInformation.currentVersion = runtimeVersionInProject;
                    }
                }
                return runtimeInformation;
            })));
            return runtimesVersions;
        });
    }
    checkComponentsForUpdate() {
        return __awaiter(this, void 0, void 0, function* () {
            const allComponents = yield this.getAllComponentsVersions();
            const componentsForUpdate = [];
            _.forEach(allComponents, (component) => {
                if (component.currentVersion && this.hasUpdate(component)) {
                    componentsForUpdate.push(component);
                }
            });
            this.printVersionsInformation(componentsForUpdate, allComponents);
        });
    }
    printVersionsInformation(versionsInformation, allComponents) {
        if (versionsInformation && versionsInformation.length) {
            const table = this.createTableWithVersionsInformation(versionsInformation);
            this.$logger.warn("Updates available");
            this.$logger.out(table.toString() + os_1.EOL);
        }
        else {
            this.$logger.out(`Your components are up-to-date: ${os_1.EOL}${allComponents.map(component => component.componentName)}${os_1.EOL}`);
        }
    }
    getAllComponentsVersions() {
        return __awaiter(this, void 0, void 0, function* () {
            let allComponents = [];
            const nativescriptCliInformation = yield this.getNativescriptCliVersion();
            if (nativescriptCliInformation) {
                allComponents.push(nativescriptCliInformation);
            }
            const nativescriptCoreModulesInformation = yield this.getTnsCoreModulesVersion();
            if (nativescriptCoreModulesInformation) {
                allComponents.push(nativescriptCoreModulesInformation);
            }
            const runtimesVersions = yield this.getRuntimesVersions();
            allComponents = allComponents.concat(runtimesVersions);
            return allComponents;
        });
    }
    createTableWithVersionsInformation(versionsInformation) {
        const headers = ["Component", "Current version", "Latest version", "Information"];
        const data = [];
        _.forEach(versionsInformation, (componentInformation) => {
            const row = [
                componentInformation.componentName,
                componentInformation.currentVersion,
                componentInformation.latestVersion
            ];
            if (componentInformation.currentVersion) {
                semver.lt(componentInformation.currentVersion, componentInformation.latestVersion) ? row.push(VersionsService.UPDATE_AVAILABLE_MESSAGE) : row.push(VersionsService.UP_TO_DATE_MESSAGE);
            }
            else {
                row.push(VersionsService.NOT_INSTALLED_MESSAGE);
            }
            data.push(row);
        });
        return helpers_1.createTable(headers, data);
    }
    getProjectData() {
        try {
            const projectData = this.$injector.resolve("projectData");
            projectData.initializeProjectData();
            return projectData;
        }
        catch (error) {
            return null;
        }
    }
    hasUpdate(component) {
        return semver.lt(component.currentVersion, component.latestVersion);
    }
}
VersionsService.UP_TO_DATE_MESSAGE = "Up to date".green.toString();
VersionsService.UPDATE_AVAILABLE_MESSAGE = "Update available".yellow.toString();
VersionsService.NOT_INSTALLED_MESSAGE = "Not installed".grey.toString();
$injector.register("versionsService", VersionsService);
