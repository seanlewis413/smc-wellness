"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const device_log_provider_base_1 = require("../mobile/device-log-provider-base");
class DeviceLogProvider extends device_log_provider_base_1.DeviceLogProviderBase {
    constructor($logFilter, $logger) {
        super($logFilter, $logger);
        this.$logFilter = $logFilter;
    }
    logData(line, platform, deviceIdentifier) {
        const logLevel = this.setDefaultLogLevelForDevice(deviceIdentifier);
        const applicationPid = this.getApplicationPidForDevice(deviceIdentifier), data = this.$logFilter.filterData(platform, line, applicationPid, logLevel);
        if (data) {
            this.emit('data', deviceIdentifier, data);
        }
    }
    setLogLevel(logLevel, deviceIdentifier) {
        if (deviceIdentifier) {
            this.setDeviceLogOptionsProperty(deviceIdentifier, (deviceLogOptions) => deviceLogOptions.logLevel, logLevel.toUpperCase());
        }
        else {
            this.$logFilter.loggingLevel = logLevel.toUpperCase();
            _.keys(this.devicesLogOptions).forEach(deviceId => {
                this.devicesLogOptions[deviceId] = this.devicesLogOptions[deviceId] || {};
                this.devicesLogOptions[deviceId].logLevel = this.$logFilter.loggingLevel;
            });
        }
    }
}
exports.DeviceLogProvider = DeviceLogProvider;
$injector.register("deviceLogProvider", DeviceLogProvider);
