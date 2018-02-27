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
const path = require("path");
const shell = require("shelljs");
const constants = require("../constants");
const constants_1 = require("../common/constants");
const helpers = require("../common/helpers");
const semver = require("semver");
const events_1 = require("events");
const app_files_updater_1 = require("./app-files-updater");
const helpers_1 = require("../common/helpers");
const temp = require("temp");
temp.track();
const buildInfoFileName = ".nsbuildinfo";
class PlatformService extends events_1.EventEmitter {
    constructor($devicesService, $preparePlatformNativeService, $preparePlatformJSService, $progressIndicator, $errors, $fs, $logger, $npmInstallationManager, $platformsData, $projectDataService, $hooksService, $pluginsService, $projectFilesManager, $mobileHelper, $hostInfo, $devicePathProvider, $npm, $devicePlatformsConstants, $projectChangesService, $analyticsService) {
        super();
        this.$devicesService = $devicesService;
        this.$preparePlatformNativeService = $preparePlatformNativeService;
        this.$preparePlatformJSService = $preparePlatformJSService;
        this.$progressIndicator = $progressIndicator;
        this.$errors = $errors;
        this.$fs = $fs;
        this.$logger = $logger;
        this.$npmInstallationManager = $npmInstallationManager;
        this.$platformsData = $platformsData;
        this.$projectDataService = $projectDataService;
        this.$hooksService = $hooksService;
        this.$pluginsService = $pluginsService;
        this.$projectFilesManager = $projectFilesManager;
        this.$mobileHelper = $mobileHelper;
        this.$hostInfo = $hostInfo;
        this.$devicePathProvider = $devicePathProvider;
        this.$npm = $npm;
        this.$devicePlatformsConstants = $devicePlatformsConstants;
        this.$projectChangesService = $projectChangesService;
        this.$analyticsService = $analyticsService;
        this._trackedProjectFilePath = null;
    }
    get _hooksService() {
        return this.$hooksService;
    }
    cleanPlatforms(platforms, platformTemplate, projectData, config, framworkPath) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const platform of platforms) {
                const version = this.getCurrentPlatformVersion(platform, projectData);
                let platformWithVersion = platform;
                if (version !== undefined) {
                    platformWithVersion += "@" + version;
                }
                yield this.removePlatforms([platform], projectData);
                yield this.addPlatforms([platformWithVersion], platformTemplate, projectData, config);
            }
        });
    }
    addPlatforms(platforms, platformTemplate, projectData, config, frameworkPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const platformsDir = projectData.platformsDir;
            this.$fs.ensureDirectoryExists(platformsDir);
            for (const platform of platforms) {
                this.validatePlatform(platform, projectData);
                const platformPath = path.join(projectData.platformsDir, platform);
                if (this.$fs.exists(platformPath)) {
                    this.$errors.failWithoutHelp(`Platform ${platform} already added`);
                }
                yield this.addPlatform(platform.toLowerCase(), platformTemplate, projectData, config, frameworkPath);
            }
        });
    }
    getCurrentPlatformVersion(platform, projectData) {
        const platformData = this.$platformsData.getPlatformData(platform, projectData);
        const currentPlatformData = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
        let version;
        if (currentPlatformData && currentPlatformData[constants.VERSION_STRING]) {
            version = currentPlatformData[constants.VERSION_STRING];
        }
        return version;
    }
    addPlatform(platformParam, platformTemplate, projectData, config, frameworkPath, nativePrepare) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = platformParam.split("@");
            const platform = data[0].toLowerCase();
            let version = data[1];
            const platformData = this.$platformsData.getPlatformData(platform, projectData);
            if (version === undefined) {
                version = this.getCurrentPlatformVersion(platform, projectData);
            }
            this.$logger.trace("Creating NativeScript project for the %s platform", platform);
            this.$logger.trace("Path: %s", platformData.projectRoot);
            this.$logger.trace("Package: %s", projectData.projectId);
            this.$logger.trace("Name: %s", projectData.projectName);
            this.$logger.out("Copying template files...");
            let packageToInstall = "";
            const npmOptions = {
                pathToSave: path.join(projectData.platformsDir, platform),
                dependencyType: "save"
            };
            if (!frameworkPath) {
                packageToInstall = platformData.frameworkPackageName;
                npmOptions["version"] = version;
            }
            const spinner = this.$progressIndicator.getSpinner("Installing " + packageToInstall);
            const projectDir = projectData.projectDir;
            const platformPath = path.join(projectData.platformsDir, platform);
            try {
                spinner.start();
                const downloadedPackagePath = yield this.$npmInstallationManager.install(packageToInstall, projectDir, npmOptions);
                let frameworkDir = path.join(downloadedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME);
                frameworkDir = path.resolve(frameworkDir);
                const coreModuleName = yield this.addPlatformCore(platformData, frameworkDir, platformTemplate, projectData, config, nativePrepare);
                yield this.$npm.uninstall(coreModuleName, { save: true }, projectData.projectDir);
            }
            catch (err) {
                this.$fs.deleteDirectory(platformPath);
                throw err;
            }
            finally {
                spinner.stop();
            }
            this.$fs.ensureDirectoryExists(platformPath);
            this.$logger.out("Project successfully created.");
        });
    }
    addPlatformCore(platformData, frameworkDir, platformTemplate, projectData, config, nativePrepare) {
        return __awaiter(this, void 0, void 0, function* () {
            const coreModuleData = this.$fs.readJson(path.join(frameworkDir, "..", "package.json"));
            const installedVersion = coreModuleData.version;
            yield this.$preparePlatformJSService.addPlatform({
                platformData,
                frameworkDir,
                installedVersion,
                projectData,
                config,
                platformTemplate
            });
            if (!nativePrepare || !nativePrepare.skipNativePrepare) {
                const platformDir = path.join(projectData.platformsDir, platformData.normalizedPlatformName.toLowerCase());
                this.$fs.deleteDirectory(platformDir);
                yield this.$preparePlatformNativeService.addPlatform({
                    platformData,
                    frameworkDir,
                    installedVersion,
                    projectData,
                    config
                });
            }
            const coreModuleName = coreModuleData.name;
            return coreModuleName;
        });
    }
    getInstalledPlatforms(projectData) {
        if (!this.$fs.exists(projectData.platformsDir)) {
            return [];
        }
        const subDirs = this.$fs.readDirectory(projectData.platformsDir);
        return _.filter(subDirs, p => this.$platformsData.platformsNames.indexOf(p) > -1);
    }
    getAvailablePlatforms(projectData) {
        const installedPlatforms = this.getInstalledPlatforms(projectData);
        return _.filter(this.$platformsData.platformsNames, p => {
            return installedPlatforms.indexOf(p) < 0 && this.isPlatformSupportedForOS(p, projectData);
        });
    }
    getPreparedPlatforms(projectData) {
        return _.filter(this.$platformsData.platformsNames, p => { return this.isPlatformPrepared(p, projectData); });
    }
    preparePlatform(platformInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const platformData = this.$platformsData.getPlatformData(platformInfo.platform, platformInfo.projectData);
            const changesInfo = yield this.initialPrepare(platformInfo.platform, platformData, platformInfo.appFilesUpdaterOptions, platformInfo.platformTemplate, platformInfo.projectData, platformInfo.config, platformInfo.nativePrepare);
            const requiresNativePrepare = (!platformInfo.nativePrepare || !platformInfo.nativePrepare.skipNativePrepare) && changesInfo.nativePlatformStatus === "2";
            if (changesInfo.hasChanges || platformInfo.appFilesUpdaterOptions.bundle || requiresNativePrepare) {
                if (changesInfo.bundleChanged || platformInfo.appFilesUpdaterOptions.bundle) {
                    yield this.cleanDestinationApp(platformInfo);
                }
                yield this.preparePlatformCore(platformInfo.platform, platformInfo.appFilesUpdaterOptions, platformInfo.projectData, platformInfo.config, platformInfo.env, changesInfo, platformInfo.filesToSync, platformInfo.nativePrepare);
                this.$projectChangesService.savePrepareInfo(platformInfo.platform, platformInfo.projectData);
            }
            else {
                this.$logger.out("Skipping prepare.");
            }
            return true;
        });
    }
    validateOptions(provision, teamId, projectData, platform) {
        return __awaiter(this, void 0, void 0, function* () {
            if (platform) {
                platform = this.$mobileHelper.normalizePlatformName(platform);
                this.$logger.trace("Validate options for platform: " + platform);
                const platformData = this.$platformsData.getPlatformData(platform, projectData);
                return yield platformData.platformProjectService.validateOptions(projectData.projectId, provision, teamId);
            }
            else {
                let valid = true;
                for (const availablePlatform in this.$platformsData.availablePlatforms) {
                    this.$logger.trace("Validate options for platform: " + availablePlatform);
                    const platformData = this.$platformsData.getPlatformData(availablePlatform, projectData);
                    valid = valid && (yield platformData.platformProjectService.validateOptions(projectData.projectId, provision, teamId));
                }
                return valid;
            }
        });
    }
    initialPrepare(platform, platformData, appFilesUpdaterOptions, platformTemplate, projectData, config, nativePrepare) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validatePlatform(platform, projectData);
            yield this.trackProjectType(projectData);
            try {
                yield this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
            }
            catch (err) {
                this.$logger.trace(err);
                this.$errors.failWithoutHelp(`Unable to install dependencies. Make sure your package.json is valid and all dependencies are correct. Error is: ${err.message}`);
            }
            yield this.ensurePlatformInstalled(platform, platformTemplate, projectData, config, nativePrepare);
            const bundle = appFilesUpdaterOptions.bundle;
            const nativePlatformStatus = (nativePrepare && nativePrepare.skipNativePrepare) ? "1" : "2";
            const changesInfo = yield this.$projectChangesService.checkForChanges(platform, projectData, { bundle, release: appFilesUpdaterOptions.release, provision: config.provision, teamId: config.teamId, nativePlatformStatus });
            this.$logger.trace("Changes info in prepare platform:", changesInfo);
            return changesInfo;
        });
    }
    preparePlatformCore(platform, appFilesUpdaterOptions, projectData, platformSpecificData, env, changesInfo, filesToSync, nativePrepare) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.out("Preparing project...");
            const platformData = this.$platformsData.getPlatformData(platform, projectData);
            const projectFilesConfig = helpers.getProjectFilesConfig({ isReleaseBuild: appFilesUpdaterOptions.release });
            yield this.$preparePlatformJSService.preparePlatform({
                platform,
                platformData,
                projectFilesConfig,
                appFilesUpdaterOptions,
                projectData,
                platformSpecificData,
                changesInfo,
                filesToSync,
                env
            });
            if (!nativePrepare || !nativePrepare.skipNativePrepare) {
                yield this.$preparePlatformNativeService.preparePlatform({
                    platform,
                    platformData,
                    appFilesUpdaterOptions,
                    projectData,
                    platformSpecificData,
                    changesInfo,
                    filesToSync,
                    projectFilesConfig,
                    env
                });
            }
            const directoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
            const excludedDirs = [constants.APP_RESOURCES_FOLDER_NAME];
            if (!changesInfo || !changesInfo.modulesChanged) {
                excludedDirs.push(constants.TNS_MODULES_FOLDER_NAME);
            }
            this.$projectFilesManager.processPlatformSpecificFiles(directoryPath, platform, projectFilesConfig, excludedDirs);
            this.$logger.out(`Project successfully prepared (${platform})`);
        });
    }
    shouldBuild(platform, projectData, buildConfig, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.$projectChangesService.currentChanges.changesRequireBuild) {
                return true;
            }
            const platformData = this.$platformsData.getPlatformData(platform, projectData);
            const forDevice = !buildConfig || buildConfig.buildForDevice;
            outputPath = outputPath || (forDevice ? platformData.deviceBuildOutputPath : platformData.emulatorBuildOutputPath || platformData.deviceBuildOutputPath);
            if (!this.$fs.exists(outputPath)) {
                return true;
            }
            const packageNames = platformData.getValidPackageNames({ isForDevice: forDevice });
            const packages = this.getApplicationPackages(outputPath, packageNames);
            if (packages.length === 0) {
                return true;
            }
            const prepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
            const buildInfo = this.getBuildInfo(platform, platformData, buildConfig, outputPath);
            if (!prepareInfo || !buildInfo) {
                return true;
            }
            if (buildConfig.clean) {
                return true;
            }
            if (prepareInfo.time === buildInfo.prepareTime) {
                return false;
            }
            return prepareInfo.changesRequireBuildTime !== buildInfo.prepareTime;
        });
    }
    trackProjectType(projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (projectData && (projectData.projectFilePath !== this._trackedProjectFilePath)) {
                this._trackedProjectFilePath = projectData.projectFilePath;
                yield this.$analyticsService.track("Working with project type", projectData.projectType);
            }
        });
    }
    trackActionForPlatform(actionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizePlatformName = this.$mobileHelper.normalizePlatformName(actionData.platform);
            let featureValue = normalizePlatformName;
            if (actionData.isForDevice !== null) {
                const deviceType = actionData.isForDevice ? "device" : "emulator";
                featureValue += `.${deviceType}`;
            }
            yield this.$analyticsService.track(actionData.action, featureValue);
            if (actionData.deviceOsVersion) {
                yield this.$analyticsService.track(`Device OS version`, `${normalizePlatformName}_${actionData.deviceOsVersion}`);
            }
        });
    }
    buildPlatform(platform, buildConfig, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.out("Building project...");
            const action = "Build";
            yield this.trackProjectType(projectData);
            const isForDevice = this.$mobileHelper.isAndroidPlatform(platform) ? null : buildConfig && buildConfig.buildForDevice;
            yield this.trackActionForPlatform({ action, platform, isForDevice });
            yield this.$analyticsService.trackEventActionInGoogleAnalytics({
                action,
                isForDevice,
                platform,
                projectDir: projectData.projectDir,
                additionalData: `${buildConfig.release ? constants_1.Configurations.Release : constants_1.Configurations.Debug}_${buildConfig.clean ? "Clean" : "Incremental"}`
            });
            const platformData = this.$platformsData.getPlatformData(platform, projectData);
            const handler = (data) => {
                this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
                this.$logger.printInfoMessageOnSameLine(data.data.toString());
            };
            yield helpers_1.attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME, platformData.platformProjectService, handler, platformData.platformProjectService.buildProject(platformData.projectRoot, projectData, buildConfig));
            const buildInfoFilePath = this.getBuildOutputPath(platform, platformData, buildConfig);
            this.saveBuildInfoFile(platform, projectData.projectDir, buildInfoFilePath);
            this.$logger.out("Project successfully built.");
        });
    }
    saveBuildInfoFile(platform, projectDir, buildInfoFileDirname) {
        const buildInfoFile = path.join(buildInfoFileDirname, buildInfoFileName);
        const prepareInfo = this.$projectChangesService.getPrepareInfo(platform, this.$projectDataService.getProjectData(projectDir));
        const buildInfo = {
            prepareTime: prepareInfo.changesRequireBuildTime,
            buildTime: new Date().toString()
        };
        this.$fs.writeJson(buildInfoFile, buildInfo);
    }
    shouldInstall(device, projectData, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const platform = device.deviceInfo.platform;
            if (!(yield device.applicationManager.isApplicationInstalled(projectData.projectId))) {
                return true;
            }
            const platformData = this.$platformsData.getPlatformData(platform, projectData);
            const deviceBuildInfo = yield this.getDeviceBuildInfo(device, projectData);
            const localBuildInfo = this.getBuildInfo(platform, platformData, { buildForDevice: !device.isEmulator }, outputPath);
            return !localBuildInfo || !deviceBuildInfo || deviceBuildInfo.buildTime !== localBuildInfo.buildTime;
        });
    }
    installApplication(device, buildConfig, projectData, packageFile, outputFilePath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.out("Installing...");
            yield this.$analyticsService.trackEventActionInGoogleAnalytics({
                action: "Deploy",
                device,
                projectDir: projectData.projectDir
            });
            const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
            if (!packageFile) {
                if (this.$devicesService.isiOSSimulator(device)) {
                    packageFile = this.getLatestApplicationPackageForEmulator(platformData, buildConfig, outputFilePath).packageName;
                }
                else {
                    packageFile = this.getLatestApplicationPackageForDevice(platformData, buildConfig, outputFilePath).packageName;
                }
            }
            yield platformData.platformProjectService.cleanDeviceTempFolder(device.deviceInfo.identifier, projectData);
            yield device.applicationManager.reinstallApplication(projectData.projectId, packageFile);
            if (!buildConfig.release) {
                const deviceFilePath = yield this.getDeviceBuildInfoFilePath(device, projectData);
                const buildInfoFilePath = outputFilePath || this.getBuildOutputPath(device.deviceInfo.platform, platformData, { buildForDevice: !device.isEmulator });
                const appIdentifier = projectData.projectId;
                yield device.fileSystem.putFile(path.join(buildInfoFilePath, buildInfoFileName), deviceFilePath, appIdentifier);
            }
            this.$logger.out(`Successfully installed on device with identifier '${device.deviceInfo.identifier}'.`);
        });
    }
    deployPlatform(deployInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.preparePlatform({
                platform: deployInfo.platform,
                appFilesUpdaterOptions: deployInfo.appFilesUpdaterOptions,
                platformTemplate: deployInfo.deployOptions.platformTemplate,
                projectData: deployInfo.projectData,
                config: deployInfo.config,
                env: deployInfo.env
            });
            const options = {
                platform: deployInfo.platform, deviceId: deployInfo.deployOptions.device, emulator: deployInfo.deployOptions.emulator
            };
            yield this.$devicesService.initialize(options);
            const action = (device) => __awaiter(this, void 0, void 0, function* () {
                const buildConfig = {
                    buildForDevice: !this.$devicesService.isiOSSimulator(device),
                    projectDir: deployInfo.deployOptions.projectDir,
                    release: deployInfo.deployOptions.release,
                    device: deployInfo.deployOptions.device,
                    provision: deployInfo.deployOptions.provision,
                    teamId: deployInfo.deployOptions.teamId,
                    keyStoreAlias: deployInfo.deployOptions.keyStoreAlias,
                    keyStoreAliasPassword: deployInfo.deployOptions.keyStoreAliasPassword,
                    keyStorePassword: deployInfo.deployOptions.keyStorePassword,
                    keyStorePath: deployInfo.deployOptions.keyStorePath,
                    clean: deployInfo.deployOptions.clean
                };
                const shouldBuild = yield this.shouldBuild(deployInfo.platform, deployInfo.projectData, buildConfig);
                if (shouldBuild) {
                    yield this.buildPlatform(deployInfo.platform, buildConfig, deployInfo.projectData);
                }
                else {
                    this.$logger.out("Skipping package build. No changes detected on the native side. This will be fast!");
                }
                if (deployInfo.deployOptions.forceInstall || shouldBuild || (yield this.shouldInstall(device, deployInfo.projectData))) {
                    yield this.installApplication(device, buildConfig, deployInfo.projectData);
                }
                else {
                    this.$logger.out("Skipping install.");
                }
                yield this.trackActionForPlatform({ action: "Deploy", platform: device.deviceInfo.platform, isForDevice: !device.isEmulator, deviceOsVersion: device.deviceInfo.version });
            });
            if (deployInfo.deployOptions.device) {
                const device = yield this.$devicesService.getDevice(deployInfo.deployOptions.device);
                deployInfo.deployOptions.device = device.deviceInfo.identifier;
            }
            yield this.$devicesService.execute(action, this.getCanExecuteAction(deployInfo.platform, deployInfo.deployOptions));
        });
    }
    startApplication(platform, runOptions, projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.out("Starting...");
            const action = (device) => __awaiter(this, void 0, void 0, function* () {
                yield device.applicationManager.startApplication(projectId);
                this.$logger.out(`Successfully started on device with identifier '${device.deviceInfo.identifier}'.`);
            });
            yield this.$devicesService.initialize({ platform: platform, deviceId: runOptions.device });
            if (runOptions.device) {
                const device = yield this.$devicesService.getDevice(runOptions.device);
                runOptions.device = device.deviceInfo.identifier;
            }
            yield this.$devicesService.execute(action, this.getCanExecuteAction(platform, runOptions));
        });
    }
    getBuildOutputPath(platform, platformData, options) {
        if (platform.toLowerCase() === this.$devicePlatformsConstants.iOS.toLowerCase()) {
            return options.buildForDevice ? platformData.deviceBuildOutputPath : platformData.emulatorBuildOutputPath;
        }
        return platformData.deviceBuildOutputPath;
    }
    getDeviceBuildInfoFilePath(device, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceRootPath = yield this.$devicePathProvider.getDeviceProjectRootPath(device, {
                appIdentifier: projectData.projectId,
                getDirname: true
            });
            return helpers.fromWindowsRelativePathToUnix(path.join(deviceRootPath, buildInfoFileName));
        });
    }
    getDeviceBuildInfo(device, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceFilePath = yield this.getDeviceBuildInfoFilePath(device, projectData);
            try {
                return JSON.parse(yield this.readFile(device, deviceFilePath, projectData));
            }
            catch (e) {
                return null;
            }
        });
    }
    getBuildInfo(platform, platformData, options, buildOutputPath) {
        buildOutputPath = buildOutputPath || this.getBuildOutputPath(platform, platformData, options);
        const buildInfoFile = path.join(buildOutputPath, buildInfoFileName);
        if (this.$fs.exists(buildInfoFile)) {
            try {
                const buildInfoTime = this.$fs.readJson(buildInfoFile);
                return buildInfoTime;
            }
            catch (e) {
                return null;
            }
        }
        return null;
    }
    cleanDestinationApp(platformInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensurePlatformInstalled(platformInfo.platform, platformInfo.platformTemplate, platformInfo.projectData, platformInfo.config);
            const appSourceDirectoryPath = path.join(platformInfo.projectData.projectDir, constants.APP_FOLDER_NAME);
            const platformData = this.$platformsData.getPlatformData(platformInfo.platform, platformInfo.projectData);
            const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
            const appUpdater = new app_files_updater_1.AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, platformInfo.appFilesUpdaterOptions, this.$fs);
            appUpdater.cleanDestinationApp();
        });
    }
    lastOutputPath(platform, buildConfig, projectData, outputPath) {
        let packageFile;
        const platformData = this.$platformsData.getPlatformData(platform, projectData);
        if (buildConfig.buildForDevice) {
            packageFile = this.getLatestApplicationPackageForDevice(platformData, buildConfig, outputPath).packageName;
        }
        else {
            packageFile = this.getLatestApplicationPackageForEmulator(platformData, buildConfig, outputPath).packageName;
        }
        if (!packageFile || !this.$fs.exists(packageFile)) {
            this.$errors.failWithoutHelp("Unable to find built application. Try 'tns build %s'.", platform);
        }
        return packageFile;
    }
    copyLastOutput(platform, targetPath, buildConfig, projectData) {
        platform = platform.toLowerCase();
        targetPath = path.resolve(targetPath);
        const packageFile = this.lastOutputPath(platform, buildConfig, projectData);
        this.$fs.ensureDirectoryExists(path.dirname(targetPath));
        if (this.$fs.exists(targetPath) && this.$fs.getFsStats(targetPath).isDirectory()) {
            const sourceFileName = path.basename(packageFile);
            this.$logger.trace(`Specified target path: '${targetPath}' is directory. Same filename will be used: '${sourceFileName}'.`);
            targetPath = path.join(targetPath, sourceFileName);
        }
        this.$fs.copyFile(packageFile, targetPath);
        this.$logger.info(`Copied file '${packageFile}' to '${targetPath}'.`);
    }
    removePlatforms(platforms, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const platform of platforms) {
                this.validatePlatformInstalled(platform, projectData);
                const platformData = this.$platformsData.getPlatformData(platform, projectData);
                yield platformData.platformProjectService.stopServices(platformData.projectRoot);
                const platformDir = path.join(projectData.platformsDir, platform);
                this.$fs.deleteDirectory(platformDir);
                this.$projectDataService.removeNSProperty(projectData.projectDir, platformData.frameworkPackageName);
                this.$logger.out(`Platform ${platform} successfully removed.`);
            }
        });
    }
    updatePlatforms(platforms, platformTemplate, projectData, config) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const platformParam of platforms) {
                const data = platformParam.split("@"), platform = data[0], version = data[1];
                if (this.isPlatformInstalled(platform, projectData)) {
                    yield this.updatePlatform(platform, version, platformTemplate, projectData, config);
                }
                else {
                    yield this.addPlatform(platformParam, platformTemplate, projectData, config);
                }
            }
        });
    }
    getCanExecuteAction(platform, options) {
        const canExecute = (currentDevice) => {
            if (options.device && currentDevice && currentDevice.deviceInfo) {
                return currentDevice.deviceInfo.identifier === options.device;
            }
            if (this.$mobileHelper.isiOSPlatform(platform) && this.$hostInfo.isDarwin) {
                if (this.$devicesService.isOnlyiOSSimultorRunning() || options.emulator || this.$devicesService.isiOSSimulator(currentDevice)) {
                    return true;
                }
                return this.$devicesService.isiOSDevice(currentDevice);
            }
            return true;
        };
        return canExecute;
    }
    validatePlatform(platform, projectData) {
        if (!platform) {
            this.$errors.fail("No platform specified.");
        }
        platform = platform.split("@")[0].toLowerCase();
        if (!this.isValidPlatform(platform, projectData)) {
            this.$errors.fail("Invalid platform %s. Valid platforms are %s.", platform, helpers.formatListOfNames(this.$platformsData.platformsNames));
        }
    }
    validatePlatformInstalled(platform, projectData) {
        this.validatePlatform(platform, projectData);
        if (!this.isPlatformInstalled(platform, projectData)) {
            this.$errors.fail("The platform %s is not added to this project. Please use 'tns platform add <platform>'", platform);
        }
    }
    ensurePlatformInstalled(platform, platformTemplate, projectData, config, nativePrepare) {
        return __awaiter(this, void 0, void 0, function* () {
            let requiresNativePlatformAdd = false;
            if (!this.isPlatformInstalled(platform, projectData)) {
                yield this.addPlatform(platform, platformTemplate, projectData, config, "", nativePrepare);
            }
            else {
                const shouldAddNativePlatform = !nativePrepare || !nativePrepare.skipNativePrepare;
                const prepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
                requiresNativePlatformAdd = prepareInfo && prepareInfo.nativePlatformStatus === "1";
                if (requiresNativePlatformAdd && shouldAddNativePlatform) {
                    yield this.addPlatform(platform, platformTemplate, projectData, config, "", nativePrepare);
                }
            }
        });
    }
    isPlatformInstalled(platform, projectData) {
        return this.$fs.exists(path.join(projectData.platformsDir, platform.toLowerCase()));
    }
    isValidPlatform(platform, projectData) {
        return this.$platformsData.getPlatformData(platform, projectData);
    }
    isPlatformSupportedForOS(platform, projectData) {
        const targetedOS = this.$platformsData.getPlatformData(platform, projectData).targetedOS;
        const res = !targetedOS || targetedOS.indexOf("*") >= 0 || targetedOS.indexOf(process.platform) >= 0;
        return res;
    }
    isPlatformPrepared(platform, projectData) {
        const platformData = this.$platformsData.getPlatformData(platform, projectData);
        return platformData.platformProjectService.isPlatformPrepared(platformData.projectRoot, projectData);
    }
    getApplicationPackages(buildOutputPath, validPackageNames) {
        const candidates = this.$fs.readDirectory(buildOutputPath);
        const packages = _.filter(candidates, candidate => {
            return _.includes(validPackageNames, candidate);
        }).map(currentPackage => {
            currentPackage = path.join(buildOutputPath, currentPackage);
            return {
                packageName: currentPackage,
                time: this.$fs.getFsStats(currentPackage).mtime
            };
        });
        return packages;
    }
    getLatestApplicationPackage(buildOutputPath, validPackageNames) {
        let packages = this.getApplicationPackages(buildOutputPath, validPackageNames);
        if (packages.length === 0) {
            const packageExtName = path.extname(validPackageNames[0]);
            this.$errors.fail("No %s found in %s directory", packageExtName, buildOutputPath);
        }
        packages = _.sortBy(packages, pkg => pkg.time).reverse();
        return packages[0];
    }
    getLatestApplicationPackageForDevice(platformData, buildConfig, outputPath) {
        return this.getLatestApplicationPackage(outputPath || platformData.deviceBuildOutputPath, platformData.getValidPackageNames({ isForDevice: true, isReleaseBuild: buildConfig.release }));
    }
    getLatestApplicationPackageForEmulator(platformData, buildConfig, outputPath) {
        return this.getLatestApplicationPackage(outputPath || platformData.emulatorBuildOutputPath || platformData.deviceBuildOutputPath, platformData.getValidPackageNames({ isForDevice: false, isReleaseBuild: buildConfig.release }));
    }
    updatePlatform(platform, version, platformTemplate, projectData, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const platformData = this.$platformsData.getPlatformData(platform, projectData);
            const data = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
            const currentVersion = data && data.version ? data.version : "0.2.0";
            let newVersion = version === constants.PackageVersion.NEXT ?
                yield this.$npmInstallationManager.getNextVersion(platformData.frameworkPackageName) :
                version || (yield this.$npmInstallationManager.getLatestCompatibleVersion(platformData.frameworkPackageName));
            const installedModuleDir = yield this.$npmInstallationManager.install(platformData.frameworkPackageName, projectData.projectDir, { version: newVersion, dependencyType: "save" });
            const cachedPackageData = this.$fs.readJson(path.join(installedModuleDir, "package.json"));
            newVersion = (cachedPackageData && cachedPackageData.version) || newVersion;
            const canUpdate = platformData.platformProjectService.canUpdatePlatform(installedModuleDir, projectData);
            yield this.$npm.uninstall(platformData.frameworkPackageName, { save: true }, projectData.projectDir);
            if (canUpdate) {
                if (!semver.valid(newVersion)) {
                    this.$errors.fail("The version %s is not valid. The version should consists from 3 parts separated by dot.", newVersion);
                }
                if (!semver.gt(currentVersion, newVersion)) {
                    yield this.updatePlatformCore(platformData, { currentVersion, newVersion, canUpdate, platformTemplate }, projectData, config);
                }
                else if (semver.eq(currentVersion, newVersion)) {
                    this.$errors.fail("Current and new version are the same.");
                }
                else {
                    this.$errors.fail(`Your current version: ${currentVersion} is higher than the one you're trying to install ${newVersion}.`);
                }
            }
            else {
                this.$errors.failWithoutHelp("Native Platform cannot be updated.");
            }
        });
    }
    updatePlatformCore(platformData, updateOptions, projectData, config) {
        return __awaiter(this, void 0, void 0, function* () {
            let packageName = platformData.normalizedPlatformName.toLowerCase();
            yield this.removePlatforms([packageName], projectData);
            packageName = updateOptions.newVersion ? `${packageName}@${updateOptions.newVersion}` : packageName;
            yield this.addPlatform(packageName, updateOptions.platformTemplate, projectData, config);
            this.$logger.out("Successfully updated to version ", updateOptions.newVersion);
        });
    }
    readFile(device, deviceFilePath, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            temp.track();
            const uniqueFilePath = temp.path({ suffix: ".tmp" });
            try {
                yield device.fileSystem.getFile(deviceFilePath, projectData.projectId, uniqueFilePath);
            }
            catch (e) {
                return null;
            }
            if (this.$fs.exists(uniqueFilePath)) {
                const text = this.$fs.readText(uniqueFilePath);
                shell.rm(uniqueFilePath);
                return text;
            }
            return null;
        });
    }
}
__decorate([
    helpers.hook('prepare')
], PlatformService.prototype, "preparePlatformCore", null);
__decorate([
    helpers.hook('cleanApp')
], PlatformService.prototype, "cleanDestinationApp", null);
exports.PlatformService = PlatformService;
$injector.register("platformService", PlatformService);
