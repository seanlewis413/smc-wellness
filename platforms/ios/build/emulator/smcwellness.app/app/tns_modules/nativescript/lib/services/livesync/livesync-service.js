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
const choki = require("chokidar");
const os_1 = require("os");
const events_1 = require("events");
const helpers_1 = require("../../common/helpers");
const constants_1 = require("../../constants");
const constants_2 = require("../../common/constants");
const decorators_1 = require("../../common/decorators");
const deviceDescriptorPrimaryKey = "identifier";
const LiveSyncEvents = {
    liveSyncStopped: "liveSyncStopped",
    liveSyncError: "liveSyncError",
    liveSyncExecuted: "liveSyncExecuted",
    liveSyncStarted: "liveSyncStarted",
    liveSyncNotification: "notify"
};
class LiveSyncService extends events_1.EventEmitter {
    constructor($platformService, $projectDataService, $devicesService, $mobileHelper, $devicePlatformsConstants, $nodeModulesDependenciesBuilder, $logger, $processService, $hooksService, $pluginsService, $debugService, $errors, $debugDataService, $analyticsService, $usbLiveSyncService, $injector) {
        super();
        this.$platformService = $platformService;
        this.$projectDataService = $projectDataService;
        this.$devicesService = $devicesService;
        this.$mobileHelper = $mobileHelper;
        this.$devicePlatformsConstants = $devicePlatformsConstants;
        this.$nodeModulesDependenciesBuilder = $nodeModulesDependenciesBuilder;
        this.$logger = $logger;
        this.$processService = $processService;
        this.$hooksService = $hooksService;
        this.$pluginsService = $pluginsService;
        this.$debugService = $debugService;
        this.$errors = $errors;
        this.$debugDataService = $debugDataService;
        this.$analyticsService = $analyticsService;
        this.$usbLiveSyncService = $usbLiveSyncService;
        this.$injector = $injector;
        this.liveSyncProcessesInfo = {};
    }
    liveSync(deviceDescriptors, liveSyncData) {
        return __awaiter(this, void 0, void 0, function* () {
            const projectData = this.$projectDataService.getProjectData(liveSyncData.projectDir);
            yield this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
            yield this.liveSyncOperation(deviceDescriptors, liveSyncData, projectData);
        });
    }
    stopLiveSync(projectDir, deviceIdentifiers, stopOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectDir];
            if (liveSyncProcessInfo) {
                const shouldAwaitPendingOperation = !stopOptions || stopOptions.shouldAwaitAllActions;
                const deviceIdentifiersToRemove = deviceIdentifiers || _.map(liveSyncProcessInfo.deviceDescriptors, d => d.identifier);
                const removedDeviceIdentifiers = _.remove(liveSyncProcessInfo.deviceDescriptors, descriptor => _.includes(deviceIdentifiersToRemove, descriptor.identifier))
                    .map(descriptor => descriptor.identifier);
                if (!deviceIdentifiers || !deviceIdentifiers.length || !liveSyncProcessInfo.deviceDescriptors || !liveSyncProcessInfo.deviceDescriptors.length) {
                    if (liveSyncProcessInfo.timer) {
                        clearTimeout(liveSyncProcessInfo.timer);
                    }
                    if (liveSyncProcessInfo.watcherInfo && liveSyncProcessInfo.watcherInfo.watcher) {
                        liveSyncProcessInfo.watcherInfo.watcher.close();
                    }
                    liveSyncProcessInfo.watcherInfo = null;
                    liveSyncProcessInfo.isStopped = true;
                    if (liveSyncProcessInfo.actionsChain && shouldAwaitPendingOperation) {
                        yield liveSyncProcessInfo.actionsChain;
                    }
                    liveSyncProcessInfo.deviceDescriptors = [];
                    const projectData = this.$projectDataService.getProjectData(projectDir);
                    yield this.$hooksService.executeAfterHooks('watch', {
                        hookArgs: {
                            projectData
                        }
                    });
                    this.$usbLiveSyncService.isInitialized = false;
                }
                else if (liveSyncProcessInfo.currentSyncAction && shouldAwaitPendingOperation) {
                    yield liveSyncProcessInfo.currentSyncAction;
                }
                _.each(removedDeviceIdentifiers, deviceIdentifier => {
                    this.emit(LiveSyncEvents.liveSyncStopped, { projectDir, deviceIdentifier });
                });
            }
        });
    }
    getLiveSyncDeviceDescriptors(projectDir) {
        const liveSyncProcessesInfo = this.liveSyncProcessesInfo[projectDir] || {};
        const currentDescriptors = liveSyncProcessesInfo.deviceDescriptors;
        return currentDescriptors || [];
    }
    refreshApplication(projectData, liveSyncResultInfo, debugOpts, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceDescriptor = this.getDeviceDescriptor(liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier, projectData.projectDir);
            return deviceDescriptor && deviceDescriptor.debugggingEnabled ?
                this.refreshApplicationWithDebug(projectData, liveSyncResultInfo, debugOpts, outputPath) :
                this.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, debugOpts, outputPath);
        });
    }
    refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, debugOpts, outputPath, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            const platformLiveSyncService = this.getLiveSyncService(liveSyncResultInfo.deviceAppData.platform);
            try {
                yield platformLiveSyncService.refreshApplication(projectData, liveSyncResultInfo);
            }
            catch (err) {
                this.$logger.info(`Error while trying to start application ${projectData.projectId} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Error is: ${err.message || err}`);
                const msg = `Unable to start application ${projectData.projectId} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Try starting it manually.`;
                this.$logger.warn(msg);
                if (!settings || !settings.shouldSkipEmitLiveSyncNotification) {
                    this.emit(LiveSyncEvents.liveSyncNotification, {
                        projectDir: projectData.projectDir,
                        applicationIdentifier: projectData.projectId,
                        deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
                        notification: msg
                    });
                }
            }
            this.emit(LiveSyncEvents.liveSyncExecuted, {
                projectDir: projectData.projectDir,
                applicationIdentifier: projectData.projectId,
                syncedFiles: liveSyncResultInfo.modifiedFilesData.map(m => m.getLocalPath()),
                deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
                isFullSync: liveSyncResultInfo.isFullSync
            });
            this.$logger.info(`Successfully synced application ${liveSyncResultInfo.deviceAppData.appIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}.`);
        });
    }
    refreshApplicationWithDebug(projectData, liveSyncResultInfo, debugOptions, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.$platformService.trackProjectType(projectData);
            const deviceAppData = liveSyncResultInfo.deviceAppData;
            const deviceIdentifier = liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier;
            yield this.$debugService.debugStop(deviceIdentifier);
            this.emit(constants_1.DEBUGGER_DETACHED_EVENT_NAME, { deviceIdentifier });
            const applicationId = deviceAppData.appIdentifier;
            const attachDebuggerOptions = {
                platform: liveSyncResultInfo.deviceAppData.device.deviceInfo.platform,
                isEmulator: liveSyncResultInfo.deviceAppData.device.isEmulator,
                projectDir: projectData.projectDir,
                deviceIdentifier,
                debugOptions,
                outputPath
            };
            try {
                yield deviceAppData.device.applicationManager.stopApplication(applicationId, projectData.projectName);
                debugOptions = debugOptions || {};
                debugOptions.start = false;
            }
            catch (err) {
                this.$logger.trace("Could not stop application during debug livesync. Will try to restart app instead.", err);
                if ((err.message || err) === "Could not find developer disk image") {
                    liveSyncResultInfo.isFullSync = true;
                    yield this.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, debugOptions, outputPath, { shouldSkipEmitLiveSyncNotification: true });
                    this.emit(constants_1.USER_INTERACTION_NEEDED_EVENT_NAME, attachDebuggerOptions);
                    return;
                }
                else {
                    throw err;
                }
            }
            const deviceOption = {
                deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
                debugOptions: debugOptions,
            };
            return this.enableDebuggingCoreWithoutWaitingCurrentAction(deviceOption, { projectDir: projectData.projectDir });
        });
    }
    attachDebugger(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            if (settings.debugOptions) {
                settings.debugOptions.chrome = settings.debugOptions.chrome === undefined ? true : settings.debugOptions.chrome;
                settings.debugOptions.start = settings.debugOptions.start === undefined ? true : settings.debugOptions.start;
            }
            else {
                settings.debugOptions = {
                    chrome: true,
                    start: true
                };
            }
            const projectData = this.$projectDataService.getProjectData(settings.projectDir);
            const debugData = this.$debugDataService.createDebugData(projectData, { device: settings.deviceIdentifier });
            const buildConfig = {
                buildForDevice: !settings.isEmulator,
                release: false,
                device: settings.deviceIdentifier,
                provision: null,
                teamId: null,
                projectDir: settings.projectDir
            };
            debugData.pathToAppPackage = this.$platformService.lastOutputPath(settings.platform, buildConfig, projectData, settings.outputPath);
            return this.printDebugInformation(yield this.$debugService.debug(debugData, settings.debugOptions));
        });
    }
    printDebugInformation(debugInformation) {
        if (!!debugInformation.url) {
            this.emit(constants_1.DEBUGGER_ATTACHED_EVENT_NAME, debugInformation);
            this.$logger.info(`To start debugging, open the following URL in Chrome:${os_1.EOL}${debugInformation.url}${os_1.EOL}`.cyan);
        }
        return debugInformation;
    }
    enableDebugging(deviceOpts, debuggingAdditionalOptions) {
        return _.map(deviceOpts, d => this.enableDebuggingCore(d, debuggingAdditionalOptions));
    }
    getDeviceDescriptor(deviceIdentifier, projectDir) {
        const deviceDescriptors = this.getLiveSyncDeviceDescriptors(projectDir);
        return _.find(deviceDescriptors, d => d.identifier === deviceIdentifier);
    }
    enableDebuggingCoreWithoutWaitingCurrentAction(deviceOption, debuggingAdditionalOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDeviceDescriptor = this.getDeviceDescriptor(deviceOption.deviceIdentifier, debuggingAdditionalOptions.projectDir);
            if (!currentDeviceDescriptor) {
                this.$errors.failWithoutHelp(`Couldn't enable debugging for ${deviceOption.deviceIdentifier}`);
            }
            currentDeviceDescriptor.debugggingEnabled = true;
            currentDeviceDescriptor.debugOptions = deviceOption.debugOptions;
            const currentDeviceInstance = this.$devicesService.getDeviceByIdentifier(deviceOption.deviceIdentifier);
            const attachDebuggerOptions = {
                deviceIdentifier: deviceOption.deviceIdentifier,
                isEmulator: currentDeviceInstance.isEmulator,
                outputPath: currentDeviceDescriptor.outputPath,
                platform: currentDeviceInstance.deviceInfo.platform,
                projectDir: debuggingAdditionalOptions.projectDir,
                debugOptions: deviceOption.debugOptions
            };
            let debugInformation;
            try {
                debugInformation = yield this.attachDebugger(attachDebuggerOptions);
            }
            catch (err) {
                this.$logger.trace("Couldn't attach debugger, will modify options and try again.", err);
                attachDebuggerOptions.debugOptions.start = false;
                try {
                    debugInformation = yield this.attachDebugger(attachDebuggerOptions);
                }
                catch (innerErr) {
                    this.$logger.trace("Couldn't attach debugger with modified options.", innerErr);
                    throw err;
                }
            }
            return debugInformation;
        });
    }
    enableDebuggingCore(deviceOption, debuggingAdditionalOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const liveSyncProcessInfo = this.liveSyncProcessesInfo[debuggingAdditionalOptions.projectDir];
            if (liveSyncProcessInfo && liveSyncProcessInfo.currentSyncAction) {
                yield liveSyncProcessInfo.currentSyncAction;
            }
            return this.enableDebuggingCoreWithoutWaitingCurrentAction(deviceOption, debuggingAdditionalOptions);
        });
    }
    disableDebugging(deviceOptions, debuggingAdditionalOptions) {
        return _.map(deviceOptions, d => this.disableDebuggingCore(d, debuggingAdditionalOptions));
    }
    disableDebuggingCore(deviceOption, debuggingAdditionalOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const liveSyncProcessInfo = this.liveSyncProcessesInfo[debuggingAdditionalOptions.projectDir];
            if (liveSyncProcessInfo.currentSyncAction) {
                yield liveSyncProcessInfo.currentSyncAction;
            }
            const currentDeviceDescriptor = this.getDeviceDescriptor(deviceOption.deviceIdentifier, debuggingAdditionalOptions.projectDir);
            if (currentDeviceDescriptor) {
                currentDeviceDescriptor.debugggingEnabled = false;
            }
            else {
                this.$errors.failWithoutHelp(`Couldn't disable debugging for ${deviceOption.deviceIdentifier}`);
            }
            const currentDevice = this.$devicesService.getDeviceByIdentifier(currentDeviceDescriptor.identifier);
            if (!currentDevice) {
                this.$errors.failWithoutHelp(`Couldn't disable debugging for ${deviceOption.deviceIdentifier}. Could not find device.`);
            }
            yield this.$debugService.debugStop(currentDevice.deviceInfo.identifier);
            this.emit(constants_1.DEBUGGER_DETACHED_EVENT_NAME, { deviceIdentifier: currentDeviceDescriptor.identifier });
        });
    }
    liveSyncOperation(deviceDescriptors, liveSyncData, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const isAlreadyLiveSyncing = this.liveSyncProcessesInfo[projectData.projectDir] && !this.liveSyncProcessesInfo[projectData.projectDir].isStopped;
            const currentlyRunningDeviceDescriptors = this.getLiveSyncDeviceDescriptors(projectData.projectDir);
            const deviceDescriptorsForInitialSync = isAlreadyLiveSyncing ? _.differenceBy(deviceDescriptors, currentlyRunningDeviceDescriptors, deviceDescriptorPrimaryKey) : deviceDescriptors;
            this.setLiveSyncProcessInfo(liveSyncData.projectDir, deviceDescriptors);
            yield this.initialSync(projectData, deviceDescriptorsForInitialSync, liveSyncData);
            if (!liveSyncData.skipWatcher && this.liveSyncProcessesInfo[projectData.projectDir].deviceDescriptors.length) {
                this.$usbLiveSyncService.isInitialized = true;
                yield this.startWatcher(projectData, liveSyncData);
            }
        });
    }
    setLiveSyncProcessInfo(projectDir, deviceDescriptors) {
        this.liveSyncProcessesInfo[projectDir] = this.liveSyncProcessesInfo[projectDir] || Object.create(null);
        this.liveSyncProcessesInfo[projectDir].actionsChain = this.liveSyncProcessesInfo[projectDir].actionsChain || Promise.resolve();
        this.liveSyncProcessesInfo[projectDir].currentSyncAction = this.liveSyncProcessesInfo[projectDir].actionsChain;
        this.liveSyncProcessesInfo[projectDir].isStopped = false;
        const currentDeviceDescriptors = this.getLiveSyncDeviceDescriptors(projectDir);
        this.liveSyncProcessesInfo[projectDir].deviceDescriptors = _.uniqBy(currentDeviceDescriptors.concat(deviceDescriptors), deviceDescriptorPrimaryKey);
    }
    getLiveSyncService(platform) {
        if (this.$mobileHelper.isiOSPlatform(platform)) {
            return this.$injector.resolve("iOSLiveSyncService");
        }
        else if (this.$mobileHelper.isAndroidPlatform(platform)) {
            return this.$injector.resolve("androidLiveSyncService");
        }
        this.$errors.failWithoutHelp(`Invalid platform ${platform}. Supported platforms are: ${this.$mobileHelper.platformNames.join(", ")}`);
    }
    ensureLatestAppPackageIsInstalledOnDevice(options, nativePrepare) {
        return __awaiter(this, void 0, void 0, function* () {
            const platform = options.device.deviceInfo.platform;
            const appInstalledOnDeviceResult = { appInstalled: false };
            if (options.preparedPlatforms.indexOf(platform) === -1) {
                options.preparedPlatforms.push(platform);
                const platformSpecificOptions = options.deviceBuildInfoDescriptor.platformSpecificOptions || {};
                const prepareInfo = {
                    platform,
                    appFilesUpdaterOptions: {
                        bundle: options.bundle,
                        release: options.release,
                    },
                    projectData: options.projectData,
                    env: options.env,
                    nativePrepare: nativePrepare,
                    filesToSync: options.modifiedFiles,
                    platformTemplate: null,
                    config: platformSpecificOptions
                };
                yield this.$platformService.preparePlatform(prepareInfo);
            }
            const buildResult = yield this.installedCachedAppPackage(platform, options);
            if (buildResult) {
                appInstalledOnDeviceResult.appInstalled = true;
                return appInstalledOnDeviceResult;
            }
            const shouldBuild = yield this.$platformService.shouldBuild(platform, options.projectData, { buildForDevice: !options.device.isEmulator, clean: options.liveSyncData && options.liveSyncData.clean }, options.deviceBuildInfoDescriptor.outputPath);
            let pathToBuildItem = null;
            let action = constants_1.LiveSyncTrackActionNames.LIVESYNC_OPERATION;
            if (shouldBuild) {
                pathToBuildItem = yield options.deviceBuildInfoDescriptor.buildAction();
                options.rebuiltInformation.push({ isEmulator: options.device.isEmulator, platform, pathToBuildItem });
                action = constants_1.LiveSyncTrackActionNames.LIVESYNC_OPERATION_BUILD;
            }
            else {
                yield this.$analyticsService.trackEventActionInGoogleAnalytics({
                    action: "LiveSync",
                    device: options.device,
                    projectDir: options.projectData.projectDir
                });
            }
            yield this.trackAction(action, platform, options);
            const shouldInstall = yield this.$platformService.shouldInstall(options.device, options.projectData, options.deviceBuildInfoDescriptor.outputPath);
            if (shouldInstall) {
                yield this.$platformService.installApplication(options.device, { release: false }, options.projectData, pathToBuildItem, options.deviceBuildInfoDescriptor.outputPath);
                appInstalledOnDeviceResult.appInstalled = true;
            }
            return appInstalledOnDeviceResult;
        });
    }
    trackAction(action, platform, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options.settings[platform][options.device.deviceInfo.type]) {
                let isForDevice = !options.device.isEmulator;
                options.settings[platform][options.device.deviceInfo.type] = true;
                if (this.$mobileHelper.isAndroidPlatform(platform)) {
                    options.settings[platform][constants_2.DeviceTypes.Emulator] = true;
                    options.settings[platform][constants_2.DeviceTypes.Device] = true;
                    isForDevice = null;
                }
                yield this.$platformService.trackActionForPlatform({ action, platform, isForDevice });
            }
            yield this.$platformService.trackActionForPlatform({ action: constants_1.LiveSyncTrackActionNames.DEVICE_INFO, platform, isForDevice: !options.device.isEmulator, deviceOsVersion: options.device.deviceInfo.version });
        });
    }
    installedCachedAppPackage(platform, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const rebuildInfo = _.find(options.rebuiltInformation, info => info.isEmulator === options.device.isEmulator && info.platform === platform);
            if (rebuildInfo) {
                yield this.$platformService.installApplication(options.device, { release: false }, options.projectData, rebuildInfo.pathToBuildItem, options.deviceBuildInfoDescriptor.outputPath);
                return rebuildInfo.pathToBuildItem;
            }
            return null;
        });
    }
    initialSync(projectData, deviceDescriptors, liveSyncData) {
        return __awaiter(this, void 0, void 0, function* () {
            const preparedPlatforms = [];
            const rebuiltInformation = [];
            const settings = this.getDefaultLatestAppPackageInstalledSettings();
            const deviceAction = (device) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const platform = device.deviceInfo.platform;
                    const deviceBuildInfoDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
                    yield this.ensureLatestAppPackageIsInstalledOnDevice({
                        device,
                        preparedPlatforms,
                        rebuiltInformation,
                        projectData,
                        deviceBuildInfoDescriptor,
                        liveSyncData,
                        settings,
                        bundle: liveSyncData.bundle,
                        release: liveSyncData.release,
                        env: liveSyncData.env
                    }, { skipNativePrepare: deviceBuildInfoDescriptor.skipNativePrepare });
                    const liveSyncResultInfo = yield this.getLiveSyncService(platform).fullSync({
                        projectData, device,
                        syncAllFiles: liveSyncData.watchAllFiles,
                        useLiveEdit: liveSyncData.useLiveEdit,
                        watch: !liveSyncData.skipWatcher
                    });
                    yield this.$platformService.trackActionForPlatform({ action: "LiveSync", platform: device.deviceInfo.platform, isForDevice: !device.isEmulator, deviceOsVersion: device.deviceInfo.version });
                    yield this.refreshApplication(projectData, liveSyncResultInfo, deviceBuildInfoDescriptor.debugOptions, deviceBuildInfoDescriptor.outputPath);
                    this.emit(LiveSyncEvents.liveSyncStarted, {
                        projectDir: projectData.projectDir,
                        deviceIdentifier: device.deviceInfo.identifier,
                        applicationIdentifier: projectData.projectId
                    });
                }
                catch (err) {
                    this.$logger.warn(`Unable to apply changes on device: ${device.deviceInfo.identifier}. Error is: ${err.message}.`);
                    this.emit(LiveSyncEvents.liveSyncError, {
                        error: err,
                        deviceIdentifier: device.deviceInfo.identifier,
                        projectDir: projectData.projectDir,
                        applicationIdentifier: projectData.projectId
                    });
                    yield this.stopLiveSync(projectData.projectDir, [device.deviceInfo.identifier], { shouldAwaitAllActions: false });
                }
            });
            yield this.addActionToChain(projectData.projectDir, () => this.$devicesService.execute(deviceAction, (device) => _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier)));
            this.attachDeviceLostHandler();
        });
    }
    getDefaultLatestAppPackageInstalledSettings() {
        return {
            [this.$devicePlatformsConstants.Android]: {
                [constants_2.DeviceTypes.Device]: false,
                [constants_2.DeviceTypes.Emulator]: false
            },
            [this.$devicePlatformsConstants.iOS]: {
                [constants_2.DeviceTypes.Device]: false,
                [constants_2.DeviceTypes.Emulator]: false
            }
        };
    }
    startWatcher(projectData, liveSyncData) {
        return __awaiter(this, void 0, void 0, function* () {
            const patterns = [constants_1.APP_FOLDER_NAME];
            if (liveSyncData.watchAllFiles) {
                const productionDependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(projectData.projectDir);
                patterns.push(constants_1.PACKAGE_JSON_FILE_NAME);
                for (const index in productionDependencies) {
                    patterns.push(productionDependencies[index].directory);
                }
            }
            const currentWatcherInfo = this.liveSyncProcessesInfo[liveSyncData.projectDir].watcherInfo;
            const areWatcherPatternsDifferent = () => _.xor(currentWatcherInfo.patterns, patterns).length;
            if (!currentWatcherInfo || areWatcherPatternsDifferent()) {
                if (currentWatcherInfo) {
                    currentWatcherInfo.watcher.close();
                }
                let filesToSync = [];
                let filesToRemove = [];
                let timeoutTimer;
                const startTimeout = () => {
                    timeoutTimer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        yield this.addActionToChain(projectData.projectDir, () => __awaiter(this, void 0, void 0, function* () {
                            if (filesToSync.length || filesToRemove.length) {
                                try {
                                    const currentFilesToSync = _.cloneDeep(filesToSync);
                                    filesToSync = [];
                                    const currentFilesToRemove = _.cloneDeep(filesToRemove);
                                    filesToRemove = [];
                                    const allModifiedFiles = [].concat(currentFilesToSync).concat(currentFilesToRemove);
                                    const preparedPlatforms = [];
                                    const rebuiltInformation = [];
                                    const latestAppPackageInstalledSettings = this.getDefaultLatestAppPackageInstalledSettings();
                                    yield this.$devicesService.execute((device) => __awaiter(this, void 0, void 0, function* () {
                                        const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectData.projectDir];
                                        const deviceBuildInfoDescriptor = _.find(liveSyncProcessInfo.deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
                                        const appInstalledOnDeviceResult = yield this.ensureLatestAppPackageIsInstalledOnDevice({
                                            device,
                                            preparedPlatforms,
                                            rebuiltInformation,
                                            projectData,
                                            deviceBuildInfoDescriptor,
                                            settings: latestAppPackageInstalledSettings,
                                            modifiedFiles: allModifiedFiles,
                                            bundle: liveSyncData.bundle,
                                            release: liveSyncData.release,
                                            env: liveSyncData.env
                                        }, { skipNativePrepare: deviceBuildInfoDescriptor.skipNativePrepare });
                                        const service = this.getLiveSyncService(device.deviceInfo.platform);
                                        const settings = {
                                            projectData,
                                            filesToRemove: currentFilesToRemove,
                                            filesToSync: currentFilesToSync,
                                            isReinstalled: appInstalledOnDeviceResult.appInstalled,
                                            syncAllFiles: liveSyncData.watchAllFiles,
                                            useLiveEdit: liveSyncData.useLiveEdit
                                        };
                                        const liveSyncResultInfo = yield service.liveSyncWatchAction(device, settings);
                                        yield this.refreshApplication(projectData, liveSyncResultInfo, deviceBuildInfoDescriptor.debugOptions, deviceBuildInfoDescriptor.outputPath);
                                    }), (device) => {
                                        const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectData.projectDir];
                                        return liveSyncProcessInfo && _.some(liveSyncProcessInfo.deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier);
                                    });
                                }
                                catch (err) {
                                    const allErrors = err.allErrors;
                                    if (allErrors && _.isArray(allErrors)) {
                                        for (const deviceError of allErrors) {
                                            this.$logger.warn(`Unable to apply changes for device: ${deviceError.deviceIdentifier}. Error is: ${deviceError.message}.`);
                                            this.emit(LiveSyncEvents.liveSyncError, {
                                                error: deviceError,
                                                deviceIdentifier: deviceError.deviceIdentifier,
                                                projectDir: projectData.projectDir,
                                                applicationIdentifier: projectData.projectId
                                            });
                                            yield this.stopLiveSync(projectData.projectDir, [deviceError.deviceIdentifier], { shouldAwaitAllActions: false });
                                        }
                                    }
                                }
                            }
                        }));
                    }), 250);
                    this.liveSyncProcessesInfo[liveSyncData.projectDir].timer = timeoutTimer;
                };
                yield this.$hooksService.executeBeforeHooks('watch', {
                    hookArgs: {
                        projectData
                    }
                });
                const watcherOptions = {
                    ignoreInitial: true,
                    cwd: liveSyncData.projectDir,
                    awaitWriteFinish: {
                        pollInterval: 100,
                        stabilityThreshold: 500
                    },
                    ignored: ["**/.*", ".*"]
                };
                const watcher = choki.watch(patterns, watcherOptions)
                    .on("all", (event, filePath) => __awaiter(this, void 0, void 0, function* () {
                    clearTimeout(timeoutTimer);
                    filePath = path.join(liveSyncData.projectDir, filePath);
                    this.$logger.trace(`Chokidar raised event ${event} for ${filePath}.`);
                    if (event === "add" || event === "addDir" || event === "change") {
                        filesToSync.push(filePath);
                    }
                    else if (event === "unlink" || event === "unlinkDir") {
                        filesToRemove.push(filePath);
                    }
                    if (path.extname(filePath) !== constants_2.FileExtensions.TYPESCRIPT_FILE) {
                        startTimeout();
                    }
                }));
                this.liveSyncProcessesInfo[liveSyncData.projectDir].watcherInfo = { watcher, patterns };
                this.liveSyncProcessesInfo[liveSyncData.projectDir].timer = timeoutTimer;
                this.$processService.attachToProcessExitSignals(this, () => {
                    _.keys(this.liveSyncProcessesInfo).forEach(projectDir => {
                        this.stopLiveSync(projectDir);
                    });
                });
            }
        });
    }
    attachDeviceLostHandler() {
        this.$devicesService.on(constants_2.DeviceDiscoveryEventNames.DEVICE_LOST, (device) => __awaiter(this, void 0, void 0, function* () {
            this.$logger.trace(`Received ${constants_2.DeviceDiscoveryEventNames.DEVICE_LOST} event in LiveSync service for ${device.deviceInfo.identifier}. Will stop LiveSync operation for this device.`);
            for (const projectDir in this.liveSyncProcessesInfo) {
                try {
                    yield this.stopLiveSync(projectDir, [device.deviceInfo.identifier]);
                }
                catch (err) {
                    this.$logger.warn(`Unable to stop LiveSync operation for ${device.deviceInfo.identifier}.`, err);
                }
            }
        }));
    }
    addActionToChain(projectDir, action) {
        return __awaiter(this, void 0, void 0, function* () {
            const liveSyncInfo = this.liveSyncProcessesInfo[projectDir];
            if (liveSyncInfo) {
                liveSyncInfo.actionsChain = liveSyncInfo.actionsChain.then(() => __awaiter(this, void 0, void 0, function* () {
                    if (!liveSyncInfo.isStopped) {
                        liveSyncInfo.currentSyncAction = action();
                        const res = yield liveSyncInfo.currentSyncAction;
                        return res;
                    }
                }));
                const result = yield liveSyncInfo.actionsChain;
                return result;
            }
        });
    }
}
__decorate([
    helpers_1.hook("liveSync")
], LiveSyncService.prototype, "liveSyncOperation", null);
__decorate([
    decorators_1.cache()
], LiveSyncService.prototype, "attachDeviceLostHandler", null);
exports.LiveSyncService = LiveSyncService;
$injector.register("liveSyncService", LiveSyncService);
class DeprecatedUsbLiveSyncService {
    constructor() {
        this.isInitialized = false;
    }
}
exports.DeprecatedUsbLiveSyncService = DeprecatedUsbLiveSyncService;
$injector.register("usbLiveSyncService", DeprecatedUsbLiveSyncService);
