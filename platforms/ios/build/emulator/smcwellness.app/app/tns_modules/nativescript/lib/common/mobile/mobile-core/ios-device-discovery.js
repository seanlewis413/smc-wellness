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
const device_discovery_1 = require("./device-discovery");
const ios_device_1 = require("../ios/device/ios-device");
class IOSDeviceDiscovery extends device_discovery_1.DeviceDiscovery {
    constructor($injector, $logger, $iTunesValidator, $mobileHelper, $iosDeviceOperations) {
        super();
        this.$injector = $injector;
        this.$logger = $logger;
        this.$iTunesValidator = $iTunesValidator;
        this.$mobileHelper = $mobileHelper;
        this.$iosDeviceOperations = $iosDeviceOperations;
    }
    validateiTunes() {
        if (!this._iTunesErrorMessage) {
            this._iTunesErrorMessage = this.$iTunesValidator.getError();
            if (this._iTunesErrorMessage) {
                this.$logger.warn(this._iTunesErrorMessage);
            }
        }
        return !this._iTunesErrorMessage;
    }
    startLookingForDevices(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options && options.platform && !this.$mobileHelper.isiOSPlatform(options.platform)) {
                return;
            }
            if (this.validateiTunes()) {
                yield this.$iosDeviceOperations.startLookingForDevices((deviceInfo) => {
                    this.createAndAddDevice(deviceInfo);
                }, (deviceInfo) => {
                    this.removeDevice(deviceInfo.deviceId);
                }, options);
            }
        });
    }
    createAndAddDevice(deviceActionInfo) {
        const device = this.$injector.resolve(ios_device_1.IOSDevice, { deviceActionInfo: deviceActionInfo });
        this.addDevice(device);
    }
}
exports.IOSDeviceDiscovery = IOSDeviceDiscovery;
$injector.register("iOSDeviceDiscovery", IOSDeviceDiscovery);
