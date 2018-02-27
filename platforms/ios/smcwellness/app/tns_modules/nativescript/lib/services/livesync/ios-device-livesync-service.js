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
const constants = require("../../constants");
const minimatch = require("minimatch");
const device_livesync_service_base_1 = require("./device-livesync-service-base");
let currentPageReloadId = 0;
class IOSDeviceLiveSyncService extends device_livesync_service_base_1.DeviceLiveSyncServiceBase {
    constructor(_device, $iOSSocketRequestExecutor, $iOSNotification, $iOSEmulatorServices, $logger, $fs, $processService, $platformsData) {
        super($platformsData);
        this.$iOSSocketRequestExecutor = $iOSSocketRequestExecutor;
        this.$iOSNotification = $iOSNotification;
        this.$iOSEmulatorServices = $iOSEmulatorServices;
        this.$logger = $logger;
        this.$fs = $fs;
        this.$processService = $processService;
        this.$platformsData = $platformsData;
        this.device = _device;
    }
    setupSocketIfNeeded(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.socket) {
                return true;
            }
            if (this.device.isEmulator) {
                yield this.$iOSEmulatorServices.postDarwinNotification(this.$iOSNotification.getAttachRequest(projectId));
                this.socket = yield this.$iOSEmulatorServices.connectToPort({ port: IOSDeviceLiveSyncService.BACKEND_PORT });
                if (!this.socket) {
                    return false;
                }
            }
            else {
                yield this.$iOSSocketRequestExecutor.executeAttachRequest(this.device, constants.AWAIT_NOTIFICATION_TIMEOUT_SECONDS, projectId);
                this.socket = yield this.device.connectToPort(IOSDeviceLiveSyncService.BACKEND_PORT);
            }
            this.attachEventHandlers();
            return true;
        });
    }
    removeFiles(deviceAppData, localToDevicePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(_.map(localToDevicePaths, localToDevicePathData => this.device.fileSystem.deleteFile(localToDevicePathData.getDevicePath(), deviceAppData.appIdentifier)));
        });
    }
    refreshApplication(projectData, liveSyncInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceAppData = liveSyncInfo.deviceAppData;
            const localToDevicePaths = liveSyncInfo.modifiedFilesData;
            if (liveSyncInfo.isFullSync) {
                yield this.restartApplication(deviceAppData, projectData.projectName);
                return;
            }
            let scriptRelatedFiles = [];
            const scriptFiles = _.filter(localToDevicePaths, localToDevicePath => _.endsWith(localToDevicePath.getDevicePath(), ".js"));
            constants.LIVESYNC_EXCLUDED_FILE_PATTERNS.forEach(pattern => scriptRelatedFiles = _.concat(scriptRelatedFiles, localToDevicePaths.filter(file => minimatch(file.getDevicePath(), pattern, { nocase: true }))));
            const otherFiles = _.difference(localToDevicePaths, _.concat(scriptFiles, scriptRelatedFiles));
            const shouldRestart = _.some(otherFiles, (localToDevicePath) => !this.canExecuteFastSync(localToDevicePath.getLocalPath(), projectData, deviceAppData.platform));
            if (shouldRestart || (!liveSyncInfo.useLiveEdit && scriptFiles.length)) {
                yield this.restartApplication(deviceAppData, projectData.projectName);
                return;
            }
            if (yield this.setupSocketIfNeeded(projectData.projectId)) {
                yield this.liveEdit(scriptFiles);
                yield this.reloadPage(deviceAppData, otherFiles);
            }
            else {
                yield this.restartApplication(deviceAppData, projectData.projectName);
            }
        });
    }
    restartApplication(deviceAppData, appName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.device.applicationManager.restartApplication(deviceAppData.appIdentifier, appName);
        });
    }
    reloadPage(deviceAppData, localToDevicePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            if (localToDevicePaths.length) {
                const message = JSON.stringify({
                    method: "Page.reload",
                    params: {
                        ignoreCache: false
                    },
                    id: ++currentPageReloadId
                });
                yield this.sendMessage(message);
            }
        });
    }
    liveEdit(localToDevicePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const localToDevicePath of localToDevicePaths) {
                const content = this.$fs.readText(localToDevicePath.getLocalPath());
                const message = JSON.stringify({
                    method: "Debugger.setScriptSource",
                    params: {
                        scriptUrl: localToDevicePath.getRelativeToProjectBasePath(),
                        scriptSource: content
                    },
                    id: ++currentPageReloadId
                });
                yield this.sendMessage(message);
            }
        });
    }
    attachEventHandlers() {
        this.$processService.attachToProcessExitSignals(this, this.destroySocket);
        this.socket.on("close", (hadError) => {
            this.$logger.trace(`Socket closed, hadError is ${hadError}.`);
            this.socket = null;
        });
        this.socket.on("error", (error) => {
            this.$logger.trace(`Socket error received: ${error}`);
        });
        this.socket.on("data", (data) => {
            this.$logger.trace(`Socket sent data: ${data.toString()}`);
        });
    }
    sendMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield new Promise((resolve, reject) => {
                    let isResolved = false;
                    const length = Buffer.byteLength(message, "utf16le");
                    const payload = new Buffer(length + 4);
                    payload.writeInt32BE(length, 0);
                    payload.write(message, 4, length, "utf16le");
                    const errorCallback = (error) => {
                        if (!isResolved) {
                            isResolved = true;
                            reject(error);
                        }
                    };
                    this.socket.once("error", errorCallback);
                    this.socket.write(payload, "utf16le", () => {
                        this.socket.removeListener("error", errorCallback);
                        if (!isResolved) {
                            isResolved = true;
                            resolve();
                        }
                    });
                });
            }
            catch (error) {
                this.$logger.trace("Error while sending message:", error);
                this.destroySocket();
            }
        });
    }
    destroySocket() {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
    }
}
IOSDeviceLiveSyncService.BACKEND_PORT = 18181;
exports.IOSDeviceLiveSyncService = IOSDeviceLiveSyncService;
