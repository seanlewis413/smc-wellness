"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IOSSimulatorLogProvider {
    constructor($iOSSimResolver, $deviceLogProvider, $devicePlatformsConstants, $processService) {
        this.$iOSSimResolver = $iOSSimResolver;
        this.$deviceLogProvider = $deviceLogProvider;
        this.$devicePlatformsConstants = $devicePlatformsConstants;
        this.$processService = $processService;
    }
    startLogProcess(deviceIdentifier) {
        if (!this.isStarted) {
            const deviceLogChildProcess = this.$iOSSimResolver.iOSSim.getDeviceLogProcess(deviceIdentifier, 'senderImagePath contains "NativeScript"');
            const action = (data) => {
                this.$deviceLogProvider.logData(data.toString(), this.$devicePlatformsConstants.iOS, deviceIdentifier);
            };
            if (deviceLogChildProcess.stdout) {
                deviceLogChildProcess.stdout.on("data", action);
            }
            if (deviceLogChildProcess.stderr) {
                deviceLogChildProcess.stderr.on("data", action);
            }
            this.$processService.attachToProcessExitSignals(this, deviceLogChildProcess.kill);
            this.isStarted = true;
        }
    }
}
exports.IOSSimulatorLogProvider = IOSSimulatorLogProvider;
$injector.register("iOSSimulatorLogProvider", IOSSimulatorLogProvider);
