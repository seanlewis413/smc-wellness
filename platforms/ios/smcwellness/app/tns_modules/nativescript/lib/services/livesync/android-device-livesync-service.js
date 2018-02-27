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
const device_android_debug_bridge_1 = require("../../common/mobile/android/device-android-debug-bridge");
const android_device_hash_service_1 = require("../../common/mobile/android/android-device-hash-service");
const device_livesync_service_base_1 = require("./device-livesync-service-base");
const helpers = require("../../common/helpers");
const constants_1 = require("../../constants");
const decorators_1 = require("../../common/decorators");
const path = require("path");
const net = require("net");
class AndroidDeviceLiveSyncService extends device_livesync_service_base_1.DeviceLiveSyncServiceBase {
    constructor(_device, $mobileHelper, $devicePathProvider, $injector, $platformsData) {
        super($platformsData);
        this.$mobileHelper = $mobileHelper;
        this.$devicePathProvider = $devicePathProvider;
        this.$injector = $injector;
        this.$platformsData = $platformsData;
        this.device = (_device);
    }
    refreshApplication(projectData, liveSyncInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceAppData = liveSyncInfo.deviceAppData;
            const localToDevicePaths = liveSyncInfo.modifiedFilesData;
            const deviceProjectRootDirname = yield this.$devicePathProvider.getDeviceProjectRootPath(liveSyncInfo.deviceAppData.device, {
                appIdentifier: liveSyncInfo.deviceAppData.appIdentifier,
                getDirname: true
            });
            yield this.device.adb.executeShellCommand(["chmod",
                "777",
                path.dirname(deviceProjectRootDirname),
                deviceProjectRootDirname,
                `${deviceProjectRootDirname}/sync`]);
            const reloadedSuccessfully = yield this.reloadApplicationFiles(deviceAppData, localToDevicePaths);
            const canExecuteFastSync = reloadedSuccessfully && !liveSyncInfo.isFullSync && !_.some(localToDevicePaths, (localToDevicePath) => !this.canExecuteFastSync(localToDevicePath.getLocalPath(), projectData, this.device.deviceInfo.platform));
            if (!canExecuteFastSync) {
                return this.restartApplication(deviceAppData);
            }
        });
    }
    cleanLivesyncDirectories(deviceAppData) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceRootPath = yield this.$devicePathProvider.getDeviceProjectRootPath(deviceAppData.device, {
                appIdentifier: deviceAppData.appIdentifier,
                getDirname: true
            });
            yield this.device.adb.executeShellCommand(["rm", "-rf", yield this.$mobileHelper.buildDevicePath(deviceRootPath, constants_1.LiveSyncPaths.FULLSYNC_DIR_NAME),
                this.$mobileHelper.buildDevicePath(deviceRootPath, constants_1.LiveSyncPaths.SYNC_DIR_NAME),
                yield this.$mobileHelper.buildDevicePath(deviceRootPath, constants_1.LiveSyncPaths.REMOVEDSYNC_DIR_NAME)]);
        });
    }
    restartApplication(deviceAppData) {
        return __awaiter(this, void 0, void 0, function* () {
            const devicePathRoot = `/data/data/${deviceAppData.appIdentifier}/files`;
            const devicePath = this.$mobileHelper.buildDevicePath(devicePathRoot, "code_cache", "secondary_dexes", "proxyThumb");
            yield this.device.adb.executeShellCommand(["rm", "-rf", devicePath]);
            yield this.device.applicationManager.restartApplication(deviceAppData.appIdentifier);
        });
    }
    beforeLiveSyncAction(deviceAppData) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceRootPath = yield this.$devicePathProvider.getDeviceProjectRootPath(deviceAppData.device, {
                appIdentifier: deviceAppData.appIdentifier,
                getDirname: true
            });
            const deviceRootDir = path.dirname(deviceRootPath);
            const deviceRootBasename = path.basename(deviceRootPath);
            const listResult = yield this.device.adb.executeShellCommand(["ls", "-l", deviceRootDir]);
            const regex = new RegExp(`^-.*${deviceRootBasename}$`, "m");
            const matchingFile = (listResult || "").match(regex);
            if (matchingFile && matchingFile[0] && _.startsWith(matchingFile[0], '-')) {
                yield this.device.adb.executeShellCommand(["rm", "-f", deviceRootPath]);
            }
            yield this.cleanLivesyncDirectories(deviceAppData);
        });
    }
    reloadApplicationFiles(deviceAppData, localToDevicePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.device.adb.executeCommand(["forward", `tcp:${AndroidDeviceLiveSyncService.BACKEND_PORT.toString()}`, `localabstract:${deviceAppData.appIdentifier}-livesync`]);
            if (yield this.awaitRuntimeReloadSuccessMessage()) {
                yield this.cleanLivesyncDirectories(deviceAppData);
            }
            else {
                return false;
            }
            return true;
        });
    }
    removeFiles(deviceAppData, localToDevicePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceRootPath = yield this.$devicePathProvider.getDeviceProjectRootPath(deviceAppData.device, {
                appIdentifier: deviceAppData.appIdentifier,
                getDirname: true
            });
            for (const localToDevicePathData of localToDevicePaths) {
                const relativeUnixPath = _.trimStart(helpers.fromWindowsRelativePathToUnix(localToDevicePathData.getRelativeToProjectBasePath()), "/");
                const deviceFilePath = this.$mobileHelper.buildDevicePath(deviceRootPath, constants_1.LiveSyncPaths.REMOVEDSYNC_DIR_NAME, relativeUnixPath);
                yield this.device.adb.executeShellCommand(["mkdir", "-p", path.dirname(deviceFilePath), " && ", "touch", deviceFilePath]);
            }
            yield this.getDeviceHashService(deviceAppData.appIdentifier).removeHashes(localToDevicePaths);
        });
    }
    getDeviceHashService(appIdentifier) {
        const adb = this.$injector.resolve(device_android_debug_bridge_1.DeviceAndroidDebugBridge, { identifier: this.device.deviceInfo.identifier });
        return this.$injector.resolve(android_device_hash_service_1.AndroidDeviceHashService, { adb, appIdentifier });
    }
    awaitRuntimeReloadSuccessMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let isResolved = false;
                const socket = new net.Socket();
                socket.connect(AndroidDeviceLiveSyncService.BACKEND_PORT, '127.0.0.1', () => {
                    socket.write(new Buffer([0, 0, 0, 1, 1]));
                });
                socket.on("data", (data) => {
                    socket.destroy();
                    resolve(true);
                });
                socket.on("error", () => {
                    if (!isResolved) {
                        isResolved = true;
                        resolve(false);
                    }
                });
                socket.on("close", () => {
                    if (!isResolved) {
                        isResolved = true;
                        resolve(false);
                    }
                });
            });
        });
    }
}
AndroidDeviceLiveSyncService.BACKEND_PORT = 18182;
__decorate([
    decorators_1.cache()
], AndroidDeviceLiveSyncService.prototype, "getDeviceHashService", null);
exports.AndroidDeviceLiveSyncService = AndroidDeviceLiveSyncService;
