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
const temp = require("temp");
const ios_device_livesync_service_1 = require("./ios-device-livesync-service");
const platform_livesync_service_base_1 = require("./platform-livesync-service-base");
const constants_1 = require("../../constants");
class IOSLiveSyncService extends platform_livesync_service_base_1.PlatformLiveSyncServiceBase {
    constructor($fs, $platformsData, $projectFilesManager, $injector, $devicePathProvider, $logger, $projectFilesProvider) {
        super($fs, $logger, $platformsData, $projectFilesManager, $devicePathProvider, $projectFilesProvider);
        this.$fs = $fs;
        this.$platformsData = $platformsData;
        this.$projectFilesManager = $projectFilesManager;
        this.$injector = $injector;
    }
    fullSync(syncInfo) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            const device = syncInfo.device;
            if (device.isEmulator) {
                return _super("fullSync").call(this, syncInfo);
            }
            const projectData = syncInfo.projectData;
            const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
            const deviceAppData = yield this.getAppData(syncInfo);
            const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants_1.APP_FOLDER_NAME);
            temp.track();
            const tempZip = temp.path({ prefix: "sync", suffix: ".zip" });
            const tempApp = temp.mkdirSync("app");
            this.$logger.trace("Creating zip file: " + tempZip);
            this.$fs.copyFile(path.join(path.dirname(projectFilesPath), `${constants_1.APP_FOLDER_NAME}/*`), tempApp);
            if (!syncInfo.syncAllFiles) {
                this.$logger.info("Skipping node_modules folder! Use the syncAllFiles option to sync files from this folder.");
                this.$fs.deleteDirectory(path.join(tempApp, constants_1.TNS_MODULES_FOLDER_NAME));
            }
            yield this.$fs.zipFiles(tempZip, this.$fs.enumerateFilesInDirectorySync(tempApp), (res) => {
                return path.join(constants_1.APP_FOLDER_NAME, path.relative(tempApp, res));
            });
            yield device.fileSystem.transferFiles(deviceAppData, [{
                    getLocalPath: () => tempZip,
                    getDevicePath: () => deviceAppData.deviceSyncZipPath,
                    getRelativeToProjectBasePath: () => "../sync.zip",
                    deviceProjectRootPath: yield deviceAppData.getDeviceProjectRootPath()
                }]);
            return {
                deviceAppData,
                isFullSync: true,
                modifiedFilesData: []
            };
        });
    }
    liveSyncWatchAction(device, liveSyncInfo) {
        if (liveSyncInfo.isReinstalled) {
            return this.fullSync({ projectData: liveSyncInfo.projectData, device, syncAllFiles: liveSyncInfo.syncAllFiles, watch: true });
        }
        else {
            return super.liveSyncWatchAction(device, liveSyncInfo);
        }
    }
    _getDeviceLiveSyncService(device) {
        const service = this.$injector.resolve(ios_device_livesync_service_1.IOSDeviceLiveSyncService, { _device: device });
        return service;
    }
}
exports.IOSLiveSyncService = IOSLiveSyncService;
$injector.register("iOSLiveSyncService", IOSLiveSyncService);
