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
const path = require("path");
const semver = require("semver");
const constants = require("./constants");
class NpmInstallationManager {
    constructor($npm, $childProcess, $logger, $options, $settingsService, $fs, $staticConfig, $projectDataService) {
        this.$npm = $npm;
        this.$childProcess = $childProcess;
        this.$logger = $logger;
        this.$options = $options;
        this.$settingsService = $settingsService;
        this.$fs = $fs;
        this.$staticConfig = $staticConfig;
        this.$projectDataService = $projectDataService;
    }
    getLatestVersion(packageName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getVersion(packageName, constants.PackageVersion.LATEST);
        });
    }
    getNextVersion(packageName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getVersion(packageName, constants.PackageVersion.NEXT);
        });
    }
    getLatestCompatibleVersion(packageName, referenceVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            referenceVersion = referenceVersion || this.$staticConfig.version;
            const isPreReleaseVersion = semver.prerelease(referenceVersion) !== null;
            const compatibleVersionRange = isPreReleaseVersion
                ? `~${referenceVersion}`
                : `~${semver.major(referenceVersion)}.${semver.minor(referenceVersion)}.0`;
            const latestVersion = yield this.getLatestVersion(packageName);
            if (semver.satisfies(latestVersion, compatibleVersionRange)) {
                return latestVersion;
            }
            const data = yield this.$npm.view(packageName, { "versions": true });
            const maxSatisfying = semver.maxSatisfying(data, compatibleVersionRange);
            return maxSatisfying || latestVersion;
        });
    }
    install(packageName, projectDir, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const packageToInstall = this.$options.frameworkPath || packageName;
                const pathToSave = projectDir;
                const version = (opts && opts.version) || null;
                const dependencyType = (opts && opts.dependencyType) || null;
                return yield this.installCore(packageToInstall, pathToSave, version, dependencyType);
            }
            catch (error) {
                this.$logger.debug(error);
                throw error;
            }
        });
    }
    getInspectorFromCache(inspectorNpmPackageName, projectDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const inspectorPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, inspectorNpmPackageName);
            if (this.inspectorAlreadyInstalled(inspectorPath)) {
                return inspectorPath;
            }
            const cachePath = path.join(this.$settingsService.getProfileDir(), constants.INSPECTOR_CACHE_DIRNAME);
            this.prepareCacheDir(cachePath);
            const pathToPackageInCache = path.join(cachePath, constants.NODE_MODULES_FOLDER_NAME, inspectorNpmPackageName);
            const iOSFrameworkNSValue = this.$projectDataService.getNSValue(projectDir, constants.TNS_IOS_RUNTIME_NAME);
            const version = yield this.getLatestCompatibleVersion(inspectorNpmPackageName, iOSFrameworkNSValue.version);
            let shouldInstall = !this.$fs.exists(pathToPackageInCache);
            if (!shouldInstall) {
                try {
                    const installedVersion = this.$fs.readJson(path.join(pathToPackageInCache, constants.PACKAGE_JSON_FILE_NAME)).version;
                    shouldInstall = version !== installedVersion;
                }
                catch (err) {
                    shouldInstall = true;
                }
            }
            if (shouldInstall) {
                yield this.$childProcess.exec(`npm install ${inspectorNpmPackageName}@${version} --prefix ${cachePath}`);
            }
            this.$logger.out("Using inspector from cache.");
            return pathToPackageInCache;
        });
    }
    prepareCacheDir(cacheDirName) {
        this.$fs.ensureDirectoryExists(cacheDirName);
        const cacheDirPackageJsonLocation = path.join(cacheDirName, constants.PACKAGE_JSON_FILE_NAME);
        if (!this.$fs.exists(cacheDirPackageJsonLocation)) {
            this.$fs.writeJson(cacheDirPackageJsonLocation, {
                name: constants.INSPECTOR_CACHE_DIRNAME,
                version: "0.1.0"
            });
        }
    }
    inspectorAlreadyInstalled(pathToInspector) {
        if (this.$fs.exists(pathToInspector)) {
            return true;
        }
        return false;
    }
    installCore(packageName, pathToSave, version, dependencyType) {
        return __awaiter(this, void 0, void 0, function* () {
            const possiblePackageName = path.resolve(packageName);
            if (this.$fs.exists(possiblePackageName)) {
                packageName = possiblePackageName;
            }
            if (this.isURL(packageName) || this.$fs.exists(packageName) || this.isTgz(packageName)) {
                version = null;
            }
            else {
                version = version || (yield this.getLatestCompatibleVersion(packageName));
            }
            const installResultInfo = yield this.npmInstall(packageName, pathToSave, version, dependencyType);
            const installedPackageName = installResultInfo.name;
            const pathToInstalledPackage = path.join(pathToSave, "node_modules", installedPackageName);
            return pathToInstalledPackage;
        });
    }
    isTgz(packageName) {
        return packageName.indexOf(".tgz") >= 0;
    }
    isURL(str) {
        const urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
        const url = new RegExp(urlRegex, 'i');
        return str.length < 2083 && url.test(str);
    }
    npmInstall(packageName, pathToSave, version, dependencyType) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.out("Installing ", packageName);
            packageName = packageName + (version ? `@${version}` : "");
            const npmOptions = { silent: true, "save-exact": true };
            if (dependencyType) {
                npmOptions[dependencyType] = true;
            }
            return yield this.$npm.install(packageName, pathToSave, npmOptions);
        });
    }
    getVersion(packageName, version) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.$npm.view(packageName, { "dist-tags": true });
            this.$logger.trace("Using version %s. ", data[version]);
            return data[version];
        });
    }
}
exports.NpmInstallationManager = NpmInstallationManager;
$injector.register("npmInstallationManager", NpmInstallationManager);
