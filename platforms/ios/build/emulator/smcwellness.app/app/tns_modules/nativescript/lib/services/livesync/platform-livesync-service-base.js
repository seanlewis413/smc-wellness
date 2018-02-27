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
const util = require("util");
const constants_1 = require("../../constants");
class PlatformLiveSyncServiceBase {
    constructor($fs, $logger, $platformsData, $projectFilesManager, $devicePathProvider, $projectFilesProvider) {
        this.$fs = $fs;
        this.$logger = $logger;
        this.$platformsData = $platformsData;
        this.$projectFilesManager = $projectFilesManager;
        this.$devicePathProvider = $devicePathProvider;
        this.$projectFilesProvider = $projectFilesProvider;
        this._deviceLiveSyncServicesCache = {};
    }
    getDeviceLiveSyncService(device, applicationIdentifier) {
        const key = device.deviceInfo.identifier + applicationIdentifier;
        if (!this._deviceLiveSyncServicesCache[key]) {
            this._deviceLiveSyncServicesCache[key] = this._getDeviceLiveSyncService(device);
        }
        return this._deviceLiveSyncServicesCache[key];
    }
    refreshApplication(projectData, liveSyncInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (liveSyncInfo.isFullSync || liveSyncInfo.modifiedFilesData.length) {
                const deviceLiveSyncService = this.getDeviceLiveSyncService(liveSyncInfo.deviceAppData.device, projectData.projectId);
                this.$logger.info("Refreshing application...");
                yield deviceLiveSyncService.refreshApplication(projectData, liveSyncInfo);
            }
        });
    }
    fullSync(syncInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const projectData = syncInfo.projectData;
            const device = syncInfo.device;
            const deviceLiveSyncService = this.getDeviceLiveSyncService(device, syncInfo.projectData.projectId);
            const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
            const deviceAppData = yield this.getAppData(syncInfo);
            if (deviceLiveSyncService.beforeLiveSyncAction) {
                yield deviceLiveSyncService.beforeLiveSyncAction(deviceAppData);
            }
            const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants_1.APP_FOLDER_NAME);
            const localToDevicePaths = yield this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, null, []);
            const modifiedFilesData = yield this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, true);
            return {
                modifiedFilesData,
                isFullSync: true,
                deviceAppData
            };
        });
    }
    liveSyncWatchAction(device, liveSyncInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const projectData = liveSyncInfo.projectData;
            const syncInfo = _.merge({ device, watch: true }, liveSyncInfo);
            const deviceAppData = yield this.getAppData(syncInfo);
            const modifiedLocalToDevicePaths = [];
            if (liveSyncInfo.filesToSync.length) {
                const filesToSync = liveSyncInfo.filesToSync;
                const mappedFiles = _.map(filesToSync, filePath => this.$projectFilesProvider.mapFilePath(filePath, device.deviceInfo.platform, projectData));
                const existingFiles = mappedFiles.filter(m => m && this.$fs.exists(m));
                this.$logger.trace("Will execute livesync for files: ", existingFiles);
                const skippedFiles = _.difference(mappedFiles, existingFiles);
                if (skippedFiles.length) {
                    this.$logger.trace("The following files will not be synced as they do not exist:", skippedFiles);
                }
                if (existingFiles.length) {
                    const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
                    const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants_1.APP_FOLDER_NAME);
                    const localToDevicePaths = yield this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, existingFiles, []);
                    modifiedLocalToDevicePaths.push(...localToDevicePaths);
                    yield this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, false);
                }
            }
            if (liveSyncInfo.filesToRemove.length) {
                const filePaths = liveSyncInfo.filesToRemove;
                const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
                const mappedFiles = _(filePaths)
                    .map(filePath => this.$projectFilesProvider.mapFilePath(filePath, device.deviceInfo.platform, projectData))
                    .filter(filePath => !!filePath)
                    .value();
                const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants_1.APP_FOLDER_NAME);
                const localToDevicePaths = yield this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, mappedFiles, []);
                modifiedLocalToDevicePaths.push(...localToDevicePaths);
                const deviceLiveSyncService = this.getDeviceLiveSyncService(device, projectData.projectId);
                yield deviceLiveSyncService.removeFiles(deviceAppData, localToDevicePaths);
            }
            return {
                modifiedFilesData: modifiedLocalToDevicePaths,
                isFullSync: liveSyncInfo.isReinstalled,
                deviceAppData
            };
        });
    }
    transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, isFullSync) {
        return __awaiter(this, void 0, void 0, function* () {
            let transferredFiles = localToDevicePaths;
            if (isFullSync) {
                transferredFiles = yield deviceAppData.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, projectFilesPath);
            }
            else {
                yield deviceAppData.device.fileSystem.transferFiles(deviceAppData, localToDevicePaths);
            }
            this.logFilesSyncInformation(transferredFiles, "Successfully transferred %s.", this.$logger.info);
            return transferredFiles;
        });
    }
    getAppData(syncInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceProjectRootOptions = _.assign({ appIdentifier: syncInfo.projectData.projectId }, syncInfo);
            return {
                appIdentifier: syncInfo.projectData.projectId,
                device: syncInfo.device,
                platform: syncInfo.device.deviceInfo.platform,
                getDeviceProjectRootPath: () => this.$devicePathProvider.getDeviceProjectRootPath(syncInfo.device, deviceProjectRootOptions),
                deviceSyncZipPath: this.$devicePathProvider.getDeviceSyncZipPath(syncInfo.device),
                isLiveSyncSupported: () => __awaiter(this, void 0, void 0, function* () { return true; })
            };
        });
    }
    logFilesSyncInformation(localToDevicePaths, message, action) {
        if (localToDevicePaths && localToDevicePaths.length < 10) {
            _.each(localToDevicePaths, (file) => {
                action.call(this.$logger, util.format(message, path.basename(file.getLocalPath()).yellow));
            });
        }
        else {
            action.call(this.$logger, util.format(message, "all files"));
        }
    }
}
exports.PlatformLiveSyncServiceBase = PlatformLiveSyncServiceBase;
