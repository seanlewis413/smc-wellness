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
const helpers = require("../helpers");
const decorators_1 = require("../decorators");
const cliGlobal = global;
cliGlobal.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
cliGlobal.XMLHttpRequest.prototype.withCredentials = false;
class AnalyticsServiceBase {
    constructor($logger, $options, $staticConfig, $processService, $prompter, $userSettingsService, $analyticsSettingsService, $osInfo) {
        this.$logger = $logger;
        this.$options = $options;
        this.$staticConfig = $staticConfig;
        this.$processService = $processService;
        this.$prompter = $prompter;
        this.$userSettingsService = $userSettingsService;
        this.$analyticsSettingsService = $analyticsSettingsService;
        this.$osInfo = $osInfo;
        this.eqatecMonitors = {};
        this.featureTrackingAPIKeys = [
            this.$staticConfig.ANALYTICS_API_KEY
        ];
        this.acceptUsageReportingAPIKeys = [
            this.$staticConfig.ANALYTICS_API_KEY
        ];
        this.exceptionsTrackingAPIKeys = [
            this.$staticConfig.ANALYTICS_EXCEPTIONS_API_KEY
        ];
        this.shouldDisposeInstance = true;
        this.analyticsStatuses = {};
    }
    get acceptTrackFeatureSetting() {
        return `Accept${this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}`;
    }
    setShouldDispose(shouldDispose) {
        this.shouldDisposeInstance = shouldDispose;
    }
    checkConsent() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.$analyticsSettingsService.canDoRequest()) {
                const initialTrackFeatureUsageStatus = yield this.getStatus(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME);
                let trackFeatureUsage = initialTrackFeatureUsageStatus === "enabled";
                if ((yield this.isNotConfirmed(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME)) && helpers.isInteractive()) {
                    this.$logger.out("Do you want to help us improve "
                        + this.$analyticsSettingsService.getClientName()
                        + " by automatically sending anonymous usage statistics? We will not use this information to identify or contact you."
                        + " You can read our official Privacy Policy at");
                    const message = this.$analyticsSettingsService.getPrivacyPolicyLink();
                    trackFeatureUsage = yield this.$prompter.confirm(message, () => true);
                    yield this.setStatus(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, trackFeatureUsage);
                    yield this.trackAcceptFeatureUsage({ acceptTrackFeatureUsage: trackFeatureUsage });
                }
                const isErrorReportingUnset = yield this.isNotConfirmed(this.$staticConfig.ERROR_REPORT_SETTING_NAME);
                const isUsageReportingConfirmed = !(yield this.isNotConfirmed(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME));
                if (isErrorReportingUnset && isUsageReportingConfirmed) {
                    yield this.setStatus(this.$staticConfig.ERROR_REPORT_SETTING_NAME, trackFeatureUsage);
                }
            }
        });
    }
    trackAcceptFeatureUsage(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.sendDataToEqatecMonitors(this.acceptUsageReportingAPIKeys, (eqatecMonitor) => eqatecMonitor.trackFeature(`${this.acceptTrackFeatureSetting}.${settings.acceptTrackFeatureUsage}`));
            }
            catch (e) {
                this.$logger.trace("Analytics exception: ", e);
            }
        });
    }
    trackFeature(featureName) {
        const category = this.$options.analyticsClient ||
            (helpers.isInteractive() ? "CLI" : "Non-interactive");
        return this.track(category, featureName);
    }
    track(featureName, featureValue) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initAnalyticsStatuses();
            this.$logger.trace(`Trying to track feature '${featureName}' with value '${featureValue}'.`);
            if (this.analyticsStatuses[this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME] === "enabled") {
                yield this.trackFeatureCore(`${featureName}.${featureValue}`);
            }
        });
    }
    trackException(exception, message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initAnalyticsStatuses();
            if (this.analyticsStatuses[this.$staticConfig.ERROR_REPORT_SETTING_NAME] === "enabled"
                && (yield this.$analyticsSettingsService.canDoRequest())) {
                try {
                    this.$logger.trace(`Trying to track exception with message '${message}'.`);
                    yield this.sendDataToEqatecMonitors(this.exceptionsTrackingAPIKeys, (eqatecMonitor) => eqatecMonitor.trackException(exception, message));
                }
                catch (e) {
                    this.$logger.trace("Analytics exception: ", e);
                }
            }
        });
    }
    trackInGoogleAnalytics(gaSettings) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    trackEventActionInGoogleAnalytics(data) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    setStatus(settingName, enabled) {
        return __awaiter(this, void 0, void 0, function* () {
            this.analyticsStatuses[settingName] = enabled ? "enabled" : "disabled";
            yield this.$userSettingsService.saveSetting(settingName, enabled.toString());
            if (this.analyticsStatuses[settingName] === "disabled"
                && this.analyticsStatuses[settingName] === "disabled") {
                this.tryStopEqatecMonitors();
            }
        });
    }
    isEnabled(settingName) {
        return __awaiter(this, void 0, void 0, function* () {
            const analyticsStatus = yield this.getStatus(settingName);
            return analyticsStatus === "enabled";
        });
    }
    tryStopEqatecMonitors(code) {
        for (const eqatecMonitorApiKey in this.eqatecMonitors) {
            const eqatecMonitor = this.eqatecMonitors[eqatecMonitorApiKey];
            eqatecMonitor.stop();
            delete this.eqatecMonitors[eqatecMonitorApiKey];
        }
    }
    getStatusMessage(settingName, jsonFormat, readableSettingName) {
        if (jsonFormat) {
            return this.getJsonStatusMessage(settingName);
        }
        return this.getHumanReadableStatusMessage(settingName, readableSettingName);
    }
    trackFeatureCore(featureTrackString, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (yield this.$analyticsSettingsService.canDoRequest()) {
                    yield this.sendDataToEqatecMonitors(this.featureTrackingAPIKeys, (eqatecMonitor) => eqatecMonitor.trackFeature(featureTrackString));
                }
            }
            catch (e) {
                this.$logger.trace("Analytics exception: ", e);
            }
        });
    }
    initAnalyticsStatuses() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.$analyticsSettingsService.canDoRequest()) {
                this.$logger.trace("Initializing analytics statuses.");
                const settingsNames = [this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, this.$staticConfig.ERROR_REPORT_SETTING_NAME];
                for (const settingName of settingsNames) {
                    yield this.getStatus(settingName);
                }
                this.$logger.trace("Analytics statuses: ", this.analyticsStatuses);
            }
        });
    }
    getIsSending(eqatecMonitor) {
        return eqatecMonitor.status().isSending;
    }
    waitForSending(eqatecMonitor) {
        return new Promise((resolve, reject) => {
            const intervalTime = 100;
            let remainingTime = AnalyticsServiceBase.MAX_WAIT_SENDING_INTERVAL;
            if (this.getIsSending(eqatecMonitor)) {
                const message = `Waiting for analytics to send information. Will check in ${intervalTime}ms.`;
                this.$logger.trace(message);
                const interval = setInterval(() => {
                    if (!this.getIsSending(eqatecMonitor) || remainingTime <= 0) {
                        clearInterval(interval);
                        resolve();
                    }
                    remainingTime -= intervalTime;
                    this.$logger.trace(`${message} Remaining time is: ${remainingTime}`);
                }, intervalTime);
            }
            else {
                resolve();
            }
        });
    }
    sendDataToEqatecMonitors(analyticsAPIKeys, eqatecMonitorAction) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const eqatecAPIKey of analyticsAPIKeys) {
                const eqatecMonitor = yield this.start(eqatecAPIKey);
                eqatecMonitorAction(eqatecMonitor);
                yield this.waitForSending(eqatecMonitor);
            }
        });
    }
    getCurrentSessionCount(analyticsProjectKey) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentCount = yield this.$analyticsSettingsService.getUserSessionsCount(analyticsProjectKey);
            yield this.$analyticsSettingsService.setUserSessionsCount(++currentCount, analyticsProjectKey);
            return currentCount;
        });
    }
    getEqatecSettings(analyticsAPIKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                analyticsAPIKey,
                analyticsInstallationId: yield this.$analyticsSettingsService.getClientId(),
                type: "initialization",
                userId: yield this.$analyticsSettingsService.getUserId(),
                userSessionCount: yield this.getCurrentSessionCount(analyticsAPIKey)
            };
        });
    }
    getStatus(settingName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!_.has(this.analyticsStatuses, settingName)) {
                const settingValue = yield this.$userSettingsService.getSettingValue(settingName);
                if (settingValue) {
                    const isEnabled = helpers.toBoolean(settingValue);
                    if (isEnabled) {
                        this.analyticsStatuses[settingName] = "enabled";
                    }
                    else {
                        this.analyticsStatuses[settingName] = "disabled";
                    }
                }
                else {
                    this.analyticsStatuses[settingName] = "not confirmed";
                }
            }
            return this.analyticsStatuses[settingName];
        });
    }
    start(analyticsAPIKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const eqatecMonitorForSpecifiedAPIKey = this.eqatecMonitors[analyticsAPIKey];
            if (eqatecMonitorForSpecifiedAPIKey) {
                return eqatecMonitorForSpecifiedAPIKey;
            }
            const analyticsSettings = yield this.getEqatecSettings(analyticsAPIKey);
            return this.startEqatecMonitor(analyticsSettings);
        });
    }
    startEqatecMonitor(analyticsSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const eqatecMonitorForSpecifiedAPIKey = this.eqatecMonitors[analyticsSettings.analyticsAPIKey];
            if (eqatecMonitorForSpecifiedAPIKey) {
                return eqatecMonitorForSpecifiedAPIKey;
            }
            require("../vendor/EqatecMonitor.min");
            const analyticsProjectKey = analyticsSettings.analyticsAPIKey;
            const settings = cliGlobal._eqatec.createSettings(analyticsProjectKey);
            settings.useHttps = false;
            settings.userAgent = this.getUserAgentString();
            settings.version = this.$staticConfig.version;
            settings.useCookies = false;
            settings.loggingInterface = {
                logMessage: this.$logger.trace.bind(this.$logger),
                logError: this.$logger.debug.bind(this.$logger)
            };
            const eqatecMonitor = cliGlobal._eqatec.createMonitor(settings);
            this.eqatecMonitors[analyticsSettings.analyticsAPIKey] = eqatecMonitor;
            const analyticsInstallationId = analyticsSettings.analyticsInstallationId;
            this.$logger.trace(`${this.$staticConfig.ANALYTICS_INSTALLATION_ID_SETTING_NAME}: ${analyticsInstallationId}`);
            eqatecMonitor.setInstallationID(analyticsInstallationId);
            try {
                yield eqatecMonitor.setUserID(analyticsSettings.userId);
                const currentCount = analyticsSettings.userSessionCount;
                eqatecMonitor.setStartCount(currentCount);
            }
            catch (e) {
                this.$logger.trace("Error while initializing eqatecMonitor", e);
            }
            eqatecMonitor.start();
            this.$processService.attachToProcessExitSignals(this, this.tryStopEqatecMonitors);
            yield this.reportNodeVersion(analyticsSettings.analyticsAPIKey);
            return eqatecMonitor;
        });
    }
    reportNodeVersion(apiKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const reportedVersion = process.version.slice(1).replace(/[.]/g, "_");
            yield this.sendDataToEqatecMonitors([apiKey], (eqatecMonitor) => eqatecMonitor.trackFeature(`NodeJSVersion.${reportedVersion}`));
        });
    }
    getUserAgentString() {
        let userAgentString;
        const osType = this.$osInfo.type();
        if (osType === "Windows_NT") {
            userAgentString = "(Windows NT " + this.$osInfo.release() + ")";
        }
        else if (osType === "Darwin") {
            userAgentString = "(Mac OS X " + this.$osInfo.release() + ")";
        }
        else {
            userAgentString = "(" + osType + ")";
        }
        return userAgentString;
    }
    isNotConfirmed(settingName) {
        return __awaiter(this, void 0, void 0, function* () {
            const analyticsStatus = yield this.getStatus(settingName);
            return analyticsStatus === "not confirmed";
        });
    }
    getHumanReadableStatusMessage(settingName, readableSettingName) {
        return __awaiter(this, void 0, void 0, function* () {
            let status = null;
            if (yield this.isNotConfirmed(settingName)) {
                status = "disabled until confirmed";
            }
            else {
                status = yield this.getStatus(settingName);
            }
            return `${readableSettingName} is ${status}.`;
        });
    }
    getJsonStatusMessage(settingName) {
        return __awaiter(this, void 0, void 0, function* () {
            const status = yield this.getStatus(settingName);
            const enabled = status === "not confirmed" ? null : status === "enabled";
            return JSON.stringify({ enabled });
        });
    }
}
AnalyticsServiceBase.MAX_WAIT_SENDING_INTERVAL = 30000;
__decorate([
    decorators_1.cache()
], AnalyticsServiceBase.prototype, "initAnalyticsStatuses", null);
exports.AnalyticsServiceBase = AnalyticsServiceBase;
