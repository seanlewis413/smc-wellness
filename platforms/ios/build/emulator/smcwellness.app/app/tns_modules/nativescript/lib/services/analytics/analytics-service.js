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
const analytics_service_base_1 = require("../../common/services/analytics-service-base");
const path = require("path");
const decorators_1 = require("../../common/decorators");
const helpers_1 = require("../../common/helpers");
const constants_1 = require("../../common/constants");
class AnalyticsService extends analytics_service_base_1.AnalyticsServiceBase {
    constructor($logger, $options, $processService, $staticConfig, $prompter, $userSettingsService, $analyticsSettingsService, $osInfo, $childProcess, $projectDataService, $mobileHelper) {
        super($logger, $options, $staticConfig, $processService, $prompter, $userSettingsService, $analyticsSettingsService, $osInfo);
        this.$logger = $logger;
        this.$options = $options;
        this.$processService = $processService;
        this.$childProcess = $childProcess;
        this.$projectDataService = $projectDataService;
        this.$mobileHelper = $mobileHelper;
    }
    track(featureName, featureValue) {
        const data = {
            type: "feature",
            featureName: featureName,
            featureValue: featureValue
        };
        return this.sendInfoForTracking(data, this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME);
    }
    trackException(exception, message) {
        const data = {
            type: "exception",
            exception,
            message
        };
        return this.sendInfoForTracking(data, this.$staticConfig.ERROR_REPORT_SETTING_NAME);
    }
    trackAcceptFeatureUsage(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sendMessageToBroker({
                type: "acceptTrackFeatureUsage",
                acceptTrackFeatureUsage: settings.acceptTrackFeatureUsage
            });
        });
    }
    trackInGoogleAnalytics(gaSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initAnalyticsStatuses();
            if (!this.$staticConfig.disableAnalytics && this.analyticsStatuses[this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME] === "enabled") {
                gaSettings.customDimensions = gaSettings.customDimensions || {};
                gaSettings.customDimensions["cd5"] = this.$options.analyticsClient || (helpers_1.isInteractive() ? "CLI" : "Unknown");
                const googleAnalyticsData = _.merge({ type: "googleAnalyticsData", category: "CLI" }, gaSettings);
                return this.sendMessageToBroker(googleAnalyticsData);
            }
        });
    }
    trackEventActionInGoogleAnalytics(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const device = data.device;
            const platform = device ? device.deviceInfo.platform : data.platform;
            const normalizedPlatform = platform ? this.$mobileHelper.normalizePlatformName(platform) : platform;
            const isForDevice = device ? !device.isEmulator : data.isForDevice;
            let label = "";
            label = this.addDataToLabel(label, normalizedPlatform);
            if (isForDevice !== null) {
                const deviceType = isForDevice ? constants_1.DeviceTypes.Device : (this.$mobileHelper.isAndroidPlatform(platform) ? constants_1.DeviceTypes.Emulator : constants_1.DeviceTypes.Simulator);
                label = this.addDataToLabel(label, deviceType);
            }
            if (device) {
                label = this.addDataToLabel(label, device.deviceInfo.version);
            }
            if (data.additionalData) {
                label = this.addDataToLabel(label, data.additionalData);
            }
            const customDimensions = {};
            if (data.projectDir) {
                const projectData = this.$projectDataService.getProjectData(data.projectDir);
                customDimensions["cd2"] = projectData.projectType;
            }
            const googleAnalyticsEventData = {
                googleAnalyticsDataType: "event",
                action: data.action,
                label,
                customDimensions
            };
            this.$logger.trace("Will send the following information to Google Analytics:", googleAnalyticsEventData);
            yield this.trackInGoogleAnalytics(googleAnalyticsEventData);
        });
    }
    dispose() {
        if (this.brokerProcess && this.shouldDisposeInstance) {
            this.brokerProcess.disconnect();
        }
    }
    addDataToLabel(label, newData) {
        if (newData && label) {
            return `${label}_${newData}`;
        }
        return label || newData || "";
    }
    getAnalyticsBroker() {
        return new Promise((resolve, reject) => {
            const broker = this.$childProcess.spawn("node", [
                path.join(__dirname, "analytics-broker-process.js"),
                this.$staticConfig.PATH_TO_BOOTSTRAP
            ], {
                stdio: ["ignore", "ignore", "ignore", "ipc"],
                detached: true
            });
            broker.unref();
            let isSettled = false;
            const timeoutId = setTimeout(() => {
                if (!isSettled) {
                    reject(new Error("Unable to start Analytics Broker process."));
                }
            }, AnalyticsService.ANALYTICS_BROKER_START_TIMEOUT);
            broker.on("error", (err) => {
                clearTimeout(timeoutId);
                if (!isSettled) {
                    isSettled = true;
                    reject(err);
                }
            });
            broker.on("message", (data) => {
                if (data === "BrokerReadyToReceive") {
                    clearTimeout(timeoutId);
                    if (!isSettled) {
                        isSettled = true;
                        this.$processService.attachToProcessExitSignals(this, () => {
                            broker.send({
                                type: "finish"
                            });
                        });
                        this.brokerProcess = broker;
                        resolve(broker);
                    }
                }
            });
        });
    }
    sendInfoForTracking(trackingInfo, settingName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initAnalyticsStatuses();
            if (!this.$staticConfig.disableAnalytics && this.analyticsStatuses[settingName] === "enabled") {
                return this.sendMessageToBroker(trackingInfo);
            }
        });
    }
    sendMessageToBroker(message) {
        return __awaiter(this, void 0, void 0, function* () {
            let broker;
            try {
                broker = yield this.getAnalyticsBroker();
            }
            catch (err) {
                this.$logger.trace("Unable to get broker instance due to error: ", err);
                return;
            }
            return new Promise((resolve, reject) => {
                if (broker && broker.connected) {
                    try {
                        broker.send(message, resolve);
                    }
                    catch (err) {
                        this.$logger.trace("Error while trying to send message to broker:", err);
                        resolve();
                    }
                }
                else {
                    this.$logger.trace("Broker not found or not connected.");
                    resolve();
                }
            });
        });
    }
}
AnalyticsService.ANALYTICS_BROKER_START_TIMEOUT = 10 * 1000;
__decorate([
    decorators_1.cache()
], AnalyticsService.prototype, "getAnalyticsBroker", null);
exports.AnalyticsService = AnalyticsService;
$injector.register("analyticsService", AnalyticsService);
