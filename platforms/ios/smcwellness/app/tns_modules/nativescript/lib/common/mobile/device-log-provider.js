"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const device_log_provider_base_1 = require("./device-log-provider-base");
class DeviceLogProvider extends device_log_provider_base_1.DeviceLogProviderBase {
    constructor($logFilter, $logger) {
        super($logFilter, $logger);
        this.$logFilter = $logFilter;
        this.$logger = $logger;
    }
    logData(lineText, platform, deviceIdentifier) {
        const applicationPid = this.getApplicationPidForDevice(deviceIdentifier);
        const data = this.$logFilter.filterData(platform, lineText, applicationPid);
        if (data) {
            this.$logger.write(data);
        }
    }
    setLogLevel(logLevel, deviceIdentifier) {
        this.$logFilter.loggingLevel = logLevel.toUpperCase();
    }
}
exports.DeviceLogProvider = DeviceLogProvider;
$injector.register("deviceLogProvider", DeviceLogProvider);
