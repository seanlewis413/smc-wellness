"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const sourcemap = require("source-map");
const path = require("path");
const decorators_1 = require("../common/decorators");
const iOSLogFilterBase = require("../common/mobile/ios/ios-log-filter");
class IOSLogFilter extends iOSLogFilterBase.IOSLogFilter {
    constructor($loggingLevels, $fs, $projectData) {
        super($loggingLevels);
        this.$fs = $fs;
        this.$projectData = $projectData;
        this.infoFilterRegex = /^.*?((?:<Notice>:)?.*?(((?:CONSOLE|JS) (?:LOG|ERROR)).*?))$/im;
        this.partialLine = null;
    }
    filterData(data, logLevel, pid) {
        data = super.filterData(data, logLevel, pid);
        if (pid && data && data.indexOf(`[${pid}]`) === -1) {
            return null;
        }
        if (data) {
            const skipLastLine = data[data.length - 1] !== "\n";
            const lines = data.split("\n");
            let result = "";
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (i === 0 && this.partialLine) {
                    line = this.partialLine + line;
                    this.partialLine = null;
                }
                if (line.length < 1 ||
                    line.indexOf("SecTaskCopyDebugDescription") !== -1 ||
                    line.indexOf("NativeScript loaded bundle") !== -1 ||
                    (line.indexOf("assertion failed:") !== -1 && data.indexOf("libxpc.dylib") !== -1)) {
                    continue;
                }
                if (pid) {
                    if (line.indexOf(`[${pid}]: `) !== -1) {
                        const pidRegex = new RegExp(`^.*\\[${pid}\\]:\\s(?:\\(NativeScript\\)\\s)?`);
                        line = line.replace(pidRegex, "").trim();
                        this.getOriginalFileLocation(line);
                        result += this.getOriginalFileLocation(line) + "\n";
                    }
                    continue;
                }
                if (skipLastLine && i === lines.length - 1 && lines.length > 1) {
                    this.partialLine = line;
                }
                else {
                    result += this.getOriginalFileLocation(line) + "\n";
                }
            }
            return result;
        }
        return data;
    }
    getOriginalFileLocation(data) {
        const fileString = "file:///";
        const fileIndex = data.indexOf(fileString);
        const projectDir = this.getProjectDir();
        if (fileIndex >= 0 && projectDir) {
            const parts = data.substring(fileIndex + fileString.length).split(":");
            if (parts.length >= 4) {
                const file = parts[0];
                const sourceMapFile = path.join(projectDir, file + ".map");
                const row = parseInt(parts[1]);
                const column = parseInt(parts[2]);
                if (this.$fs.exists(sourceMapFile)) {
                    const sourceMap = this.$fs.readText(sourceMapFile);
                    const smc = new sourcemap.SourceMapConsumer(sourceMap);
                    const originalPosition = smc.originalPositionFor({ line: row, column: column });
                    const sourceFile = smc.sources.length > 0 ? file.replace(smc.file, smc.sources[0]) : file;
                    data = data.substring(0, fileIndex + fileString.length)
                        + sourceFile + ":"
                        + originalPosition.line + ":"
                        + originalPosition.column;
                    for (let i = 3; i < parts.length; i++) {
                        data += ":" + parts[i];
                    }
                }
            }
        }
        return data;
    }
    getProjectDir() {
        try {
            this.$projectData.initializeProjectData();
            return this.$projectData.projectDir;
        }
        catch (err) {
            return null;
        }
    }
}
__decorate([
    decorators_1.cache()
], IOSLogFilter.prototype, "getProjectDir", null);
exports.IOSLogFilter = IOSLogFilter;
$injector.register("iOSLogFilter", IOSLogFilter);
