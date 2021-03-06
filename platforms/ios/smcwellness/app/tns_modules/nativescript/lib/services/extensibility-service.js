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
const path = require("path");
const decorators_1 = require("../common/decorators");
const constants = require("../constants");
class ExtensibilityService {
    constructor($fs, $logger, $npm, $settingsService, $requireService) {
        this.$fs = $fs;
        this.$logger = $logger;
        this.$npm = $npm;
        this.$settingsService = $settingsService;
        this.$requireService = $requireService;
    }
    get pathToExtensions() {
        return path.join(this.$settingsService.getProfileDir(), "extensions");
    }
    get pathToPackageJson() {
        return path.join(this.pathToExtensions, constants.PACKAGE_JSON_FILE_NAME);
    }
    installExtension(extensionName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.trace(`Start installation of extension '${extensionName}'.`);
            yield this.assertPackageJsonExists();
            const npmOpts = {
                save: true,
                ["save-exact"]: true
            };
            const localPath = path.resolve(extensionName);
            const packageName = this.$fs.exists(localPath) ? localPath : extensionName;
            const installResultInfo = yield this.$npm.install(packageName, this.pathToExtensions, npmOpts);
            this.$logger.trace(`Finished installation of extension '${extensionName}'. Trying to load it now.`);
            return { extensionName: installResultInfo.name };
        });
    }
    uninstallExtension(extensionName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.trace(`Start uninstallation of extension '${extensionName}'.`);
            yield this.assertPackageJsonExists();
            yield this.$npm.uninstall(extensionName, { save: true }, this.pathToExtensions);
            this.$logger.trace(`Finished uninstallation of extension '${extensionName}'.`);
        });
    }
    loadExtensions() {
        this.$logger.trace("Loading extensions.");
        let dependencies = null;
        try {
            dependencies = this.getInstalledExtensions();
        }
        catch (err) {
            this.$logger.trace(`Error while getting installed dependencies: ${err.message}. No extensions will be loaded.`);
        }
        return _.keys(dependencies)
            .map(name => this.loadExtension(name));
    }
    getInstalledExtensions() {
        if (this.$fs.exists(this.pathToPackageJson)) {
            return this.$fs.readJson(this.pathToPackageJson).dependencies;
        }
        return null;
    }
    loadExtension(extensionName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.assertExtensionIsInstalled(extensionName);
                const pathToExtension = path.join(this.pathToExtensions, constants.NODE_MODULES_FOLDER_NAME, extensionName);
                this.$requireService.require(pathToExtension);
                return { extensionName };
            }
            catch (error) {
                this.$logger.warn(`Error while loading ${extensionName} is: ${error.message}`);
                const err = new Error(`Unable to load extension ${extensionName}. You will not be able to use the functionality that it adds. Error: ${error.message}`);
                err.extensionName = extensionName;
                throw err;
            }
        });
    }
    assertExtensionIsInstalled(extensionName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.trace(`Asserting extension ${extensionName} is installed.`);
            const installedExtensions = this.$fs.readDirectory(path.join(this.pathToExtensions, constants.NODE_MODULES_FOLDER_NAME));
            if (installedExtensions.indexOf(extensionName) === -1) {
                this.$logger.trace(`Extension ${extensionName} is not installed, starting installation.`);
                yield this.installExtension(extensionName);
            }
            this.$logger.trace(`Extension ${extensionName} is installed.`);
        });
    }
    assertExtensionsDirExists() {
        if (!this.$fs.exists(this.pathToExtensions)) {
            this.$fs.createDirectory(this.pathToExtensions);
        }
    }
    assertPackageJsonExists() {
        this.assertExtensionsDirExists();
        if (!this.$fs.exists(this.pathToPackageJson)) {
            this.$logger.trace(`Creating ${this.pathToPackageJson}.`);
            this.$fs.writeJson(this.pathToPackageJson, {
                name: "nativescript-extensibility",
                version: "1.0.0",
                description: "The place where all packages that extend CLI will be installed.",
                license: "Apache-2.0",
                readme: "The place where all packages that extend CLI will be installed.",
                repository: "none",
                dependencies: {}
            });
            this.$logger.trace(`Created ${this.pathToPackageJson}.`);
        }
    }
}
__decorate([
    decorators_1.exported("extensibilityService")
], ExtensibilityService.prototype, "installExtension", null);
__decorate([
    decorators_1.exported("extensibilityService")
], ExtensibilityService.prototype, "uninstallExtension", null);
__decorate([
    decorators_1.exported("extensibilityService")
], ExtensibilityService.prototype, "loadExtensions", null);
__decorate([
    decorators_1.exported("extensibilityService")
], ExtensibilityService.prototype, "getInstalledExtensions", null);
__decorate([
    decorators_1.exported("extensibilityService")
], ExtensibilityService.prototype, "loadExtension", null);
__decorate([
    decorators_1.cache()
], ExtensibilityService.prototype, "assertExtensionsDirExists", null);
__decorate([
    decorators_1.cache()
], ExtensibilityService.prototype, "assertPackageJsonExists", null);
exports.ExtensibilityService = ExtensibilityService;
$injector.register("extensibilityService", ExtensibilityService);
