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
const url_1 = require("url");
const events_1 = require("events");
const constants_1 = require("../constants");
const constants_2 = require("../common/constants");
class DebugService extends events_1.EventEmitter {
    constructor($devicesService, $errors, $injector, $hostInfo, $mobileHelper, $analyticsService) {
        super();
        this.$devicesService = $devicesService;
        this.$errors = $errors;
        this.$injector = $injector;
        this.$hostInfo = $hostInfo;
        this.$mobileHelper = $mobileHelper;
        this.$analyticsService = $analyticsService;
        this._platformDebugServices = {};
    }
    debug(debugData, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const device = this.$devicesService.getDeviceByIdentifier(debugData.deviceIdentifier);
            if (!device) {
                this.$errors.failWithoutHelp(`Cannot find device with identifier ${debugData.deviceIdentifier}.`);
            }
            if (device.deviceInfo.status !== constants_2.CONNECTED_STATUS) {
                this.$errors.failWithoutHelp(`The device with identifier ${debugData.deviceIdentifier} is unreachable. Make sure it is Trusted and try again.`);
            }
            yield this.$analyticsService.trackEventActionInGoogleAnalytics({
                action: "Debug",
                device,
                additionalData: this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform) && (!options || !options.chrome) ? "Inspector" : "Chrome",
                projectDir: debugData.projectDir
            });
            if (!(yield device.applicationManager.isApplicationInstalled(debugData.applicationIdentifier))) {
                this.$errors.failWithoutHelp(`The application ${debugData.applicationIdentifier} is not installed on device with identifier ${debugData.deviceIdentifier}.`);
            }
            const debugOptions = _.cloneDeep(options);
            let result;
            const debugService = this.getDebugService(device);
            if (!debugService) {
                this.$errors.failWithoutHelp(`Unsupported device OS: ${device.deviceInfo.platform}. You can debug your applications only on iOS or Android.`);
            }
            if (this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform)) {
                if (device.isEmulator && !debugData.pathToAppPackage && debugOptions.debugBrk) {
                    this.$errors.failWithoutHelp("To debug on iOS simulator you need to provide path to the app package.");
                }
                if (this.$hostInfo.isWindows) {
                    debugOptions.emulator = false;
                }
                else if (!this.$hostInfo.isDarwin) {
                    this.$errors.failWithoutHelp(`Debugging on iOS devices is not supported for ${os_1.platform()} yet.`);
                }
                result = yield debugService.debug(debugData, debugOptions);
            }
            else if (this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform)) {
                result = yield debugService.debug(debugData, debugOptions);
            }
            return this.getDebugInformation(result, device.deviceInfo.identifier);
        });
    }
    debugStop(deviceIdentifier) {
        const debugService = this.getDebugServiceByIdentifier(deviceIdentifier);
        return debugService.debugStop();
    }
    getDebugService(device) {
        if (!this._platformDebugServices[device.deviceInfo.identifier]) {
            const platform = device.deviceInfo.platform;
            if (this.$mobileHelper.isiOSPlatform(platform)) {
                this._platformDebugServices[device.deviceInfo.identifier] = this.$injector.resolve("iOSDebugService", { device });
            }
            else if (this.$mobileHelper.isAndroidPlatform(platform)) {
                this._platformDebugServices[device.deviceInfo.identifier] = this.$injector.resolve("androidDebugService", { device });
            }
            else {
                this.$errors.failWithoutHelp(constants_1.DebugCommandErrors.UNSUPPORTED_DEVICE_OS_FOR_DEBUGGING);
            }
            this.attachConnectionErrorHandlers(this._platformDebugServices[device.deviceInfo.identifier]);
        }
        return this._platformDebugServices[device.deviceInfo.identifier];
    }
    getDebugServiceByIdentifier(deviceIdentifier) {
        const device = this.$devicesService.getDeviceByIdentifier(deviceIdentifier);
        return this.getDebugService(device);
    }
    attachConnectionErrorHandlers(platformDebugService) {
        let connectionErrorHandler = (e) => this.emit(constants_1.CONNECTION_ERROR_EVENT_NAME, e);
        connectionErrorHandler = connectionErrorHandler.bind(this);
        platformDebugService.on(constants_1.CONNECTION_ERROR_EVENT_NAME, connectionErrorHandler);
    }
    getDebugInformation(fullUrl, deviceIdentifier) {
        const debugInfo = {
            url: fullUrl,
            port: 0,
            deviceIdentifier
        };
        if (fullUrl) {
            const parseQueryString = true;
            const wsQueryParam = url_1.parse(fullUrl, parseQueryString).query.ws;
            const hostPortSplit = wsQueryParam && wsQueryParam.split(":");
            debugInfo.port = hostPortSplit && +hostPortSplit[1];
        }
        return debugInfo;
    }
}
exports.DebugService = DebugService;
$injector.register("debugService", DebugService);
