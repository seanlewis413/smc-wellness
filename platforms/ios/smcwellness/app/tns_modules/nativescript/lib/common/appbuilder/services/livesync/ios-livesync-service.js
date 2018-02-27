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
const path = require("path");
const shell = require("shelljs");
const osenv = require("osenv");
const constants = require("../../../constants");
class IOSLiveSyncService {
    constructor(_device, $fs, $injector, $logger, $errors, $options, $iosDeviceOperations) {
        this._device = _device;
        this.$fs = $fs;
        this.$injector = $injector;
        this.$logger = $logger;
        this.$errors = $errors;
        this.$options = $options;
        this.$iosDeviceOperations = $iosDeviceOperations;
        this.$iosDeviceOperations.setShouldDispose(!this.$options.watch);
    }
    get $project() {
        return this.$injector.resolve("project");
    }
    get device() {
        return this._device;
    }
    refreshApplication(deviceAppData, localToDevicePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.device.isEmulator) {
                const simulatorLogFilePath = path.join(osenv.home(), `/Library/Developer/CoreSimulator/Devices/${this.device.deviceInfo.identifier}/data/Library/Logs/system.log`);
                const simulatorLogFileContent = this.$fs.readText(simulatorLogFilePath) || "";
                const simulatorCachePath = path.join(osenv.home(), `/Library/Developer/CoreSimulator/Devices/${this.device.deviceInfo.identifier}/data/Containers/Data/Application/`);
                const regex = new RegExp(`^(?:.*?)${deviceAppData.appIdentifier}(?:.*?)${simulatorCachePath}(.*?)$`, "gm");
                let guid = "";
                while (true) {
                    const parsed = regex.exec(simulatorLogFileContent);
                    if (!parsed) {
                        break;
                    }
                    guid = parsed[1];
                }
                if (!guid) {
                    this.$errors.failWithoutHelp(`Unable to find application GUID for application ${deviceAppData.appIdentifier}. Make sure application is installed on Simulator.`);
                }
                const sourcePath = yield deviceAppData.getDeviceProjectRootPath();
                const destinationPath = path.join(simulatorCachePath, guid, constants.LiveSyncConstants.IOS_PROJECT_PATH);
                this.$logger.trace(`Transferring from ${sourcePath} to ${destinationPath}`);
                shell.cp("-Rf", path.join(sourcePath, "*"), destinationPath);
                yield this.device.applicationManager.restartApplication(deviceAppData.appIdentifier);
            }
            else {
                yield this.device.fileSystem.deleteFile("/Documents/AppBuilder/ServerInfo.plist", deviceAppData.appIdentifier);
                const notification = this.$project.projectData.Framework === constants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript ? "com.telerik.app.refreshApp" : "com.telerik.app.refreshWebView";
                const notificationData = {
                    deviceId: this.device.deviceInfo.identifier,
                    notificationName: notification,
                    commandType: constants.IOS_POST_NOTIFICATION_COMMAND_TYPE
                };
                yield this.$iosDeviceOperations.postNotification([notificationData]);
            }
        });
    }
    removeFiles(appIdentifier, localToDevicePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            const devicePaths = localToDevicePaths.map(localToDevicePath => localToDevicePath.getDevicePath());
            for (const deviceFilePath of devicePaths) {
                yield this.device.fileSystem.deleteFile(deviceFilePath, appIdentifier);
            }
        });
    }
}
exports.IOSLiveSyncService = IOSLiveSyncService;
$injector.register("iosLiveSyncServiceLocator", { factory: IOSLiveSyncService });
