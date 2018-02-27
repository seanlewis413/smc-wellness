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
const events_1 = require("events");
const constants_1 = require("../constants");
class ApplicationManagerBase extends events_1.EventEmitter {
    constructor($logger, $hooksService) {
        super();
        this.$logger = $logger;
        this.$hooksService = $hooksService;
        this.lastAvailableDebuggableAppViews = {};
    }
    reinstallApplication(appIdentifier, packageFilePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const isApplicationInstalled = yield this.isApplicationInstalled(appIdentifier);
            if (isApplicationInstalled) {
                yield this.uninstallApplication(appIdentifier);
            }
            yield this.installApplication(packageFilePath, appIdentifier);
        });
    }
    restartApplication(appIdentifier, appName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.stopApplication(appIdentifier, appName);
            yield this.startApplication(appIdentifier);
        });
    }
    isApplicationInstalled(appIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkForApplicationUpdates();
            return _.includes(this.lastInstalledAppIdentifiers, appIdentifier);
        });
    }
    checkForApplicationUpdates() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.checkForApplicationUpdatesPromise) {
                this.checkForApplicationUpdatesPromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let isFulfilled = false;
                    try {
                        const currentlyInstalledAppIdentifiers = yield this.getInstalledApplications();
                        const previouslyInstalledAppIdentifiers = this.lastInstalledAppIdentifiers || [];
                        const newAppIdentifiers = _.difference(currentlyInstalledAppIdentifiers, previouslyInstalledAppIdentifiers);
                        const removedAppIdentifiers = _.difference(previouslyInstalledAppIdentifiers, currentlyInstalledAppIdentifiers);
                        this.lastInstalledAppIdentifiers = currentlyInstalledAppIdentifiers;
                        _.each(newAppIdentifiers, appIdentifier => this.emit("applicationInstalled", appIdentifier));
                        _.each(removedAppIdentifiers, appIdentifier => this.emit("applicationUninstalled", appIdentifier));
                        yield this.checkForAvailableDebuggableAppsChanges();
                    }
                    catch (err) {
                        isFulfilled = true;
                        reject(err);
                    }
                    finally {
                        this.checkForApplicationUpdatesPromise = null;
                        if (!isFulfilled) {
                            resolve();
                        }
                    }
                }));
            }
            return this.checkForApplicationUpdatesPromise;
        });
    }
    tryStartApplication(appIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.canStartApplication()) {
                    yield this.startApplication(appIdentifier);
                }
            }
            catch (err) {
                this.$logger.trace(`Unable to start application ${appIdentifier}. Error is: ${err.message}`);
            }
        });
    }
    checkForAvailableDebuggableAppsChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentlyAvailableDebuggableApps = yield this.getDebuggableApps();
            const previouslyAvailableDebuggableApps = this.lastAvailableDebuggableApps || [];
            const newAvailableDebuggableApps = _.differenceBy(currentlyAvailableDebuggableApps, previouslyAvailableDebuggableApps, "appIdentifier");
            const notAvailableAppsForDebugging = _.differenceBy(previouslyAvailableDebuggableApps, currentlyAvailableDebuggableApps, "appIdentifier");
            this.lastAvailableDebuggableApps = currentlyAvailableDebuggableApps;
            _.each(newAvailableDebuggableApps, (appInfo) => {
                this.emit("debuggableAppFound", appInfo);
            });
            _.each(notAvailableAppsForDebugging, (appInfo) => {
                this.emit("debuggableAppLost", appInfo);
                if (_.has(this.lastAvailableDebuggableAppViews, appInfo.appIdentifier)) {
                    delete this.lastAvailableDebuggableAppViews[appInfo.appIdentifier];
                }
            });
            const cordovaDebuggableAppIdentifiers = _(currentlyAvailableDebuggableApps)
                .filter(c => c.framework === constants_1.TARGET_FRAMEWORK_IDENTIFIERS.Cordova)
                .map(c => c.appIdentifier)
                .value();
            const currentlyAvailableAppViews = yield this.getDebuggableAppViews(cordovaDebuggableAppIdentifiers);
            _.each(currentlyAvailableAppViews, (currentlyAvailableViews, appIdentifier) => {
                const previouslyAvailableViews = this.lastAvailableDebuggableAppViews[appIdentifier];
                const newAvailableViews = _.differenceBy(currentlyAvailableViews, previouslyAvailableViews, "id");
                const notAvailableViews = _.differenceBy(previouslyAvailableViews, currentlyAvailableViews, "id");
                _.each(notAvailableViews, debugWebViewInfo => {
                    this.emit("debuggableViewLost", appIdentifier, debugWebViewInfo);
                });
                _.each(newAvailableViews, debugWebViewInfo => {
                    this.emit("debuggableViewFound", appIdentifier, debugWebViewInfo);
                });
                const keptViews = _.differenceBy(currentlyAvailableViews, newAvailableViews, "id");
                _.each(keptViews, view => {
                    const previousTimeViewInfo = _.find(previouslyAvailableViews, previousView => previousView.id === view.id);
                    if (!_.isEqual(view, previousTimeViewInfo)) {
                        this.emit("debuggableViewChanged", appIdentifier, view);
                    }
                });
                this.lastAvailableDebuggableAppViews[appIdentifier] = currentlyAvailableViews;
            });
        });
    }
}
exports.ApplicationManagerBase = ApplicationManagerBase;
