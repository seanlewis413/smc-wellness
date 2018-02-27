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
const semver = require("semver");
const constants = require("../constants");
class PluginsService {
    constructor($npm, $fs, $options, $logger, $errors, $injector) {
        this.$npm = $npm;
        this.$fs = $fs;
        this.$options = $options;
        this.$logger = $logger;
        this.$errors = $errors;
        this.$injector = $injector;
    }
    get $platformsData() {
        return this.$injector.resolve("platformsData");
    }
    get $pluginVariablesService() {
        return this.$injector.resolve("pluginVariablesService");
    }
    get $projectDataService() {
        return this.$injector.resolve("projectDataService");
    }
    get $projectFilesManager() {
        return this.$injector.resolve("projectFilesManager");
    }
    get npmInstallOptions() {
        return _.merge({
            disableNpmInstall: this.$options.disableNpmInstall,
            frameworkPath: this.$options.frameworkPath,
            ignoreScripts: this.$options.ignoreScripts,
            path: this.$options.path
        }, PluginsService.NPM_CONFIG);
    }
    add(plugin, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensure(projectData);
            const possiblePackageName = path.resolve(plugin);
            if (possiblePackageName.indexOf(".tgz") !== -1 && this.$fs.exists(possiblePackageName)) {
                plugin = possiblePackageName;
            }
            const name = (yield this.$npm.install(plugin, projectData.projectDir, this.npmInstallOptions)).name;
            const pathToRealNpmPackageJson = path.join(projectData.projectDir, "node_modules", name, "package.json");
            const realNpmPackageJson = this.$fs.readJson(pathToRealNpmPackageJson);
            if (realNpmPackageJson.nativescript) {
                const pluginData = this.convertToPluginData(realNpmPackageJson, projectData.projectDir);
                const action = (pluginDestinationPath, platform, platformData) => __awaiter(this, void 0, void 0, function* () {
                    this.isPluginDataValidForPlatform(pluginData, platform, projectData);
                });
                this.executeForAllInstalledPlatforms(action, projectData);
                try {
                    yield this.$pluginVariablesService.savePluginVariablesInProjectFile(pluginData, projectData);
                }
                catch (err) {
                    this.$projectDataService.removeNSProperty(projectData.projectDir, this.$pluginVariablesService.getPluginVariablePropertyName(pluginData.name));
                    yield this.$npm.uninstall(plugin, PluginsService.NPM_CONFIG, projectData.projectDir);
                    throw err;
                }
                this.$logger.out(`Successfully installed plugin ${realNpmPackageJson.name}.`);
            }
            else {
                yield this.$npm.uninstall(realNpmPackageJson.name, { save: true }, projectData.projectDir);
                this.$errors.failWithoutHelp(`${plugin} is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.`);
            }
        });
    }
    remove(pluginName, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const removePluginNativeCodeAction = (modulesDestinationPath, platform, platformData) => __awaiter(this, void 0, void 0, function* () {
                const pluginData = this.convertToPluginData(this.getNodeModuleData(pluginName, projectData.projectDir), projectData.projectDir);
                yield platformData.platformProjectService.removePluginNativeCode(pluginData, projectData);
            });
            this.$pluginVariablesService.removePluginVariablesFromProjectFile(pluginName.toLowerCase(), projectData);
            this.executeForAllInstalledPlatforms(removePluginNativeCodeAction, projectData);
            yield this.executeNpmCommand(PluginsService.UNINSTALL_COMMAND_NAME, pluginName, projectData);
            let showMessage = true;
            const action = (modulesDestinationPath, platform, platformData) => __awaiter(this, void 0, void 0, function* () {
                shelljs.rm("-rf", path.join(modulesDestinationPath, pluginName));
                this.$logger.out(`Successfully removed plugin ${pluginName} for ${platform}.`);
                showMessage = false;
            });
            this.executeForAllInstalledPlatforms(action, projectData);
            if (showMessage) {
                this.$logger.out(`Successfully removed plugin ${pluginName}`);
            }
        });
    }
    validate(platformData, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield platformData.platformProjectService.validatePlugins(projectData);
        });
    }
    prepare(dependencyData, platform, projectData, projectFilesConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            platform = platform.toLowerCase();
            const platformData = this.$platformsData.getPlatformData(platform, projectData);
            const pluginData = this.convertToPluginData(dependencyData, projectData.projectDir);
            const appFolderExists = this.$fs.exists(path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME));
            if (appFolderExists) {
                this.preparePluginScripts(pluginData, platform, projectData, projectFilesConfig);
                yield this.preparePluginNativeCode(pluginData, platform, projectData);
                this.$logger.out(`Successfully prepared plugin ${pluginData.name} for ${platform}.`);
            }
        });
    }
    preparePluginScripts(pluginData, platform, projectData, projectFilesConfig) {
        const platformData = this.$platformsData.getPlatformData(platform, projectData);
        const pluginScriptsDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, "tns_modules");
        const scriptsDestinationExists = this.$fs.exists(pluginScriptsDestinationPath);
        if (!scriptsDestinationExists) {
            return;
        }
        if (!this.isPluginDataValidForPlatform(pluginData, platform, projectData)) {
            return;
        }
        this.$projectFilesManager.processPlatformSpecificFiles(pluginScriptsDestinationPath, platform, projectFilesConfig);
    }
    preparePluginNativeCode(pluginData, platform, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const platformData = this.$platformsData.getPlatformData(platform, projectData);
            pluginData.pluginPlatformsFolderPath = (_platform) => path.join(pluginData.fullPath, "platforms", _platform);
            yield platformData.platformProjectService.preparePluginNativeCode(pluginData, projectData);
        });
    }
    ensureAllDependenciesAreInstalled(projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            let installedDependencies = this.$fs.exists(this.getNodeModulesPath(projectData.projectDir)) ? this.$fs.readDirectory(this.getNodeModulesPath(projectData.projectDir)) : [];
            _(installedDependencies)
                .filter(dependencyName => _.startsWith(dependencyName, "@"))
                .each(scopedDependencyDir => {
                const contents = this.$fs.readDirectory(path.join(this.getNodeModulesPath(projectData.projectDir), scopedDependencyDir));
                installedDependencies = installedDependencies.concat(contents.map(dependencyName => `${scopedDependencyDir}/${dependencyName}`));
            });
            const packageJsonContent = this.$fs.readJson(this.getPackageJsonFilePath(projectData.projectDir));
            const allDependencies = _.keys(packageJsonContent.dependencies).concat(_.keys(packageJsonContent.devDependencies));
            const notInstalledDependencies = _.difference(allDependencies, installedDependencies);
            if (this.$options.force || notInstalledDependencies.length) {
                this.$logger.trace("Npm install will be called from CLI. Force option is: ", this.$options.force, " Not installed dependencies are: ", notInstalledDependencies);
                yield this.$npm.install(projectData.projectDir, projectData.projectDir, {
                    disableNpmInstall: this.$options.disableNpmInstall,
                    frameworkPath: this.$options.frameworkPath,
                    ignoreScripts: this.$options.ignoreScripts,
                    path: this.$options.path
                });
            }
        });
    }
    getAllInstalledPlugins(projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeModules = (yield this.getAllInstalledModules(projectData)).map(nodeModuleData => this.convertToPluginData(nodeModuleData, projectData.projectDir));
            return _.filter(nodeModules, nodeModuleData => nodeModuleData && nodeModuleData.isPlugin);
        });
    }
    getDependenciesFromPackageJson(projectDir) {
        const packageJson = this.$fs.readJson(this.getPackageJsonFilePath(projectDir));
        const dependencies = this.getBasicPluginInformation(packageJson.dependencies);
        const devDependencies = this.getBasicPluginInformation(packageJson.devDependencies);
        return {
            dependencies,
            devDependencies
        };
    }
    getBasicPluginInformation(dependencies) {
        return _.map(dependencies, (version, key) => ({
            name: key,
            version: version
        }));
    }
    getNodeModulesPath(projectDir) {
        return path.join(projectDir, "node_modules");
    }
    getPackageJsonFilePath(projectDir) {
        return path.join(projectDir, "package.json");
    }
    getPackageJsonFilePathForModule(moduleName, projectDir) {
        return path.join(this.getNodeModulesPath(projectDir), moduleName, "package.json");
    }
    getDependencies(projectDir) {
        const packageJsonFilePath = this.getPackageJsonFilePath(projectDir);
        return _.keys(require(packageJsonFilePath).dependencies);
    }
    getNodeModuleData(module, projectDir) {
        if (!this.$fs.exists(module) || path.basename(module) !== "package.json") {
            module = this.getPackageJsonFilePathForModule(module, projectDir);
        }
        const data = this.$fs.readJson(module);
        return {
            name: data.name,
            version: data.version,
            fullPath: path.dirname(module),
            isPlugin: data.nativescript !== undefined,
            moduleInfo: data.nativescript
        };
    }
    convertToPluginData(cacheData, projectDir) {
        const pluginData = {};
        pluginData.name = cacheData.name;
        pluginData.version = cacheData.version;
        pluginData.fullPath = cacheData.directory || path.dirname(this.getPackageJsonFilePathForModule(cacheData.name, projectDir));
        pluginData.isPlugin = !!cacheData.nativescript || !!cacheData.moduleInfo;
        pluginData.pluginPlatformsFolderPath = (platform) => path.join(pluginData.fullPath, "platforms", platform);
        const data = cacheData.nativescript || cacheData.moduleInfo;
        if (pluginData.isPlugin) {
            pluginData.platformsData = data.platforms;
            pluginData.pluginVariables = data.variables;
        }
        return pluginData;
    }
    ensure(projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureAllDependenciesAreInstalled(projectData);
            this.$fs.ensureDirectoryExists(this.getNodeModulesPath(projectData.projectDir));
        });
    }
    getAllInstalledModules(projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensure(projectData);
            const nodeModules = this.getDependencies(projectData.projectDir);
            return _.map(nodeModules, nodeModuleName => this.getNodeModuleData(nodeModuleName, projectData.projectDir));
        });
    }
    executeNpmCommand(npmCommandName, npmCommandArguments, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (npmCommandName === PluginsService.INSTALL_COMMAND_NAME) {
                yield this.$npm.install(npmCommandArguments, projectData.projectDir, this.npmInstallOptions);
            }
            else if (npmCommandName === PluginsService.UNINSTALL_COMMAND_NAME) {
                yield this.$npm.uninstall(npmCommandArguments, PluginsService.NPM_CONFIG, projectData.projectDir);
            }
            return this.parseNpmCommandResult(npmCommandArguments);
        });
    }
    parseNpmCommandResult(npmCommandResult) {
        return npmCommandResult.split("@")[0];
    }
    executeForAllInstalledPlatforms(action, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const availablePlatforms = _.keys(this.$platformsData.availablePlatforms);
            for (const platform of availablePlatforms) {
                const isPlatformInstalled = this.$fs.exists(path.join(projectData.platformsDir, platform.toLowerCase()));
                if (isPlatformInstalled) {
                    const platformData = this.$platformsData.getPlatformData(platform.toLowerCase(), projectData);
                    const pluginDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, "tns_modules");
                    yield action(pluginDestinationPath, platform.toLowerCase(), platformData);
                }
            }
        });
    }
    getInstalledFrameworkVersion(platform, projectData) {
        const platformData = this.$platformsData.getPlatformData(platform, projectData);
        const frameworkData = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
        return frameworkData.version;
    }
    isPluginDataValidForPlatform(pluginData, platform, projectData) {
        let isValid = true;
        const installedFrameworkVersion = this.getInstalledFrameworkVersion(platform, projectData);
        const pluginPlatformsData = pluginData.platformsData;
        if (pluginPlatformsData) {
            const pluginVersion = pluginPlatformsData[platform];
            if (!pluginVersion) {
                this.$logger.warn(`${pluginData.name} is not supported for ${platform}.`);
                isValid = false;
            }
            else if (semver.gt(pluginVersion, installedFrameworkVersion)) {
                this.$logger.warn(`${pluginData.name} ${pluginVersion} for ${platform} is not compatible with the currently installed framework version ${installedFrameworkVersion}.`);
                isValid = false;
            }
        }
        return isValid;
    }
}
PluginsService.INSTALL_COMMAND_NAME = "install";
PluginsService.UNINSTALL_COMMAND_NAME = "uninstall";
PluginsService.NPM_CONFIG = {
    save: true
};
exports.PluginsService = PluginsService;
$injector.register("pluginsService", PluginsService);
