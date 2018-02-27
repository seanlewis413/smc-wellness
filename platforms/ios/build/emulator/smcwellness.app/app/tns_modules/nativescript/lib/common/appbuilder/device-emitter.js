"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const constants_1 = require("../constants");
class DeviceEmitter extends events_1.EventEmitter {
    constructor($deviceLogProvider, $devicesService, $companionAppsService) {
        super();
        this.$deviceLogProvider = $deviceLogProvider;
        this.$devicesService = $devicesService;
        this.$companionAppsService = $companionAppsService;
        this.initialize();
    }
    get companionAppIdentifiers() {
        if (!this._companionAppIdentifiers) {
            this._companionAppIdentifiers = this.$companionAppsService.getAllCompanionAppIdentifiers();
        }
        return this._companionAppIdentifiers;
    }
    initialize() {
        this.$devicesService.on(constants_1.DeviceDiscoveryEventNames.DEVICE_FOUND, (device) => {
            this.emit(constants_1.DeviceDiscoveryEventNames.DEVICE_FOUND, device.deviceInfo);
            this.attachApplicationChangedHandlers(device);
            device.openDeviceLogStream();
        });
        this.$devicesService.on(constants_1.DeviceDiscoveryEventNames.DEVICE_LOST, (device) => {
            this.emit(constants_1.DeviceDiscoveryEventNames.DEVICE_LOST, device.deviceInfo);
        });
        this.$deviceLogProvider.on("data", (identifier, data) => {
            this.emit(constants_1.DEVICE_LOG_EVENT_NAME, identifier, data.toString());
        });
    }
    attachApplicationChangedHandlers(device) {
        device.applicationManager.on("applicationInstalled", (appIdentifier) => {
            this.emit("applicationInstalled", device.deviceInfo.identifier, appIdentifier);
            this.checkCompanionAppChanged(device, appIdentifier, "companionAppInstalled");
        });
        device.applicationManager.on("applicationUninstalled", (appIdentifier) => {
            this.emit("applicationUninstalled", device.deviceInfo.identifier, appIdentifier);
            this.checkCompanionAppChanged(device, appIdentifier, "companionAppUninstalled");
        });
        device.applicationManager.on("debuggableAppFound", (debuggableAppInfo) => {
            this.emit("debuggableAppFound", debuggableAppInfo);
        });
        device.applicationManager.on("debuggableAppLost", (debuggableAppInfo) => {
            this.emit("debuggableAppLost", debuggableAppInfo);
        });
        device.applicationManager.on("debuggableViewFound", (appIdentifier, debuggableWebViewInfo) => {
            this.emit("debuggableViewFound", device.deviceInfo.identifier, appIdentifier, debuggableWebViewInfo);
        });
        device.applicationManager.on("debuggableViewLost", (appIdentifier, debuggableWebViewInfo) => {
            this.emit("debuggableViewLost", device.deviceInfo.identifier, appIdentifier, debuggableWebViewInfo);
        });
        device.applicationManager.on("debuggableViewChanged", (appIdentifier, debuggableWebViewInfo) => {
            this.emit("debuggableViewChanged", device.deviceInfo.identifier, appIdentifier, debuggableWebViewInfo);
        });
    }
    checkCompanionAppChanged(device, applicationName, eventName) {
        const devicePlatform = device.deviceInfo.platform.toLowerCase();
        _.each(this.companionAppIdentifiers, (platformsCompanionAppIdentifiers, framework) => {
            if (applicationName === platformsCompanionAppIdentifiers[devicePlatform]) {
                this.emit(eventName, device.deviceInfo.identifier, framework);
                return false;
            }
        });
    }
}
exports.DeviceEmitter = DeviceEmitter;
$injector.register("deviceEmitter", DeviceEmitter);
