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
const helpers_1 = require("../common/helpers");
const debug_service_base_1 = require("./debug-service-base");
class AndroidDebugService extends debug_service_base_1.DebugServiceBase {
    constructor(device, $devicesService, $errors, $logger, $androidDeviceDiscovery, $androidProcessService, $net) {
        super(device, $devicesService);
        this.device = device;
        this.$devicesService = $devicesService;
        this.$errors = $errors;
        this.$logger = $logger;
        this.$androidDeviceDiscovery = $androidDeviceDiscovery;
        this.$androidProcessService = $androidProcessService;
        this.$net = $net;
    }
    get platform() {
        return "android";
    }
    debug(debugData, debugOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            this._packageName = debugData.applicationIdentifier;
            return debugOptions.emulator
                ? this.debugOnEmulator(debugData, debugOptions)
                : this.debugOnDevice(debugData, debugOptions);
        });
    }
    debugStart(debugData, debugOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.$devicesService.initialize({ platform: this.platform, deviceId: debugData.deviceIdentifier });
            const action = (device) => this.debugStartCore(debugData.applicationIdentifier, debugOptions);
            yield this.$devicesService.execute(action, this.getCanExecuteAction(debugData.deviceIdentifier));
        });
    }
    debugStop() {
        return this.removePortForwarding();
    }
    getChromeDebugUrl(debugOptions, port) {
        const debugOpts = _.cloneDeep(debugOptions);
        debugOpts.useBundledDevTools = debugOpts.useBundledDevTools === undefined ? true : debugOpts.useBundledDevTools;
        const chromeDebugUrl = super.getChromeDebugUrl(debugOpts, port);
        return chromeDebugUrl;
    }
    debugOnEmulator(debugData, debugOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.$androidDeviceDiscovery.startLookingForDevices();
            return this.debugOnDevice(debugData, debugOptions);
        });
    }
    removePortForwarding(packageName) {
        return __awaiter(this, void 0, void 0, function* () {
            const port = yield this.getForwardedLocalDebugPortForPackageName(this.device.deviceInfo.identifier, packageName || this._packageName);
            return this.device.adb.executeCommand(["forward", "--remove", `tcp:${port}`]);
        });
    }
    getForwardedLocalDebugPortForPackageName(deviceId, packageName) {
        return __awaiter(this, void 0, void 0, function* () {
            let port = -1;
            const forwardsResult = yield this.device.adb.executeCommand(["forward", "--list"]);
            const unixSocketName = `${packageName}-inspectorServer`;
            const regexp = new RegExp(`(?:${deviceId} tcp:)([\\d]+)(?= localabstract:${unixSocketName})`, "g");
            const match = regexp.exec(forwardsResult);
            if (match) {
                port = parseInt(match[1]);
            }
            else {
                port = yield this.$net.getAvailablePortInRange(40000);
                yield this.unixSocketForward(port, `${unixSocketName}`);
            }
            return port;
        });
    }
    unixSocketForward(local, remote) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.device.adb.executeCommand(["forward", `tcp:${local}`, `localabstract:${remote}`]);
        });
    }
    debugOnDevice(debugData, debugOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let packageFile = "";
            if (!debugOptions.start && !debugOptions.emulator) {
                packageFile = debugData.pathToAppPackage;
                this.$logger.out("Using ", packageFile);
            }
            yield this.$devicesService.initialize({ platform: this.platform, deviceId: debugData.deviceIdentifier });
            const action = (device) => this.debugCore(device, packageFile, debugData.applicationIdentifier, debugOptions);
            const deviceActionResult = yield this.$devicesService.execute(action, this.getCanExecuteAction(debugData.deviceIdentifier));
            return deviceActionResult[0].result;
        });
    }
    debugCore(device, packageFile, packageName, debugOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.printDebugPort(device.deviceInfo.identifier, packageName);
            if (debugOptions.start) {
                return yield this.attachDebugger(device.deviceInfo.identifier, packageName, debugOptions);
            }
            else if (debugOptions.stop) {
                yield this.removePortForwarding();
                return null;
            }
            else {
                yield this.debugStartCore(packageName, debugOptions);
                return yield this.attachDebugger(device.deviceInfo.identifier, packageName, debugOptions);
            }
        });
    }
    printDebugPort(deviceId, packageName) {
        return __awaiter(this, void 0, void 0, function* () {
            const port = yield this.getForwardedLocalDebugPortForPackageName(deviceId, packageName);
            this.$logger.info("device: " + deviceId + " debug port: " + port + "\n");
        });
    }
    attachDebugger(deviceId, packageName, debugOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.isAppRunning(packageName, deviceId))) {
                this.$errors.failWithoutHelp(`The application ${packageName} does not appear to be running on ${deviceId} or is not built with debugging enabled.`);
            }
            const port = yield this.getForwardedLocalDebugPortForPackageName(deviceId, packageName);
            return this.getChromeDebugUrl(debugOptions, port);
        });
    }
    debugStartCore(packageName, debugOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.device.applicationManager.stopApplication(packageName);
            if (debugOptions.debugBrk) {
                yield this.device.adb.executeShellCommand([`cat /dev/null > /data/local/tmp/${packageName}-debugbreak`]);
            }
            yield this.device.adb.executeShellCommand([`cat /dev/null > /data/local/tmp/${packageName}-debugger-started`]);
            yield this.device.applicationManager.startApplication(packageName);
            yield this.waitForDebugger(packageName);
        });
    }
    waitForDebugger(packageName) {
        return __awaiter(this, void 0, void 0, function* () {
            const waitText = `0 /data/local/tmp/${packageName}-debugger-started`;
            let maxWait = 12;
            let debuggerStarted = false;
            while (maxWait > 0 && !debuggerStarted) {
                const forwardsResult = yield this.device.adb.executeShellCommand(["ls", "-s", `/data/local/tmp/${packageName}-debugger-started`]);
                maxWait--;
                debuggerStarted = forwardsResult.indexOf(waitText) === -1;
                if (!debuggerStarted) {
                    yield helpers_1.sleep(500);
                }
            }
            if (debuggerStarted) {
                this.$logger.info("# NativeScript Debugger started #");
            }
            else {
                this.$logger.warn("# NativeScript Debugger did not start in time #");
            }
        });
    }
    isAppRunning(appIdentifier, deviceIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const debuggableApps = yield this.$androidProcessService.getDebuggableApps(deviceIdentifier);
            return !!_.find(debuggableApps, a => a.appIdentifier === appIdentifier);
        });
    }
}
exports.AndroidDebugService = AndroidDebugService;
$injector.register("androidDebugService", AndroidDebugService, false);
