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
const constants_1 = require("../common/constants");
const helpers_1 = require("../common/helpers");
const decorators_1 = require("../common/decorators");
const constants_2 = require("../constants");
class DebugPlatformCommand {
    constructor(platform, $debugService, $devicesService, $platformService, $projectData, $options, $platformsData, $logger, $errors, $debugDataService, $liveSyncService, $prompter, $liveSyncCommandHelper) {
        this.platform = platform;
        this.$debugService = $debugService;
        this.$devicesService = $devicesService;
        this.$platformService = $platformService;
        this.$projectData = $projectData;
        this.$options = $options;
        this.$platformsData = $platformsData;
        this.$logger = $logger;
        this.$errors = $errors;
        this.$debugDataService = $debugDataService;
        this.$liveSyncService = $liveSyncService;
        this.$prompter = $prompter;
        this.$liveSyncCommandHelper = $liveSyncCommandHelper;
        this.allowedParameters = [];
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const debugOptions = _.cloneDeep(this.$options.argv);
            const debugData = this.$debugDataService.createDebugData(this.$projectData, this.$options);
            yield this.$platformService.trackProjectType(this.$projectData);
            const selectedDeviceForDebug = yield this.getDeviceForDebug();
            debugData.deviceIdentifier = selectedDeviceForDebug.deviceInfo.identifier;
            if (this.$options.start) {
                yield this.$liveSyncService.printDebugInformation(yield this.$debugService.debug(debugData, debugOptions));
                return;
            }
            yield this.$devicesService.detectCurrentlyAttachedDevices({ shouldReturnImmediateResult: false, platform: this.platform });
            yield this.$liveSyncCommandHelper.executeLiveSyncOperation([selectedDeviceForDebug], this.platform, {
                [selectedDeviceForDebug.deviceInfo.identifier]: true
            });
        });
    }
    getDeviceForDebug() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.$options.forDevice && this.$options.emulator) {
                this.$errors.fail(constants_2.DebugCommandErrors.UNABLE_TO_USE_FOR_DEVICE_AND_EMULATOR);
            }
            yield this.$devicesService.detectCurrentlyAttachedDevices({ platform: this.platform, shouldReturnImmediateResult: false });
            if (this.$options.device) {
                const device = yield this.$devicesService.getDevice(this.$options.device);
                return device;
            }
            const availableDevicesAndEmulators = this.$devicesService.getDeviceInstances()
                .filter(d => d.deviceInfo.status === constants_1.CONNECTED_STATUS && (!this.platform || d.deviceInfo.platform.toLowerCase() === this.platform.toLowerCase()));
            const selectedDevices = availableDevicesAndEmulators.filter(d => this.$options.emulator ? d.isEmulator : (this.$options.forDevice ? !d.isEmulator : true));
            if (selectedDevices.length > 1) {
                if (helpers_1.isInteractive()) {
                    const choices = selectedDevices.map(e => `${e.deviceInfo.identifier} - ${e.deviceInfo.displayName}`);
                    const selectedDeviceString = yield this.$prompter.promptForChoice("Select device for debugging", choices);
                    const selectedDevice = _.find(selectedDevices, d => `${d.deviceInfo.identifier} - ${d.deviceInfo.displayName}` === selectedDeviceString);
                    return selectedDevice;
                }
                else {
                    const sortedInstances = _.sortBy(selectedDevices, e => e.deviceInfo.version);
                    const emulators = sortedInstances.filter(e => e.isEmulator);
                    const devices = sortedInstances.filter(d => !d.isEmulator);
                    let selectedInstance;
                    if (this.$options.emulator || this.$options.forDevice) {
                        selectedInstance = _.last(sortedInstances);
                    }
                    else {
                        if (emulators.length) {
                            selectedInstance = _.last(emulators);
                        }
                        else {
                            selectedInstance = _.last(devices);
                        }
                    }
                    this.$logger.warn(`Multiple devices/emulators found. Starting debugger on ${selectedInstance.deviceInfo.identifier}. ` +
                        "If you want to debug on specific device/emulator, you can specify it with --device option.");
                    return selectedInstance;
                }
            }
            else if (selectedDevices.length === 1) {
                return _.head(selectedDevices);
            }
            this.$errors.failWithoutHelp(constants_2.DebugCommandErrors.NO_DEVICES_EMULATORS_FOUND_FOR_OPTIONS);
        });
    }
    canExecute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.$platformService.isPlatformSupportedForOS(this.platform, this.$projectData)) {
                this.$errors.fail(`Applications for platform ${this.platform} can not be built on this OS`);
            }
            if (this.$options.release) {
                this.$errors.fail("--release flag is not applicable to this command");
            }
            const platformData = this.$platformsData.getPlatformData(this.platform, this.$projectData);
            const platformProjectService = platformData.platformProjectService;
            yield platformProjectService.validate(this.$projectData);
            yield this.$devicesService.initialize({
                platform: this.platform,
                deviceId: this.$options.device,
                emulator: this.$options.emulator,
                skipDeviceDetectionInterval: true
            });
            return true;
        });
    }
}
exports.DebugPlatformCommand = DebugPlatformCommand;
class DebugIOSCommand {
    constructor($errors, $devicePlatformsConstants, $platformService, $options, $injector, $projectData, $platformsData, $iosDeviceOperations) {
        this.$errors = $errors;
        this.$devicePlatformsConstants = $devicePlatformsConstants;
        this.$platformService = $platformService;
        this.$options = $options;
        this.$injector = $injector;
        this.$projectData = $projectData;
        this.$platformsData = $platformsData;
        this.allowedParameters = [];
        this.platform = this.$devicePlatformsConstants.iOS;
        this.$projectData.initializeProjectData();
        $iosDeviceOperations.setShouldDispose(false);
    }
    get debugPlatformCommand() {
        return this.$injector.resolve(DebugPlatformCommand, { platform: this.platform });
    }
    execute(args) {
        return this.debugPlatformCommand.execute(args);
    }
    canExecute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
                this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`);
            }
            return (yield this.debugPlatformCommand.canExecute(args)) && (yield this.$platformService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, this.$platformsData.availablePlatforms.iOS));
        });
    }
}
__decorate([
    decorators_1.cache()
], DebugIOSCommand.prototype, "debugPlatformCommand", null);
exports.DebugIOSCommand = DebugIOSCommand;
$injector.registerCommand("debug|ios", DebugIOSCommand);
class DebugAndroidCommand {
    constructor($errors, $devicePlatformsConstants, $platformService, $options, $injector, $projectData, $platformsData) {
        this.$errors = $errors;
        this.$devicePlatformsConstants = $devicePlatformsConstants;
        this.$platformService = $platformService;
        this.$options = $options;
        this.$injector = $injector;
        this.$projectData = $projectData;
        this.$platformsData = $platformsData;
        this.allowedParameters = [];
        this.platform = this.$devicePlatformsConstants.Android;
        this.$projectData.initializeProjectData();
    }
    get debugPlatformCommand() {
        return this.$injector.resolve(DebugPlatformCommand, { platform: this.platform });
    }
    execute(args) {
        return this.debugPlatformCommand.execute(args);
    }
    canExecute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.debugPlatformCommand.canExecute(args)) && (yield this.$platformService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, this.$platformsData.availablePlatforms.Android));
        });
    }
}
__decorate([
    decorators_1.cache()
], DebugAndroidCommand.prototype, "debugPlatformCommand", null);
exports.DebugAndroidCommand = DebugAndroidCommand;
$injector.registerCommand("debug|android", DebugAndroidCommand);
