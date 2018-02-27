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
const os_1 = require("os");
const helpers_1 = require("../../../helpers");
const application_manager_base_1 = require("../../application-manager-base");
const decorators_1 = require("../../../decorators");
class IOSApplicationManager extends application_manager_base_1.ApplicationManagerBase {
    constructor($logger, $hooksService, device, $errors, $iOSNotificationService, $hostInfo, $staticConfig, $iosDeviceOperations, $options) {
        super($logger, $hooksService);
        this.$logger = $logger;
        this.$hooksService = $hooksService;
        this.device = device;
        this.$errors = $errors;
        this.$iOSNotificationService = $iOSNotificationService;
        this.$hostInfo = $hostInfo;
        this.$staticConfig = $staticConfig;
        this.$iosDeviceOperations = $iosDeviceOperations;
        this.$options = $options;
    }
    getInstalledApplications() {
        return __awaiter(this, void 0, void 0, function* () {
            const applicationsLiveSyncStatus = yield this.getApplicationsLiveSyncSupportedStatus();
            return _(applicationsLiveSyncStatus)
                .map(appLiveSyncStatus => appLiveSyncStatus.applicationIdentifier)
                .sortBy((identifier) => identifier.toLowerCase())
                .value();
        });
    }
    installApplication(packageFilePath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.$iosDeviceOperations.install(packageFilePath, [this.device.deviceInfo.identifier], (err) => {
                this.$errors.failWithoutHelp(`Failed to install ${packageFilePath} on device with identifier ${err.deviceId}. Error is: ${err.message}`);
            });
        });
    }
    getApplicationInfo(applicationIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.applicationsLiveSyncInfos || !this.applicationsLiveSyncInfos.length) {
                yield this.getApplicationsLiveSyncSupportedStatus();
            }
            return _.find(this.applicationsLiveSyncInfos, app => app.applicationIdentifier === applicationIdentifier);
        });
    }
    getApplicationsLiveSyncSupportedStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceIdentifier = this.device.deviceInfo.identifier;
            const applicationsOnDeviceInfo = _.first((yield this.$iosDeviceOperations.apps([deviceIdentifier]))[deviceIdentifier]);
            const applicationsOnDevice = applicationsOnDeviceInfo ? applicationsOnDeviceInfo.response : [];
            this.$logger.trace("Result when getting applications for which LiveSync is enabled: ", JSON.stringify(applicationsOnDevice, null, 2));
            this.applicationsLiveSyncInfos = _.map(applicationsOnDevice, app => ({
                applicationIdentifier: app.CFBundleIdentifier,
                isLiveSyncSupported: app.IceniumLiveSyncEnabled,
                configuration: app.configuration,
                deviceIdentifier: this.device.deviceInfo.identifier
            }));
            return this.applicationsLiveSyncInfos;
        });
    }
    isLiveSyncSupported(appIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.applicationsLiveSyncInfos || !this.applicationsLiveSyncInfos.length) {
                yield this.getApplicationsLiveSyncSupportedStatus();
            }
            const selectedApplication = _.find(this.applicationsLiveSyncInfos, app => app.applicationIdentifier === appIdentifier);
            return !!selectedApplication && selectedApplication.isLiveSyncSupported;
        });
    }
    uninstallApplication(appIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.$iosDeviceOperations.uninstall(appIdentifier, [this.device.deviceInfo.identifier], (err) => {
                this.$logger.warn(`Failed to uninstall ${appIdentifier} on device with identifier ${err.deviceId}`);
            });
            this.$logger.trace("Application %s has been uninstalled successfully.", appIdentifier);
        });
    }
    startApplication(appIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.isApplicationInstalled(appIdentifier))) {
                this.$errors.failWithoutHelp("Invalid application id: %s. All available application ids are: %s%s ", appIdentifier, os_1.EOL, this.applicationsLiveSyncInfos.join(os_1.EOL));
            }
            yield this.runApplicationCore(appIdentifier);
            this.$logger.info(`Successfully run application ${appIdentifier} on device with ID ${this.device.deviceInfo.identifier}.`);
        });
    }
    stopApplication(appIdentifier, appName) {
        return __awaiter(this, void 0, void 0, function* () {
            const action = () => this.$iosDeviceOperations.stop([{ deviceId: this.device.deviceInfo.identifier, ddi: this.$options.ddi, appId: appIdentifier }]);
            try {
                yield action();
            }
            catch (err) {
                this.$logger.trace(`Error when trying to stop application ${appIdentifier} on device ${this.device.deviceInfo.identifier}: ${err}. Retrying stop operation.`);
                yield action();
            }
        });
    }
    restartApplication(applicationId, appName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.stopApplication(applicationId, appName);
                yield this.runApplicationCore(applicationId);
            }
            catch (err) {
                yield this.$iOSNotificationService.postNotification(this.device.deviceInfo.identifier, `${applicationId}:NativeScript.LiveSync.RestartApplication`);
                throw err;
            }
        });
    }
    runApplicationCore(appIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.$iosDeviceOperations.start([{ deviceId: this.device.deviceInfo.identifier, appId: appIdentifier, ddi: this.$options.ddi }]);
            if (!this.$options.justlaunch) {
                yield this.startDeviceLog();
            }
        });
    }
    startDeviceLog() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.device.openDeviceLogStream();
        });
    }
    canStartApplication() {
        return this.$hostInfo.isDarwin || (this.$hostInfo.isWindows && this.$staticConfig.enableDeviceRunCommandOnWindows);
    }
    getDebuggableApps() {
        return Promise.resolve([]);
    }
    getDebuggableAppViews(appIdentifiers) {
        return Promise.resolve(null);
    }
}
__decorate([
    helpers_1.hook('install')
], IOSApplicationManager.prototype, "installApplication", null);
__decorate([
    decorators_1.cache()
], IOSApplicationManager.prototype, "startDeviceLog", null);
exports.IOSApplicationManager = IOSApplicationManager;
