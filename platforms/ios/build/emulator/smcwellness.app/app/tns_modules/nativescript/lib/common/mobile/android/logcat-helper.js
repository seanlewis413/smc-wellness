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
const byline = require("byline");
const device_android_debug_bridge_1 = require("./device-android-debug-bridge");
class LogcatHelper {
    constructor($deviceLogProvider, $devicePlatformsConstants, $logger, $injector, $processService) {
        this.$deviceLogProvider = $deviceLogProvider;
        this.$devicePlatformsConstants = $devicePlatformsConstants;
        this.$logger = $logger;
        this.$injector = $injector;
        this.$processService = $processService;
        this.mapDevicesLoggingData = Object.create(null);
    }
    start(deviceIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (deviceIdentifier && !this.mapDevicesLoggingData[deviceIdentifier]) {
                const adb = this.$injector.resolve(device_android_debug_bridge_1.DeviceAndroidDebugBridge, { identifier: deviceIdentifier });
                const logcatStream = yield adb.executeCommand(["logcat"], { returnChildProcess: true });
                const lineStream = byline(logcatStream.stdout);
                this.mapDevicesLoggingData[deviceIdentifier] = {
                    loggingProcess: logcatStream,
                    lineStream: lineStream
                };
                logcatStream.stderr.on("data", (data) => {
                    this.$logger.trace("ADB logcat stderr: " + data.toString());
                });
                logcatStream.on("close", (code) => {
                    try {
                        this.stop(deviceIdentifier);
                        if (code !== 0) {
                            this.$logger.trace("ADB process exited with code " + code.toString());
                        }
                    }
                    catch (err) {
                    }
                });
                lineStream.on('data', (line) => {
                    const lineText = line.toString();
                    this.$deviceLogProvider.logData(lineText, this.$devicePlatformsConstants.Android, deviceIdentifier);
                });
                this.$processService.attachToProcessExitSignals(this, logcatStream.kill);
            }
        });
    }
    stop(deviceIdentifier) {
        if (this.mapDevicesLoggingData[deviceIdentifier]) {
            this.mapDevicesLoggingData[deviceIdentifier].loggingProcess.removeAllListeners();
            this.mapDevicesLoggingData[deviceIdentifier].lineStream.removeAllListeners();
        }
        delete this.mapDevicesLoggingData[deviceIdentifier];
    }
}
exports.LogcatHelper = LogcatHelper;
$injector.register("logcatHelper", LogcatHelper);
