"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const application_manager_base_1 = require("../application-manager-base");
const constants_1 = require("../../constants");
const helpers_1 = require("../../helpers");
const decorators_1 = require("../../decorators");
class AndroidApplicationManager extends application_manager_base_1.ApplicationManagerBase {
    constructor(adb, identifier, $options, $logcatHelper, $androidProcessService, $httpClient, $deviceLogProvider, $logger, $hooksService) {
        super($logger, $hooksService);
        this.adb = adb;
        this.identifier = identifier;
        this.$options = $options;
        this.$logcatHelper = $logcatHelper;
        this.$androidProcessService = $androidProcessService;
        this.$httpClient = $httpClient;
        this.$deviceLogProvider = $deviceLogProvider;
    }
    getInstalledApplications() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = (yield this.adb.executeShellCommand(["pm", "list", "packages"])) || "";
            const regex = /package:(.+)/;
            return result.split(os_1.EOL)
                .map((packageString) => {
                const match = packageString.match(regex);
                return match ? match[1] : null;
            })
                .filter((parsedPackage) => parsedPackage !== null);
        });
    }
    installApplication(packageFilePath, appIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (appIdentifier) {
                const deviceRootPath = `/data/local/tmp/${appIdentifier}`;
                yield this.adb.executeShellCommand(["rm", "-rf", deviceRootPath]);
            }
            return this.adb.executeCommand(["install", "-r", `${packageFilePath}`]);
        });
    }
    uninstallApplication(appIdentifier) {
        return this.adb.executeShellCommand(["pm", "uninstall", `${appIdentifier}`], { treatErrorsAsWarnings: true });
    }
    startApplication(appIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const pmDumpOutput = yield this.adb.executeShellCommand(["pm", "dump", appIdentifier, "|", "grep", "-A", "1", "MAIN"]);
            const activityMatch = this.getFullyQualifiedActivityRegex();
            const match = activityMatch.exec(pmDumpOutput);
            const possibleIdentifier = match && match[0];
            if (possibleIdentifier) {
                yield this.adb.executeShellCommand(["am", "start", "-n", possibleIdentifier]);
            }
            else {
                this.$logger.trace(`Tried starting activity for: ${appIdentifier}, using activity manager but failed.`);
                yield this.adb.executeShellCommand(["monkey", "-p", appIdentifier, "-c", "android.intent.category.LAUNCHER", "1"]);
            }
            if (!this.$options.justlaunch) {
                const deviceIdentifier = this.identifier;
                const processIdentifier = yield this.$androidProcessService.getAppProcessId(deviceIdentifier, appIdentifier);
                if (processIdentifier) {
                    this.$deviceLogProvider.setApplicationPidForDevice(deviceIdentifier, processIdentifier);
                }
                yield this.$logcatHelper.start(this.identifier);
            }
        });
    }
    stopApplication(appIdentifier) {
        this.$logcatHelper.stop(this.identifier);
        return this.adb.executeShellCommand(["am", "force-stop", `${appIdentifier}`]);
    }
    getApplicationInfo(applicationIdentifier) {
        return Promise.resolve(null);
    }
    canStartApplication() {
        return true;
    }
    isLiveSyncSupported(appIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const liveSyncVersion = yield this.adb.sendBroadcastToDevice(constants_1.LiveSyncConstants.CHECK_LIVESYNC_INTENT_NAME, { "app-id": appIdentifier });
            return liveSyncVersion === constants_1.LiveSyncConstants.VERSION_2 || liveSyncVersion === constants_1.LiveSyncConstants.VERSION_3;
        });
    }
    getDebuggableApps() {
        return this.$androidProcessService.getDebuggableApps(this.identifier);
    }
    getDebuggableAppViews(appIdentifiers) {
        return __awaiter(this, void 0, void 0, function* () {
            const mappedAppIdentifierPorts = yield this.$androidProcessService.getMappedAbstractToTcpPorts(this.identifier, appIdentifiers, constants_1.TARGET_FRAMEWORK_IDENTIFIERS.Cordova), applicationViews = {};
            yield Promise.all(_.map(mappedAppIdentifierPorts, (port, appIdentifier) => __awaiter(this, void 0, void 0, function* () {
                applicationViews[appIdentifier] = [];
                const localAddress = `http://127.0.0.1:${port}/json`;
                try {
                    if (port) {
                        const apps = (yield this.$httpClient.httpRequest(localAddress)).body;
                        applicationViews[appIdentifier] = JSON.parse(apps);
                    }
                }
                catch (err) {
                    this.$logger.trace(`Error while checking ${localAddress}. Error is: ${err.message}`);
                }
            })));
            return applicationViews;
        });
    }
    getFullyQualifiedActivityRegex() {
        const androidPackageName = "([A-Za-z]{1}[A-Za-z\\d_]*\\.)*[A-Za-z][A-Za-z\\d_]*";
        const packageActivitySeparator = "\\/";
        const fullJavaClassName = "([a-z][a-z_0-9]*\\.)*[A-Z_$]($[A-Z_$]|[$_\\w_])*";
        return new RegExp(`${androidPackageName}${packageActivitySeparator}${fullJavaClassName}`, `m`);
    }
}
__decorate([
    helpers_1.hook('install')
], AndroidApplicationManager.prototype, "installApplication", null);
__decorate([
    decorators_1.cache()
], AndroidApplicationManager.prototype, "getFullyQualifiedActivityRegex", null);
exports.AndroidApplicationManager = AndroidApplicationManager;
