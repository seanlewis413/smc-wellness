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
const helpers_1 = require("../helpers");
const constants_1 = require("../constants");
class EmulatorImageService {
    constructor($mobileHelper, $childProcess, $devicesService, $logger, $androidEmulatorServices) {
        this.$mobileHelper = $mobileHelper;
        this.$childProcess = $childProcess;
        this.$devicesService = $devicesService;
        this.$logger = $logger;
        this.$androidEmulatorServices = $androidEmulatorServices;
    }
    getEmulatorInfo(platform, idOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.$mobileHelper.isAndroidPlatform(platform)) {
                const androidEmulators = this.getAndroidEmulators();
                const found = androidEmulators.filter((info) => info.id === idOrName);
                if (found.length > 0) {
                    return found[0];
                }
                yield this.$devicesService.initialize({ platform: platform, deviceId: null, skipInferPlatform: true });
                let info = null;
                const action = (device) => __awaiter(this, void 0, void 0, function* () {
                    if (device.deviceInfo.identifier === idOrName) {
                        info = {
                            id: device.deviceInfo.identifier,
                            name: device.deviceInfo.displayName,
                            version: device.deviceInfo.version,
                            platform: "Android",
                            type: constants_1.DeviceTypes.Emulator,
                            isRunning: true
                        };
                    }
                });
                yield this.$devicesService.execute(action, undefined, { allowNoDevices: true });
                return info;
            }
            if (this.$mobileHelper.isiOSPlatform(platform)) {
                const emulators = yield this.getiOSEmulators();
                let sdk = null;
                const versionStart = idOrName.indexOf("(");
                if (versionStart > 0) {
                    sdk = idOrName.substring(versionStart + 1, idOrName.indexOf(")", versionStart)).trim();
                    idOrName = idOrName.substring(0, versionStart - 1).trim();
                }
                const found = emulators.filter((info) => {
                    const sdkMatch = sdk ? info.version === sdk : true;
                    return sdkMatch && info.id === idOrName || info.name === idOrName;
                });
                return found.length > 0 ? found[0] : null;
            }
            return null;
        });
    }
    listAvailableEmulators(platform) {
        return __awaiter(this, void 0, void 0, function* () {
            let emulators = [];
            if (!platform || this.$mobileHelper.isiOSPlatform(platform)) {
                const iosEmulators = yield this.getiOSEmulators();
                if (iosEmulators) {
                    emulators = emulators.concat(iosEmulators);
                }
            }
            if (!platform || this.$mobileHelper.isAndroidPlatform(platform)) {
                const androidEmulators = this.getAndroidEmulators();
                if (androidEmulators) {
                    emulators = emulators.concat(androidEmulators);
                }
            }
            this.outputEmulators("\nAvailable emulators", emulators);
        });
    }
    getiOSEmulators() {
        return __awaiter(this, void 0, void 0, function* () {
            const output = yield this.$childProcess.exec("xcrun simctl list --json");
            const list = JSON.parse(output);
            const emulators = [];
            for (const osName in list["devices"]) {
                if (osName.indexOf("iOS") === -1) {
                    continue;
                }
                const os = list["devices"][osName];
                const version = this.parseiOSVersion(osName);
                for (const device of os) {
                    if (device["availability"] !== "(available)") {
                        continue;
                    }
                    const emulatorInfo = {
                        id: device["udid"],
                        name: device["name"],
                        isRunning: device["state"] === "Booted",
                        type: "simulator",
                        version: version,
                        platform: "iOS"
                    };
                    emulators.push(emulatorInfo);
                }
            }
            return emulators;
        });
    }
    getAndroidEmulators() {
        const androidVirtualDevices = this.$androidEmulatorServices.getAvds().map(avd => this.$androidEmulatorServices.getInfoFromAvd(avd));
        const emulators = _.map(androidVirtualDevices, avd => {
            return { name: avd.device, version: avd.target, id: avd.name, platform: "Android", type: constants_1.DeviceTypes.Emulator, isRunning: false };
        });
        return emulators;
    }
    parseiOSVersion(osName) {
        osName = osName.replace("com.apple.CoreSimulator.SimRuntime.iOS-", "");
        osName = osName.replace(/-/g, ".");
        osName = osName.replace("iOS", "");
        osName = osName.trim();
        return osName;
    }
    outputEmulators(title, emulators) {
        this.$logger.out(title);
        const table = helpers_1.createTable(["Device Name", "Platform", "Version", "Device Identifier"], []);
        for (const info of emulators) {
            table.push([info.name, info.platform, info.version, info.id]);
        }
        this.$logger.out(table.toString());
    }
}
exports.EmulatorImageService = EmulatorImageService;
$injector.register("emulatorImageService", EmulatorImageService);
