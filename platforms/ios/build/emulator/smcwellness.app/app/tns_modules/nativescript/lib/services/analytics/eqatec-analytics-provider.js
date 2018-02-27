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
const analytics_service_base_1 = require("../../common/services/analytics-service-base");
class EqatecAnalyticsProvider extends analytics_service_base_1.AnalyticsServiceBase {
    constructor($logger, $options, $processService, $staticConfig, $prompter, $userSettingsService, $analyticsSettingsService, $osInfo) {
        super($logger, $options, $staticConfig, $processService, $prompter, $userSettingsService, $analyticsSettingsService, $osInfo);
        this.$logger = $logger;
        this.$options = $options;
        this.featureTrackingAPIKeys = [
            this.$staticConfig.ANALYTICS_API_KEY,
            EqatecAnalyticsProvider.NEW_PROJECT_ANALYTICS_API_KEY
        ];
        this.acceptUsageReportingAPIKeys = [
            EqatecAnalyticsProvider.ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY
        ];
    }
    trackInformation(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.trackFeatureCore(`${data.featureName}.${data.featureValue}`);
            }
            catch (e) {
                this.$logger.trace(`Analytics exception: ${e}`);
            }
        });
    }
    trackError(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.trackException(data.exception, data.message);
            }
            catch (e) {
                this.$logger.trace(`Analytics exception: ${e}`);
            }
        });
    }
    acceptFeatureUsageTracking(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.trackAcceptFeatureUsage({ acceptTrackFeatureUsage: data.acceptTrackFeatureUsage });
            }
            catch (e) {
                this.$logger.trace(`Analytics exception: ${e}`);
            }
        });
    }
    finishTracking() {
        return __awaiter(this, void 0, void 0, function* () {
            this.tryStopEqatecMonitors();
        });
    }
    dispose() {
    }
}
EqatecAnalyticsProvider.ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY = "9912cff308334c6d9ad9c33f76a983e3";
EqatecAnalyticsProvider.NEW_PROJECT_ANALYTICS_API_KEY = "b40f24fcb4f94bccaf64e4dc6337422e";
exports.EqatecAnalyticsProvider = EqatecAnalyticsProvider;
$injector.register("eqatecAnalyticsProvider", EqatecAnalyticsProvider);
