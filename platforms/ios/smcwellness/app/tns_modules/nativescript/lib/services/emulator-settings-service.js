"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EmulatorSettingsService {
    constructor($injector) {
        this.$injector = $injector;
    }
    canStart(platform) {
        const platformService = this.$injector.resolve("platformService");
        const installedPlatforms = platformService.getInstalledPlatforms();
        return _.includes(installedPlatforms, platform.toLowerCase());
    }
    get minVersion() {
        return EmulatorSettingsService.REQURED_ANDROID_APILEVEL;
    }
}
EmulatorSettingsService.REQURED_ANDROID_APILEVEL = 17;
exports.EmulatorSettingsService = EmulatorSettingsService;
$injector.register("emulatorSettingsService", EmulatorSettingsService);
