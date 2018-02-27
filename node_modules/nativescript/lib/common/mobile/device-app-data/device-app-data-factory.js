"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DeviceAppDataFactory {
    constructor($deviceAppDataProvider, $injector, $options) {
        this.$deviceAppDataProvider = $deviceAppDataProvider;
        this.$injector = $injector;
        this.$options = $options;
    }
    create(appIdentifier, platform, device, liveSyncOptions) {
        const factoryRules = this.$deviceAppDataProvider.createFactoryRules();
        const isForCompanionApp = (liveSyncOptions && liveSyncOptions.isForCompanionApp) || this.$options.companion;
        const ctor = factoryRules[platform][isForCompanionApp ? "companion" : "vanilla"];
        return this.$injector.resolve(ctor, { _appIdentifier: appIdentifier, device: device, platform: platform });
    }
}
exports.DeviceAppDataFactory = DeviceAppDataFactory;
$injector.register("deviceAppDataFactory", DeviceAppDataFactory);
