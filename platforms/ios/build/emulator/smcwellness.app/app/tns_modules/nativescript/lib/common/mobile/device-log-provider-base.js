"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const helpers_1 = require("../helpers");
class DeviceLogProviderBase extends events_1.EventEmitter {
    constructor($logFilter, $logger) {
        super();
        this.$logFilter = $logFilter;
        this.$logger = $logger;
        this.devicesLogOptions = {};
    }
    setApplicationPidForDevice(deviceIdentifier, pid) {
        this.setDeviceLogOptionsProperty(deviceIdentifier, (deviceLogOptions) => deviceLogOptions.applicationPid, pid);
    }
    setDefaultLogLevelForDevice(deviceIdentifier) {
        const logLevel = (this.devicesLogOptions[deviceIdentifier] && this.devicesLogOptions[deviceIdentifier].logLevel) || this.$logFilter.loggingLevel;
        this.setLogLevel(logLevel, deviceIdentifier);
        return logLevel;
    }
    getApplicationPidForDevice(deviceIdentifier) {
        return this.devicesLogOptions[deviceIdentifier] && this.devicesLogOptions[deviceIdentifier].applicationPid;
    }
    setDeviceLogOptionsProperty(deviceIdentifier, propNameFunction, propertyValue) {
        const propertyName = helpers_1.getPropertyName(propNameFunction);
        if (propertyName) {
            this.devicesLogOptions[deviceIdentifier] = this.devicesLogOptions[deviceIdentifier] || {};
            this.devicesLogOptions[deviceIdentifier][propertyName] = propertyValue;
        }
    }
}
exports.DeviceLogProviderBase = DeviceLogProviderBase;
