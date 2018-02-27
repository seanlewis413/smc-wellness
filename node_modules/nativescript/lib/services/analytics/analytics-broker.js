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
const decorators_1 = require("../../common/decorators");
class AnalyticsBroker {
    constructor($analyticsSettingsService, $injector) {
        this.$analyticsSettingsService = $analyticsSettingsService;
        this.$injector = $injector;
    }
    getEqatecAnalyticsProvider() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.$injector.resolve("eqatecAnalyticsProvider");
        });
    }
    getGoogleAnalyticsProvider() {
        return __awaiter(this, void 0, void 0, function* () {
            const clientId = yield this.$analyticsSettingsService.getClientId();
            return this.$injector.resolve("googleAnalyticsProvider", { clientId });
        });
    }
    sendDataForTracking(trackInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const eqatecProvider = yield this.getEqatecAnalyticsProvider();
                const googleProvider = yield this.getGoogleAnalyticsProvider();
                switch (trackInfo.type) {
                    case "exception":
                        yield eqatecProvider.trackError(trackInfo);
                        break;
                    case "feature":
                        yield eqatecProvider.trackInformation(trackInfo);
                        break;
                    case "acceptTrackFeatureUsage":
                        yield eqatecProvider.acceptFeatureUsageTracking(trackInfo);
                        break;
                    case "googleAnalyticsData":
                        yield googleProvider.trackHit(trackInfo);
                        break;
                    case "finish":
                        yield eqatecProvider.finishTracking();
                        break;
                    default:
                        throw new Error(`Invalid tracking type: ${trackInfo.type}`);
                }
            }
            catch (err) {
            }
        });
    }
}
__decorate([
    decorators_1.cache()
], AnalyticsBroker.prototype, "getEqatecAnalyticsProvider", null);
__decorate([
    decorators_1.cache()
], AnalyticsBroker.prototype, "getGoogleAnalyticsProvider", null);
exports.AnalyticsBroker = AnalyticsBroker;
