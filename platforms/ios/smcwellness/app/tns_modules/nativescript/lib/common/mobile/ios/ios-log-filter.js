"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IOSLogFilter {
    constructor($loggingLevels) {
        this.$loggingLevels = $loggingLevels;
        this.infoFilterRegex = /^.*?(AppBuilder|Cordova|NativeScript).*?(<Notice>:.*?|<Warning>:.*?|<Error>:.*?)$/im;
    }
    filterData(data, logLevel, pid) {
        const specifiedLogLevel = (logLevel || '').toUpperCase();
        if (specifiedLogLevel === this.$loggingLevels.info && data) {
            if (pid) {
                return data.indexOf(`[${pid}]`) !== -1 ? data.trim() : null;
            }
            const matchingInfoMessage = data.match(this.infoFilterRegex);
            return matchingInfoMessage ? matchingInfoMessage[2] : null;
        }
        return data;
    }
}
exports.IOSLogFilter = IOSLogFilter;
$injector.register("iOSLogFilter", IOSLogFilter);
