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
const helpers_1 = require("./common/helpers");
const constants_1 = require("./constants");
const android_device_livesync_service_1 = require("./services/livesync/android-device-livesync-service");
const path = require("path");
class DevicePathProvider {
    constructor($mobileHelper, $injector, $iOSSimResolver, $errors) {
        this.$mobileHelper = $mobileHelper;
        this.$injector = $injector;
        this.$iOSSimResolver = $iOSSimResolver;
        this.$errors = $errors;
    }
    getDeviceProjectRootPath(device, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let projectRoot = "";
            if (this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform)) {
                projectRoot = device.isEmulator ? this.$iOSSimResolver.iOSSim.getApplicationPath(device.deviceInfo.identifier, options.appIdentifier) : constants_1.LiveSyncPaths.IOS_DEVICE_PROJECT_ROOT_PATH;
                if (!projectRoot) {
                    this.$errors.failWithoutHelp("Unable to get application path on device.");
                }
                if (!options.getDirname) {
                    projectRoot = path.join(projectRoot, constants_1.APP_FOLDER_NAME);
                }
            }
            else if (this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform)) {
                projectRoot = `/data/local/tmp/${options.appIdentifier}`;
                if (!options.getDirname) {
                    const deviceLiveSyncService = this.$injector.resolve(android_device_livesync_service_1.AndroidDeviceLiveSyncService, { _device: device });
                    const hashService = deviceLiveSyncService.getDeviceHashService(options.appIdentifier);
                    const hashFile = options.syncAllFiles ? null : yield hashService.doesShasumFileExistsOnDevice();
                    const syncFolderName = options.watch || hashFile ? constants_1.LiveSyncPaths.SYNC_DIR_NAME : constants_1.LiveSyncPaths.FULLSYNC_DIR_NAME;
                    projectRoot = path.join(projectRoot, syncFolderName);
                }
            }
            return helpers_1.fromWindowsRelativePathToUnix(projectRoot);
        });
    }
    getDeviceSyncZipPath(device) {
        return this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform) && !device.isEmulator ? constants_1.LiveSyncPaths.IOS_DEVICE_SYNC_ZIP_PATH : undefined;
    }
}
exports.DevicePathProvider = DevicePathProvider;
$injector.register("devicePathProvider", DevicePathProvider);
