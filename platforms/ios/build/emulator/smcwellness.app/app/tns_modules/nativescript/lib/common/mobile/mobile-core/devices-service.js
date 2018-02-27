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
const util = require("util");
const helpers = require("../../helpers");
const assert = require("assert");
const constants = require("../../constants");
const decorators_1 = require("../../decorators");
const helpers_1 = require("../../helpers");
const events_1 = require("events");
const os_1 = require("os");
class DevicesService extends events_1.EventEmitter {
    constructor($logger, $errors, $iOSSimulatorDiscovery, $iOSDeviceDiscovery, $androidDeviceDiscovery, $staticConfig, $messages, $mobileHelper, $deviceLogProvider, $hostInfo, $injector, $options, $androidProcessService, $processService) {
        super();
        this.$logger = $logger;
        this.$errors = $errors;
        this.$iOSSimulatorDiscovery = $iOSSimulatorDiscovery;
        this.$iOSDeviceDiscovery = $iOSDeviceDiscovery;
        this.$androidDeviceDiscovery = $androidDeviceDiscovery;
        this.$staticConfig = $staticConfig;
        this.$messages = $messages;
        this.$mobileHelper = $mobileHelper;
        this.$deviceLogProvider = $deviceLogProvider;
        this.$hostInfo = $hostInfo;
        this.$injector = $injector;
        this.$options = $options;
        this.$androidProcessService = $androidProcessService;
        this.$processService = $processService;
        this._devices = {};
        this.platforms = [];
        this._isInitialized = false;
        this._otherDeviceDiscoveries = [];
        this._allDeviceDiscoveries = [];
        this.attachToKnownDeviceDiscoveryEvents();
        this._allDeviceDiscoveries = [this.$iOSDeviceDiscovery, this.$androidDeviceDiscovery, this.$iOSSimulatorDiscovery];
    }
    get $companionAppsService() {
        return this.$injector.resolve("companionAppsService");
    }
    get platform() {
        return this._platform;
    }
    get deviceCount() {
        return this._device ? 1 : this.getDeviceInstances().length;
    }
    getDevices() {
        return this.getDeviceInstances().map(deviceInstance => deviceInstance.deviceInfo);
    }
    getDevicesForPlatform(platform) {
        return _.filter(this.getDeviceInstances(), d => d.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
    }
    isAndroidDevice(device) {
        return this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform);
    }
    isiOSDevice(device) {
        return this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform) && !device.isEmulator;
    }
    isiOSSimulator(device) {
        return !!(this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform) && device.isEmulator);
    }
    setLogLevel(logLevel, deviceIdentifier) {
        this.$deviceLogProvider.setLogLevel(logLevel, deviceIdentifier);
    }
    isAppInstalledOnDevices(deviceIdentifiers, appIdentifier) {
        this.$logger.trace(`Called isInstalledOnDevices for identifiers ${deviceIdentifiers}. AppIdentifier is ${appIdentifier}.`);
        return _.map(deviceIdentifiers, deviceIdentifier => this.isApplicationInstalledOnDevice(deviceIdentifier, appIdentifier));
    }
    isCompanionAppInstalledOnDevices(deviceIdentifiers, framework) {
        this.$logger.trace(`Called isCompanionAppInstalledOnDevices for identifiers ${deviceIdentifiers}. Framework is ${framework}.`);
        return _.map(deviceIdentifiers, deviceIdentifier => this.isCompanionAppInstalledOnDevice(deviceIdentifier, framework));
    }
    getDeviceInstances() {
        return _.values(this._devices);
    }
    getAllPlatforms() {
        if (this.platforms.length > 0) {
            return this.platforms;
        }
        this.platforms = _.filter(this.$mobileHelper.platformNames, platform => this.$mobileHelper.getPlatformCapabilities(platform).cableDeploy);
        return this.platforms;
    }
    getPlatform(platform) {
        const allSupportedPlatforms = this.getAllPlatforms();
        const normalizedPlatform = this.$mobileHelper.validatePlatformName(platform);
        if (!_.includes(allSupportedPlatforms, normalizedPlatform)) {
            this.$errors.failWithoutHelp("Deploying to %s connected devices is not supported. Build the " +
                "app using the `build` command and deploy the package manually.", normalizedPlatform);
        }
        return normalizedPlatform;
    }
    getInstalledApplications(deviceIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const device = yield this.getDevice(deviceIdentifier);
            return device.applicationManager.getInstalledApplications();
        });
    }
    addDeviceDiscovery(deviceDiscovery) {
        this._otherDeviceDiscoveries.push(deviceDiscovery);
        this._allDeviceDiscoveries.push(deviceDiscovery);
        this.attachToDeviceDiscoveryEvents(deviceDiscovery);
    }
    attachToKnownDeviceDiscoveryEvents() {
        [this.$iOSSimulatorDiscovery, this.$iOSDeviceDiscovery, this.$androidDeviceDiscovery].forEach(this.attachToDeviceDiscoveryEvents.bind(this));
    }
    attachToDeviceDiscoveryEvents(deviceDiscovery) {
        deviceDiscovery.on(constants.DeviceDiscoveryEventNames.DEVICE_FOUND, (device) => this.onDeviceFound(device));
        deviceDiscovery.on(constants.DeviceDiscoveryEventNames.DEVICE_LOST, (device) => this.onDeviceLost(device));
    }
    onDeviceFound(device) {
        this.$logger.trace(`Found device with identifier '${device.deviceInfo.identifier}'`);
        this._devices[device.deviceInfo.identifier] = device;
        this.emit(constants.DeviceDiscoveryEventNames.DEVICE_FOUND, device);
    }
    onDeviceLost(device) {
        this.$logger.trace(`Lost device with identifier '${device.deviceInfo.identifier}'`);
        if (device.detach) {
            device.detach();
        }
        delete this._devices[device.deviceInfo.identifier];
        this.emit(constants.DeviceDiscoveryEventNames.DEVICE_LOST, device);
    }
    detectCurrentlyAttachedDevices(options) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const deviceDiscovery of this._allDeviceDiscoveries) {
                try {
                    yield deviceDiscovery.startLookingForDevices(options);
                }
                catch (err) {
                    this.$logger.trace("Error while checking for devices.", err);
                }
            }
        });
    }
    startDeviceDetectionInterval() {
        return __awaiter(this, void 0, void 0, function* () {
            this.$processService.attachToProcessExitSignals(this, this.clearDeviceDetectionInterval);
            if (this.deviceDetectionInterval) {
                this.$logger.trace("Device detection interval is already started. New Interval will not be started.");
            }
            else {
                let isFirstExecution = true;
                return new Promise((resolve, reject) => {
                    this.deviceDetectionInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                        if (this.isDeviceDetectionIntervalInProgress) {
                            return;
                        }
                        this.isDeviceDetectionIntervalInProgress = true;
                        for (const deviceDiscovery of this._allDeviceDiscoveries) {
                            try {
                                const deviceLookingOptions = this.getDeviceLookingOptions();
                                yield deviceDiscovery.startLookingForDevices(deviceLookingOptions);
                            }
                            catch (err) {
                                this.$logger.trace("Error while checking for new devices.", err);
                            }
                        }
                        try {
                            const trustedDevices = _.filter(this._devices, device => device.deviceInfo.status === constants.CONNECTED_STATUS);
                            yield helpers_1.settlePromises(_.map(trustedDevices, device => device.applicationManager.checkForApplicationUpdates()));
                        }
                        catch (err) {
                            this.$logger.trace("Error checking for application updates on devices.", err);
                        }
                        if (isFirstExecution) {
                            isFirstExecution = false;
                            resolve();
                            this.deviceDetectionInterval.unref();
                        }
                        this.isDeviceDetectionIntervalInProgress = false;
                    }), DevicesService.DEVICE_LOOKING_INTERVAL);
                });
            }
        });
    }
    getDeviceByIdentifier(identifier) {
        const searchedDevice = _.find(this.getDeviceInstances(), (device) => { return device.deviceInfo.identifier === identifier; });
        if (!searchedDevice) {
            this.$errors.fail(this.$messages.Devices.NotFoundDeviceByIdentifierErrorMessageWithIdentifier, identifier, this.$staticConfig.CLIENT_NAME.toLowerCase());
        }
        return searchedDevice;
    }
    startLookingForDevices(options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.trace("startLookingForDevices; platform is %s", this._platform);
            if (!options) {
                options = this.getDeviceLookingOptions();
            }
            if (!this._platform) {
                yield this.detectCurrentlyAttachedDevices(options);
                yield this.startDeviceDetectionInterval();
            }
            else {
                if (this.$mobileHelper.isiOSPlatform(this._platform)) {
                    yield this.$iOSDeviceDiscovery.startLookingForDevices(options);
                    yield this.$iOSSimulatorDiscovery.startLookingForDevices(options);
                }
                else if (this.$mobileHelper.isAndroidPlatform(this._platform)) {
                    yield this.$androidDeviceDiscovery.startLookingForDevices(options);
                }
                for (const deviceDiscovery of this._otherDeviceDiscoveries) {
                    try {
                        yield deviceDiscovery.startLookingForDevices(options);
                    }
                    catch (err) {
                        this.$logger.trace("Error while checking for new devices.", err);
                    }
                }
            }
        });
    }
    getDeviceByIndex(index) {
        this.validateIndex(index - 1);
        return this.getDeviceInstances()[index - 1];
    }
    getDevice(deviceOption) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceLookingOptions = this.getDeviceLookingOptions();
            yield this.detectCurrentlyAttachedDevices(deviceLookingOptions);
            let device = null;
            let emulatorIdentifier = null;
            if (this._platform) {
                const emulatorService = this.resolveEmulatorServices();
                emulatorIdentifier = yield emulatorService.getRunningEmulatorId(deviceOption);
            }
            if (this.hasRunningDevice(emulatorIdentifier)) {
                device = this.getDeviceByIdentifier(emulatorIdentifier);
            }
            else if (helpers.isNumber(deviceOption)) {
                device = this.getDeviceByIndex(parseInt(deviceOption, 10));
            }
            else {
                device = this.getDeviceByIdentifier(deviceOption);
            }
            if (!device) {
                this.$errors.fail(this.$messages.Devices.NotFoundDeviceByIdentifierErrorMessage, this.$staticConfig.CLIENT_NAME.toLowerCase());
            }
            return device;
        });
    }
    executeOnDevice(action, canExecute) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!canExecute || canExecute(this._device)) {
                return { deviceIdentifier: this._device.deviceInfo.identifier, result: yield action(this._device) };
            }
        });
    }
    executeOnAllConnectedDevices(action, canExecute) {
        return __awaiter(this, void 0, void 0, function* () {
            const devices = this.filterDevicesByPlatform();
            const sortedDevices = _.sortBy(devices, device => device.deviceInfo.platform);
            const result = [];
            const errors = [];
            for (const device of sortedDevices) {
                try {
                    if (!canExecute || canExecute(device)) {
                        result.push({ deviceIdentifier: device.deviceInfo.identifier, result: yield action(device) });
                    }
                }
                catch (err) {
                    err.deviceIdentifier = device.deviceInfo.identifier;
                    errors.push(err);
                }
            }
            if (errors.length) {
                let preErrorMsg = "";
                if (errors.length > 1) {
                    preErrorMsg = "Multiple errors were thrown:" + os_1.EOL;
                }
                const singleError = (new Error(`${preErrorMsg}${errors.map(e => e.message || e).join(os_1.EOL)}`));
                singleError.allErrors = errors;
                throw singleError;
            }
            return result;
        });
    }
    deployOnDevices(deviceIdentifiers, packageFile, packageName) {
        this.$logger.trace(`Called deployOnDevices for identifiers ${deviceIdentifiers} for packageFile: ${packageFile}. packageName is ${packageName}.`);
        return _.map(deviceIdentifiers, deviceIdentifier => this.deployOnDevice(deviceIdentifier, packageFile, packageName));
    }
    execute(action, canExecute, options) {
        return __awaiter(this, void 0, void 0, function* () {
            assert.ok(this._isInitialized, "Devices services not initialized!");
            if (this.hasDevices) {
                if (this.$hostInfo.isDarwin && this._platform
                    && this.$mobileHelper.isiOSPlatform(this._platform)
                    && this.$options.emulator && !this.isOnlyiOSSimultorRunning()) {
                    const originalCanExecute = canExecute;
                    canExecute = (dev) => this.isiOSSimulator(dev) && (!originalCanExecute || !!(originalCanExecute(dev)));
                }
                return yield this.executeCore(action, canExecute);
            }
            else {
                const message = constants.ERROR_NO_DEVICES;
                if (options && options.allowNoDevices) {
                    this.$logger.info(message);
                }
                else {
                    if (!this.$hostInfo.isDarwin && this._platform && this.$mobileHelper.isiOSPlatform(this._platform)) {
                        this.$errors.failWithoutHelp(message);
                    }
                    else {
                        return yield this.executeCore(action, canExecute);
                    }
                }
            }
        });
    }
    startEmulatorIfNecessary(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data && data.deviceId && data.emulator) {
                this.$errors.failWithoutHelp(`--device and --emulator are incompatible options.
			If you are trying to run on specific emulator, use "${this.$staticConfig.CLIENT_NAME} run --device <DeviceID>`);
            }
            if (data && data.platform && !data.skipEmulatorStart) {
                this._platform = data.platform;
                try {
                    yield this.startLookingForDevices();
                }
                catch (err) {
                    this.$logger.trace("Error while checking for devices.", err);
                }
                const deviceInstances = this.getDeviceInstances();
                if (!data.deviceId && _.isEmpty(deviceInstances)) {
                    if (!this.$hostInfo.isDarwin && this.$mobileHelper.isiOSPlatform(data.platform)) {
                        this.$errors.failWithoutHelp(constants.ERROR_NO_DEVICES_CANT_USE_IOS_SIMULATOR);
                    }
                }
                try {
                    yield this._startEmulatorIfNecessary(data);
                }
                catch (err) {
                    const errorMessage = this.getEmulatorError(err, data.platform);
                    this.$errors.failWithoutHelp(errorMessage);
                }
            }
        });
    }
    _startEmulatorIfNecessary(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceInstances = this.getDeviceInstances();
            if (!data.deviceId && _.isEmpty(deviceInstances)) {
                return yield this.startEmulator(data.platform);
            }
            if (data.deviceId) {
                if (!helpers.isNumber(data.deviceId)) {
                    const activeDeviceInstance = _.find(deviceInstances, (device) => { return device.deviceInfo.identifier === data.deviceId; });
                    if (!activeDeviceInstance) {
                        return yield this.startEmulator(data.platform, data.deviceId);
                    }
                }
            }
            if (data.emulator && deviceInstances.length) {
                const runningDeviceInstance = _.some(deviceInstances, (value) => value.isEmulator);
                if (!runningDeviceInstance) {
                    return yield this.startEmulator(data.platform);
                }
            }
        });
    }
    initialize(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isInitialized) {
                return;
            }
            this.$logger.out("Searching for devices...");
            data = data || {};
            if (!data.skipEmulatorStart) {
                yield this.startEmulatorIfNecessary(data);
            }
            this._data = data;
            const platform = data.platform;
            const deviceOption = data.deviceId;
            if (platform && deviceOption) {
                this._platform = this.getPlatform(data.platform);
                this._device = yield this.getDevice(deviceOption);
                if (this._device.deviceInfo.platform !== this._platform) {
                    this.$errors.fail(constants.ERROR_CANNOT_RESOLVE_DEVICE);
                }
                this.$logger.warn("Your application will be deployed only on the device specified by the provided index or identifier.");
            }
            else if (!platform && deviceOption) {
                this._device = yield this.getDevice(deviceOption);
                this._platform = this._device.deviceInfo.platform;
            }
            else if (platform && !deviceOption) {
                this._platform = this.getPlatform(platform);
                yield this.startLookingForDevices();
            }
            else {
                if (data.skipInferPlatform) {
                    if (data.skipDeviceDetectionInterval) {
                        yield this.detectCurrentlyAttachedDevices();
                    }
                    else {
                        const deviceLookingOptions = this.getDeviceLookingOptions(this._platform, true);
                        yield this.startLookingForDevices(deviceLookingOptions);
                    }
                }
                else {
                    yield this.detectCurrentlyAttachedDevices();
                    const devices = this.getDeviceInstances();
                    const platforms = _(devices)
                        .map(device => device.deviceInfo.platform)
                        .filter(pl => {
                        try {
                            return this.getPlatform(pl);
                        }
                        catch (err) {
                            this.$logger.warn(err.message);
                            return null;
                        }
                    })
                        .uniq()
                        .value();
                    if (platforms.length === 1) {
                        this._platform = platforms[0];
                    }
                    else if (platforms.length === 0) {
                        this.$errors.fail({ formatStr: constants.ERROR_NO_DEVICES, suppressCommandHelp: true });
                    }
                    else {
                        this.$errors.fail("Multiple device platforms detected (%s). Specify platform or device on command line.", helpers.formatListOfNames(platforms, "and"));
                    }
                }
            }
            if (!this.$hostInfo.isDarwin && this._platform && this.$mobileHelper.isiOSPlatform(this._platform) && this.$options.emulator) {
                this.$errors.failWithoutHelp(constants.ERROR_CANT_USE_SIMULATOR);
            }
            this._isInitialized = true;
        });
    }
    get hasDevices() {
        if (!this._platform) {
            return this.getDeviceInstances().length !== 0;
        }
        else {
            return this.filterDevicesByPlatform().length !== 0;
        }
    }
    isOnlyiOSSimultorRunning() {
        const devices = this.getDeviceInstances();
        return this._platform && this.$mobileHelper.isiOSPlatform(this._platform) && _.find(devices, d => d.isEmulator) && !_.find(devices, d => !d.isEmulator);
    }
    getDeviceByDeviceOption() {
        return this._device;
    }
    mapAbstractToTcpPort(deviceIdentifier, appIdentifier, framework) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.$androidProcessService.mapAbstractToTcpPort(deviceIdentifier, appIdentifier, framework);
        });
    }
    getDebuggableApps(deviceIdentifiers) {
        return _.map(deviceIdentifiers, (deviceIdentifier) => this.getDebuggableAppsCore(deviceIdentifier));
    }
    getDebuggableViews(deviceIdentifier, appIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const device = this.getDeviceByIdentifier(deviceIdentifier), debuggableViewsPerApp = yield device.applicationManager.getDebuggableAppViews([appIdentifier]);
            return debuggableViewsPerApp && debuggableViewsPerApp[appIdentifier];
        });
    }
    clearDeviceDetectionInterval() {
        if (this.deviceDetectionInterval) {
            clearInterval(this.deviceDetectionInterval);
        }
        else {
            this.$logger.trace("Device detection interval is not started, so it cannot be stopped.");
        }
    }
    getDebuggableAppsCore(deviceIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const device = this.getDeviceByIdentifier(deviceIdentifier);
            return yield device.applicationManager.getDebuggableApps();
        });
    }
    deployOnDevice(deviceIdentifier, packageFile, packageName) {
        return __awaiter(this, void 0, void 0, function* () {
            const device = this.getDeviceByIdentifier(deviceIdentifier);
            yield device.applicationManager.reinstallApplication(packageName, packageFile);
            this.$logger.info(`Successfully deployed on device with identifier '${device.deviceInfo.identifier}'.`);
            yield device.applicationManager.tryStartApplication(packageName);
        });
    }
    hasRunningDevice(identifier) {
        return _.some(this.getDeviceInstances(), (device) => {
            return device.deviceInfo.identifier === identifier;
        });
    }
    filterDevicesByPlatform() {
        return _.filter(this.getDeviceInstances(), (device) => {
            if (this.$options.emulator && !device.isEmulator) {
                return false;
            }
            if (this._platform) {
                return device.deviceInfo.platform === this._platform;
            }
            return true;
        });
    }
    validateIndex(index) {
        if (index < 0 || index > this.getDeviceInstances().length) {
            throw new Error(util.format(this.$messages.Devices.NotFoundDeviceByIndexErrorMessage, index, this.$staticConfig.CLIENT_NAME.toLowerCase()));
        }
    }
    resolveEmulatorServices(platform) {
        platform = platform || this._platform;
        if (this.$mobileHelper.isiOSPlatform(platform)) {
            return this.$injector.resolve("iOSEmulatorServices");
        }
        else if (this.$mobileHelper.isAndroidPlatform(platform)) {
            return this.$injector.resolve("androidEmulatorServices");
        }
        return null;
    }
    startEmulator(platform, emulatorImage) {
        return __awaiter(this, void 0, void 0, function* () {
            platform = platform || this._platform;
            const deviceLookingOptions = this.getDeviceLookingOptions(platform);
            const emulatorServices = this.resolveEmulatorServices(platform);
            if (!emulatorServices) {
                this.$errors.failWithoutHelp("Unable to detect platform for which to start emulator.");
            }
            yield emulatorServices.startEmulator(emulatorImage);
            if (this.$mobileHelper.isAndroidPlatform(platform)) {
                yield this.$androidDeviceDiscovery.startLookingForDevices(deviceLookingOptions);
            }
            else if (this.$mobileHelper.isiOSPlatform(platform) && this.$hostInfo.isDarwin) {
                yield this.$iOSSimulatorDiscovery.startLookingForDevices(deviceLookingOptions);
            }
        });
    }
    executeCore(action, canExecute) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._device) {
                return [yield this.executeOnDevice(action, canExecute)];
            }
            return this.executeOnAllConnectedDevices(action, canExecute);
        });
    }
    isApplicationInstalledOnDevice(deviceIdentifier, appIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            let isInstalled = false;
            let isLiveSyncSupported = false;
            const device = this.getDeviceByIdentifier(deviceIdentifier);
            try {
                isInstalled = yield device.applicationManager.isApplicationInstalled(appIdentifier);
                yield device.applicationManager.tryStartApplication(appIdentifier);
                isLiveSyncSupported = (yield isInstalled) && !!device.applicationManager.isLiveSyncSupported(appIdentifier);
            }
            catch (err) {
                this.$logger.trace("Error while checking is application installed. Error is: ", err);
            }
            return {
                appIdentifier,
                deviceIdentifier,
                isInstalled,
                isLiveSyncSupported
            };
        });
    }
    isCompanionAppInstalledOnDevice(deviceIdentifier, framework) {
        return __awaiter(this, void 0, void 0, function* () {
            let isInstalled = false;
            let isLiveSyncSupported = false;
            const device = this.getDeviceByIdentifier(deviceIdentifier);
            const appIdentifier = this.$companionAppsService.getCompanionAppIdentifier(framework, device.deviceInfo.platform);
            try {
                isLiveSyncSupported = isInstalled = yield device.applicationManager.isApplicationInstalled(appIdentifier);
            }
            catch (err) {
                this.$logger.trace("Error while checking is application installed. Error is: ", err);
            }
            return {
                appIdentifier,
                deviceIdentifier,
                isInstalled,
                isLiveSyncSupported
            };
        });
    }
    getDeviceLookingOptions(platform, shouldReturnImmediateResult) {
        platform = platform || this._platform;
        shouldReturnImmediateResult = shouldReturnImmediateResult || false;
        return { shouldReturnImmediateResult: shouldReturnImmediateResult, platform: platform };
    }
    getEmulatorError(error, platform) {
        let emulatorName = constants.DeviceTypes.Emulator;
        if (this.$mobileHelper.isiOSPlatform(platform)) {
            emulatorName = constants.DeviceTypes.Simulator;
        }
        return `Cannot find connected devices.${os_1.EOL}` +
            `${emulatorName} start failed with: ${error.message}${os_1.EOL}` +
            `To list currently connected devices and verify that the specified identifier exists, run '${this.$staticConfig.CLIENT_NAME.toLowerCase()} device'.${os_1.EOL}` +
            `To list available ${emulatorName.toLowerCase()} images, run '${this.$staticConfig.CLIENT_NAME.toLowerCase()} device <Platform> --available-devices'.`;
    }
}
DevicesService.DEVICE_LOOKING_INTERVAL = 200;
__decorate([
    decorators_1.exported("devicesService")
], DevicesService.prototype, "getDevices", null);
__decorate([
    decorators_1.exported("devicesService")
], DevicesService.prototype, "setLogLevel", null);
__decorate([
    decorators_1.exported("devicesService")
], DevicesService.prototype, "isAppInstalledOnDevices", null);
__decorate([
    decorators_1.exported("devicesService")
], DevicesService.prototype, "isCompanionAppInstalledOnDevices", null);
__decorate([
    decorators_1.exported("devicesService")
], DevicesService.prototype, "getInstalledApplications", null);
__decorate([
    decorators_1.exported("devicesService")
], DevicesService.prototype, "addDeviceDiscovery", null);
__decorate([
    decorators_1.exported("devicesService")
], DevicesService.prototype, "deployOnDevices", null);
__decorate([
    decorators_1.exported("devicesService")
], DevicesService.prototype, "initialize", null);
__decorate([
    decorators_1.exported("devicesService")
], DevicesService.prototype, "mapAbstractToTcpPort", null);
__decorate([
    decorators_1.exported("devicesService")
], DevicesService.prototype, "getDebuggableApps", null);
__decorate([
    decorators_1.exported("devicesService")
], DevicesService.prototype, "getDebuggableViews", null);
exports.DevicesService = DevicesService;
$injector.register("devicesService", DevicesService);
