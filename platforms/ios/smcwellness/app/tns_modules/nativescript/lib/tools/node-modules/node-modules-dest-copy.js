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
const path = require("path");
const shelljs = require("shelljs");
const constants = require("../../constants");
const minimatch = require("minimatch");
class TnsModulesCopy {
    constructor(outputRoot, $options, $fs) {
        this.outputRoot = outputRoot;
        this.$options = $options;
        this.$fs = $fs;
    }
    copyModules(dependencies, platform) {
        for (const entry in dependencies) {
            const dependency = dependencies[entry];
            this.copyDependencyDir(dependency);
            if (dependency.name === constants.TNS_CORE_MODULES_NAME) {
                const tnsCoreModulesResourcePath = path.join(this.outputRoot, constants.TNS_CORE_MODULES_NAME);
                const allFiles = this.$fs.enumerateFilesInDirectorySync(tnsCoreModulesResourcePath);
                const matchPattern = this.$options.release ? "**/*.ts" : "**/*.d.ts";
                allFiles.filter(file => minimatch(file, matchPattern, { nocase: true })).map(file => this.$fs.deleteFile(file));
                shelljs.rm("-rf", path.join(tnsCoreModulesResourcePath, constants.NODE_MODULES_FOLDER_NAME));
            }
        }
    }
    copyDependencyDir(dependency) {
        if (dependency.depth === 0) {
            const targetPackageDir = path.join(this.outputRoot, dependency.name);
            shelljs.mkdir("-p", targetPackageDir);
            const isScoped = dependency.name.indexOf("@") === 0;
            const destinationPath = isScoped ? path.join(this.outputRoot, dependency.name.substring(0, dependency.name.indexOf("/"))) : this.outputRoot;
            shelljs.cp("-RfL", dependency.directory, destinationPath);
            shelljs.rm("-rf", path.join(targetPackageDir, "platforms"));
            this.removeNonProductionDependencies(dependency, targetPackageDir);
        }
    }
    removeNonProductionDependencies(dependency, targetPackageDir) {
        const packageJsonFilePath = path.join(dependency.directory, constants.PACKAGE_JSON_FILE_NAME);
        if (!this.$fs.exists(packageJsonFilePath)) {
            return;
        }
        const packageJsonContent = this.$fs.readJson(packageJsonFilePath);
        const productionDependencies = packageJsonContent.dependencies;
        const dependenciesFolder = path.join(targetPackageDir, constants.NODE_MODULES_FOLDER_NAME);
        if (this.$fs.exists(dependenciesFolder)) {
            const dependencies = _.flatten(this.$fs.readDirectory(dependenciesFolder)
                .map(dir => {
                if (_.startsWith(dir, "@")) {
                    const pathToDir = path.join(dependenciesFolder, dir);
                    const contents = this.$fs.readDirectory(pathToDir);
                    return _.map(contents, subDir => `${dir}/${subDir}`);
                }
                return dir;
            }));
            dependencies.filter(dir => !productionDependencies || !productionDependencies.hasOwnProperty(dir))
                .forEach(dir => shelljs.rm("-rf", path.join(dependenciesFolder, dir)));
        }
    }
}
exports.TnsModulesCopy = TnsModulesCopy;
class NpmPluginPrepare {
    constructor($fs, $pluginsService, $platformsData, $logger) {
        this.$fs = $fs;
        this.$pluginsService = $pluginsService;
        this.$platformsData = $platformsData;
        this.$logger = $logger;
    }
    beforePrepare(dependencies, platform, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.$platformsData.getPlatformData(platform, projectData).platformProjectService.beforePrepareAllPlugins(projectData, dependencies);
        });
    }
    afterPrepare(dependencies, platform, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.$platformsData.getPlatformData(platform, projectData).platformProjectService.afterPrepareAllPlugins(projectData);
            this.writePreparedDependencyInfo(dependencies, platform, projectData);
        });
    }
    writePreparedDependencyInfo(dependencies, platform, projectData) {
        const prepareData = {};
        _.each(dependencies, d => {
            prepareData[d.name] = true;
        });
        this.$fs.createDirectory(this.preparedPlatformsDir(platform, projectData));
        this.$fs.writeJson(this.preparedPlatformsFile(platform, projectData), prepareData, "    ", "utf8");
    }
    preparedPlatformsDir(platform, projectData) {
        const platformRoot = this.$platformsData.getPlatformData(platform, projectData).projectRoot;
        if (/android/i.test(platform)) {
            return path.join(platformRoot, "build", "intermediates");
        }
        else if (/ios/i.test(platform)) {
            return path.join(platformRoot, "build");
        }
        else {
            throw new Error("Invalid platform: " + platform);
        }
    }
    preparedPlatformsFile(platform, projectData) {
        return path.join(this.preparedPlatformsDir(platform, projectData), "prepared-platforms.json");
    }
    getPreviouslyPreparedDependencies(platform, projectData) {
        if (!this.$fs.exists(this.preparedPlatformsFile(platform, projectData))) {
            return {};
        }
        return this.$fs.readJson(this.preparedPlatformsFile(platform, projectData), "utf8");
    }
    allPrepared(dependencies, platform, projectData) {
        let result = true;
        const previouslyPrepared = this.getPreviouslyPreparedDependencies(platform, projectData);
        _.each(dependencies, d => {
            if (!previouslyPrepared[d.name]) {
                result = false;
            }
        });
        return result;
    }
    preparePlugins(dependencies, platform, projectData, projectFilesConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (_.isEmpty(dependencies) || this.allPrepared(dependencies, platform, projectData)) {
                return;
            }
            yield this.beforePrepare(dependencies, platform, projectData);
            for (const dependencyKey in dependencies) {
                const dependency = dependencies[dependencyKey];
                const isPlugin = !!dependency.nativescript;
                if (isPlugin) {
                    const pluginData = this.$pluginsService.convertToPluginData(dependency, projectData.projectDir);
                    yield this.$pluginsService.preparePluginNativeCode(pluginData, platform, projectData);
                }
            }
            yield this.afterPrepare(dependencies, platform, projectData);
        });
    }
    prepareJSPlugins(dependencies, platform, projectData, projectFilesConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (_.isEmpty(dependencies) || this.allPrepared(dependencies, platform, projectData)) {
                return;
            }
            for (const dependencyKey in dependencies) {
                const dependency = dependencies[dependencyKey];
                const isPlugin = !!dependency.nativescript;
                if (isPlugin) {
                    platform = platform.toLowerCase();
                    const pluginData = this.$pluginsService.convertToPluginData(dependency, projectData.projectDir);
                    const platformData = this.$platformsData.getPlatformData(platform, projectData);
                    const appFolderExists = this.$fs.exists(path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME));
                    if (appFolderExists) {
                        this.$pluginsService.preparePluginScripts(pluginData, platform, projectData, projectFilesConfig);
                        this.$logger.out(`Successfully prepared plugin ${pluginData.name} for ${platform}.`);
                    }
                }
            }
        });
    }
}
exports.NpmPluginPrepare = NpmPluginPrepare;
