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
const net = require("net");
const helpers_1 = require("../../../helpers");
class IosEmulatorServices {
    constructor($logger, $emulatorSettingsService, $errors, $childProcess, $devicePlatformsConstants, $hostInfo, $options, $iOSSimResolver) {
        this.$logger = $logger;
        this.$emulatorSettingsService = $emulatorSettingsService;
        this.$errors = $errors;
        this.$childProcess = $childProcess;
        this.$devicePlatformsConstants = $devicePlatformsConstants;
        this.$hostInfo = $hostInfo;
        this.$options = $options;
        this.$iOSSimResolver = $iOSSimResolver;
    }
    getEmulatorId() {
        return __awaiter(this, void 0, void 0, function* () {
            return "";
        });
    }
    getRunningEmulatorId(image) {
        return __awaiter(this, void 0, void 0, function* () {
            return "";
        });
    }
    checkDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    checkAvailability(dependsOnProject) {
        dependsOnProject = dependsOnProject === undefined ? true : dependsOnProject;
        if (!this.$hostInfo.isDarwin) {
            this.$errors.failWithoutHelp("iOS Simulator is available only on Mac OS X.");
        }
        const platform = this.$devicePlatformsConstants.iOS;
        if (dependsOnProject && !this.$emulatorSettingsService.canStart(platform)) {
            this.$errors.failWithoutHelp("The current project does not target iOS and cannot be run in the iOS Simulator.");
        }
    }
    startEmulator(emulatorImage) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.$iOSSimResolver.iOSSim.startSimulator({
                id: emulatorImage,
                state: "None"
            });
        });
    }
    runApplicationOnEmulator(app, emulatorOptions) {
        return this.runApplicationOnEmulatorCore(app, emulatorOptions);
    }
    postDarwinNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            const iosSimPath = this.$iOSSimResolver.iOSSimPath;
            const nodeCommandName = process.argv[0];
            const iosSimArgs = [iosSimPath, "notify-post", notification];
            if (this.$options.device) {
                iosSimArgs.push("--device", this.$options.device);
            }
            yield this.$childProcess.spawnFromEvent(nodeCommandName, iosSimArgs, "close", { stdio: "inherit" });
        });
    }
    connectToPort(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const socket = yield helpers_1.connectEventuallyUntilTimeout(() => net.connect(data.port), data.timeout || IosEmulatorServices.DEFAULT_TIMEOUT);
                return socket;
            }
            catch (e) {
                this.$logger.debug(e);
            }
        });
    }
    runApplicationOnEmulatorCore(app, emulatorOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.info("Starting iOS Simulator");
            const iosSimPath = this.$iOSSimResolver.iOSSimPath;
            const nodeCommandName = process.argv[0];
            if (this.$options.availableDevices) {
                yield this.$childProcess.spawnFromEvent(nodeCommandName, [iosSimPath, "device-types"], "close", { stdio: "inherit" });
                return;
            }
            let opts = [
                iosSimPath,
                "launch", app, emulatorOptions.appId
            ];
            if (this.$options.timeout) {
                opts = opts.concat("--timeout", this.$options.timeout);
            }
            if (this.$options.sdk) {
                opts = opts.concat("--sdkVersion", this.$options.sdk);
            }
            if (!this.$options.justlaunch) {
                opts.push("--logging");
            }
            else {
                if (emulatorOptions) {
                    if (emulatorOptions.stderrFilePath) {
                        opts = opts.concat("--stderr", emulatorOptions.stderrFilePath);
                    }
                    if (emulatorOptions.stdoutFilePath) {
                        opts = opts.concat("--stdout", emulatorOptions.stdoutFilePath);
                    }
                }
                opts.push("--exit");
            }
            if (this.$options.device) {
                opts = opts.concat("--device", this.$options.device);
            }
            else if (emulatorOptions && emulatorOptions.deviceType) {
                opts = opts.concat("--device", emulatorOptions.deviceType);
            }
            if (emulatorOptions && emulatorOptions.args) {
                opts.push(`--args=${emulatorOptions.args}`);
            }
            if (emulatorOptions && emulatorOptions.waitForDebugger) {
                opts.push("--waitForDebugger");
            }
            if (emulatorOptions && emulatorOptions.skipInstall) {
                opts.push("--skipInstall");
            }
            const stdioOpts = { stdio: (emulatorOptions && emulatorOptions.captureStdin) ? "pipe" : "inherit" };
            return this.$childProcess.spawn(nodeCommandName, opts, stdioOpts);
        });
    }
}
IosEmulatorServices.DEFAULT_TIMEOUT = 10000;
$injector.register("iOSEmulatorServices", IosEmulatorServices);
