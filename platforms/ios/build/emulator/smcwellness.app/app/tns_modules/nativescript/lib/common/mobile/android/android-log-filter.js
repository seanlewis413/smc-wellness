"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
class AndroidLogFilter {
    constructor($loggingLevels) {
        this.$loggingLevels = $loggingLevels;
    }
    filterData(data, logLevel, pid) {
        const specifiedLogLevel = (logLevel || '').toUpperCase();
        if (specifiedLogLevel === this.$loggingLevels.info) {
            const log = this.getConsoleLogFromLine(data, pid);
            if (log) {
                if (log.tag) {
                    return `${log.tag}: ${log.message}` + os.EOL;
                }
                else {
                    return log.message + os.EOL;
                }
            }
            return null;
        }
        return data + os.EOL;
    }
    getConsoleLogFromLine(lineText, pid) {
        if (pid && lineText.indexOf(pid) < 0) {
            return null;
        }
        const acceptedTags = ["chromium", "Web Console", "JS", "ActivityManager", "System.err"];
        let consoleLogMessage;
        const match = lineText.match(AndroidLogFilter.LINE_REGEX) || lineText.match(AndroidLogFilter.API_LEVEL_23_LINE_REGEX);
        if (match && acceptedTags.indexOf(match[1].trim()) !== -1) {
            consoleLogMessage = { tag: match[1].trim(), message: match[2] };
        }
        if (!consoleLogMessage) {
            const matchingTag = _.some(acceptedTags, (tag) => { return lineText.indexOf(tag) !== -1; });
            consoleLogMessage = matchingTag ? { message: lineText } : null;
        }
        return consoleLogMessage;
    }
}
AndroidLogFilter.LINE_REGEX = /.\/(.+?)\s*\(\s*\d+?\): (.*)/;
AndroidLogFilter.API_LEVEL_23_LINE_REGEX = /.+?\s+?(?:[A-Z]\s+?)([A-Za-z \.]+?)\s*?\: (.*)/;
exports.AndroidLogFilter = AndroidLogFilter;
$injector.register("androidLogFilter", AndroidLogFilter);
