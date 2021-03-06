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
const semver = require("semver");
const os_1 = require("os");
const decorators_1 = require("./common/decorators");
const helpers_1 = require("./common/helpers");
class AndroidToolsInfo {
    constructor($childProcess, $errors, $fs, $hostInfo, $logger, $options, $staticConfig) {
        this.$childProcess = $childProcess;
        this.$errors = $errors;
        this.$fs = $fs;
        this.$hostInfo = $hostInfo;
        this.$logger = $logger;
        this.$options = $options;
        this.$staticConfig = $staticConfig;
    }
    get androidHome() {
        return process.env["ANDROID_HOME"];
    }
    getToolsInfo() {
        if (!this.toolsInfo) {
            const infoData = Object.create(null);
            infoData.androidHomeEnvVar = this.androidHome;
            infoData.compileSdkVersion = this.getCompileSdkVersion();
            infoData.buildToolsVersion = this.getBuildToolsVersion();
            infoData.targetSdkVersion = this.getTargetSdk();
            infoData.supportRepositoryVersion = this.getAndroidSupportRepositoryVersion();
            infoData.generateTypings = this.shouldGenerateTypings();
            this.toolsInfo = infoData;
        }
        return this.toolsInfo;
    }
    validateInfo(options) {
        let detectedErrors = false;
        this.showWarningsAsErrors = options && options.showWarningsAsErrors;
        const toolsInfoData = this.getToolsInfo();
        const isAndroidHomeValid = this.validateAndroidHomeEnvVariable();
        if (!toolsInfoData.compileSdkVersion) {
            this.printMessage(`Cannot find a compatible Android SDK for compilation. To be able to build for Android, install Android SDK ${AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET} or later.`, `Run \`\$ ${this.getPathToSdkManagementTool()}\` to manage your Android SDK versions.`);
            detectedErrors = true;
        }
        if (!toolsInfoData.buildToolsVersion) {
            const buildToolsRange = this.getBuildToolsRange();
            const versionRangeMatches = buildToolsRange.match(/^.*?([\d\.]+)\s+.*?([\d\.]+)$/);
            let message = `You can install any version in the following range: '${buildToolsRange}'.`;
            if (versionRangeMatches && versionRangeMatches[1] && versionRangeMatches[2] && versionRangeMatches[1] === versionRangeMatches[2]) {
                message = `You have to install version ${versionRangeMatches[1]}.`;
            }
            let invalidBuildToolsAdditionalMsg = `Run \`\$ ${this.getPathToSdkManagementTool()}\` from your command-line to install required \`Android Build Tools\`.`;
            if (!isAndroidHomeValid) {
                invalidBuildToolsAdditionalMsg += ' In case you already have them installed, make sure `ANDROID_HOME` environment variable is set correctly.';
            }
            this.printMessage("You need to have the Android SDK Build-tools installed on your system. " + message, invalidBuildToolsAdditionalMsg);
            detectedErrors = true;
        }
        if (!toolsInfoData.supportRepositoryVersion) {
            let invalidSupportLibAdditionalMsg = `Run \`\$ ${this.getPathToSdkManagementTool()}\` to manage the Android Support Repository.`;
            if (!isAndroidHomeValid) {
                invalidSupportLibAdditionalMsg += ' In case you already have it installed, make sure `ANDROID_HOME` environment variable is set correctly.';
            }
            this.printMessage(`You need to have Android SDK ${AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET} or later and the latest Android Support Repository installed on your system.`, invalidSupportLibAdditionalMsg);
            detectedErrors = true;
        }
        if (options && options.validateTargetSdk) {
            const targetSdk = toolsInfoData.targetSdkVersion;
            const newTarget = `${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-${targetSdk}`;
            if (!_.includes(AndroidToolsInfo.SUPPORTED_TARGETS, newTarget)) {
                const supportedVersions = AndroidToolsInfo.SUPPORTED_TARGETS.sort();
                const minSupportedVersion = this.parseAndroidSdkString(_.first(supportedVersions));
                if (targetSdk && (targetSdk < minSupportedVersion)) {
                    this.printMessage(`The selected Android target SDK ${newTarget} is not supported. You must target ${minSupportedVersion} or later.`);
                    detectedErrors = true;
                }
                else if (!targetSdk || targetSdk > this.getMaxSupportedVersion()) {
                    this.$logger.warn(`Support for the selected Android target SDK ${newTarget} is not verified. Your Android app might not work as expected.`);
                }
            }
        }
        return detectedErrors || !isAndroidHomeValid;
    }
    validateJavacVersion(installedJavacVersion, options) {
        let hasProblemWithJavaVersion = false;
        if (options) {
            this.showWarningsAsErrors = options.showWarningsAsErrors;
        }
        const additionalMessage = "You will not be able to build your projects for Android." + os_1.EOL
            + "To be able to build for Android, verify that you have installed The Java Development Kit (JDK) and configured it according to system requirements as" + os_1.EOL +
            " described in " + this.$staticConfig.SYS_REQUIREMENTS_LINK;
        const matchingVersion = helpers_1.appendZeroesToVersion(installedJavacVersion || "", 3).match(AndroidToolsInfo.VERSION_REGEX);
        const installedJavaCompilerVersion = matchingVersion && matchingVersion[1];
        if (installedJavaCompilerVersion) {
            if (semver.lt(installedJavaCompilerVersion, AndroidToolsInfo.MIN_JAVA_VERSION)) {
                hasProblemWithJavaVersion = true;
                this.printMessage(`Javac version ${installedJavacVersion} is not supported. You have to install at least ${AndroidToolsInfo.MIN_JAVA_VERSION}.`, additionalMessage);
            }
            else if (semver.gte(installedJavaCompilerVersion, AndroidToolsInfo.MAX_JAVA_VERSION)) {
                hasProblemWithJavaVersion = true;
                this.printMessage(`Javac version ${installedJavacVersion} is not supported. You have to install version ${AndroidToolsInfo.MIN_JAVA_VERSION}.`, additionalMessage);
            }
        }
        else {
            hasProblemWithJavaVersion = true;
            this.printMessage("Error executing command 'javac'. Make sure you have installed The Java Development Kit (JDK) and set JAVA_HOME environment variable.", additionalMessage);
        }
        return hasProblemWithJavaVersion;
    }
    getPathToAdbFromAndroidHome() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.androidHome) {
                const pathToAdb = path.join(this.androidHome, "platform-tools", "adb");
                try {
                    yield this.$childProcess.execFile(pathToAdb, ["help"]);
                    return pathToAdb;
                }
                catch (err) {
                    this.$logger.trace(`Error while executing '${pathToAdb} help'. Error is: ${err.message}`);
                }
            }
            return null;
        });
    }
    validateAndroidHomeEnvVariable(options) {
        if (options) {
            this.showWarningsAsErrors = options.showWarningsAsErrors;
        }
        const expectedDirectoriesInAndroidHome = ["build-tools", "tools", "platform-tools", "extras"];
        let androidHomeValidationResult = true;
        if (!this.androidHome || !this.$fs.exists(this.androidHome)) {
            this.printMessage("The ANDROID_HOME environment variable is not set or it points to a non-existent directory. You will not be able to perform any build-related operations for Android.", "To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory.");
            androidHomeValidationResult = false;
        }
        else if (!_.some(expectedDirectoriesInAndroidHome.map(dir => this.$fs.exists(path.join(this.androidHome, dir))))) {
            this.printMessage("The ANDROID_HOME environment variable points to incorrect directory. You will not be able to perform any build-related operations for Android.", "To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory, " +
                "where you will find `tools` and `platform-tools` directories.");
            androidHomeValidationResult = false;
        }
        return androidHomeValidationResult;
    }
    getPathToSdkManagementTool() {
        const sdkManagerName = "sdkmanager";
        let sdkManagementToolPath = sdkManagerName;
        const isAndroidHomeValid = this.validateAndroidHomeEnvVariable();
        if (isAndroidHomeValid) {
            const pathToSdkManager = path.join(this.androidHome, "tools", "bin", sdkManagerName);
            const pathToAndroidExecutable = path.join(this.androidHome, "tools", "android");
            const pathToExecutable = this.$fs.exists(pathToSdkManager) ? pathToSdkManager : pathToAndroidExecutable;
            this.$logger.trace(`Path to Android SDK Management tool is: ${pathToExecutable}`);
            sdkManagementToolPath = pathToExecutable.replace(this.androidHome, this.$hostInfo.isWindows ? "%ANDROID_HOME%" : "$ANDROID_HOME");
        }
        return sdkManagementToolPath;
    }
    shouldGenerateTypings() {
        return this.$options.androidTypings;
    }
    printMessage(msg, additionalMsg) {
        if (this.showWarningsAsErrors) {
            this.$errors.failWithoutHelp(msg);
        }
        else {
            this.$logger.warn(msg);
        }
        if (additionalMsg) {
            this.$logger.printMarkdown(additionalMsg);
        }
    }
    getCompileSdkVersion() {
        if (!this.selectedCompileSdk) {
            const userSpecifiedCompileSdk = this.$options.compileSdk;
            if (userSpecifiedCompileSdk) {
                const installedTargets = this.getInstalledTargets();
                const androidCompileSdk = `${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-${userSpecifiedCompileSdk}`;
                if (!_.includes(installedTargets, androidCompileSdk)) {
                    this.$errors.failWithoutHelp(`You have specified '${userSpecifiedCompileSdk}' for compile sdk, but it is not installed on your system.`);
                }
                this.selectedCompileSdk = userSpecifiedCompileSdk;
            }
            else {
                const latestValidAndroidTarget = this.getLatestValidAndroidTarget();
                if (latestValidAndroidTarget) {
                    const integerVersion = this.parseAndroidSdkString(latestValidAndroidTarget);
                    if (integerVersion && integerVersion >= AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET) {
                        this.selectedCompileSdk = integerVersion;
                    }
                }
            }
        }
        return this.selectedCompileSdk;
    }
    getTargetSdk() {
        const targetSdk = this.$options.sdk ? parseInt(this.$options.sdk) : this.getCompileSdkVersion();
        this.$logger.trace(`Selected targetSdk is: ${targetSdk}`);
        return targetSdk;
    }
    getMatchingDir(pathToDir, versionRange) {
        let selectedVersion;
        if (this.$fs.exists(pathToDir)) {
            const subDirs = this.$fs.readDirectory(pathToDir);
            this.$logger.trace(`Directories found in ${pathToDir} are ${subDirs.join(", ")}`);
            const subDirsVersions = subDirs
                .map(dirName => {
                const dirNameGroups = dirName.match(AndroidToolsInfo.VERSION_REGEX);
                if (dirNameGroups) {
                    return dirNameGroups[1];
                }
                return null;
            })
                .filter(dirName => !!dirName);
            this.$logger.trace(`Versions found in ${pathToDir} are ${subDirsVersions.join(", ")}`);
            const version = semver.maxSatisfying(subDirsVersions, versionRange);
            if (version) {
                selectedVersion = _.find(subDirs, dir => dir.indexOf(version) !== -1);
            }
        }
        this.$logger.trace("Selected version is: ", selectedVersion);
        return selectedVersion;
    }
    getBuildToolsRange() {
        return `${AndroidToolsInfo.REQUIRED_BUILD_TOOLS_RANGE_PREFIX} <=${this.getMaxSupportedVersion()}`;
    }
    getBuildToolsVersion() {
        let buildToolsVersion;
        if (this.androidHome) {
            const pathToBuildTools = path.join(this.androidHome, "build-tools");
            const buildToolsRange = this.getBuildToolsRange();
            buildToolsVersion = this.getMatchingDir(pathToBuildTools, buildToolsRange);
        }
        return buildToolsVersion;
    }
    getAppCompatRange() {
        const compileSdkVersion = this.getCompileSdkVersion();
        let requiredAppCompatRange;
        if (compileSdkVersion) {
            requiredAppCompatRange = `>=${compileSdkVersion} <${compileSdkVersion + 1}`;
        }
        return requiredAppCompatRange;
    }
    getAndroidSupportRepositoryVersion() {
        let selectedAppCompatVersion;
        const requiredAppCompatRange = this.getAppCompatRange();
        if (this.androidHome && requiredAppCompatRange) {
            const pathToAppCompat = path.join(this.androidHome, "extras", "android", "m2repository", "com", "android", "support", "appcompat-v7");
            selectedAppCompatVersion = this.getMatchingDir(pathToAppCompat, requiredAppCompatRange);
            if (!selectedAppCompatVersion) {
                selectedAppCompatVersion = this.getMatchingDir(pathToAppCompat, "*");
            }
        }
        this.$logger.trace(`Selected AppCompat version is: ${selectedAppCompatVersion}`);
        return selectedAppCompatVersion;
    }
    getLatestValidAndroidTarget() {
        const installedTargets = this.getInstalledTargets();
        return _.findLast(AndroidToolsInfo.SUPPORTED_TARGETS.sort(), supportedTarget => _.includes(installedTargets, supportedTarget));
    }
    parseAndroidSdkString(androidSdkString) {
        return parseInt(androidSdkString.replace(`${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-`, ""));
    }
    getInstalledTargets() {
        let installedTargets = [];
        if (this.androidHome) {
            const pathToInstalledTargets = path.join(this.androidHome, "platforms");
            if (this.$fs.exists(pathToInstalledTargets)) {
                installedTargets = this.$fs.readDirectory(pathToInstalledTargets);
            }
        }
        this.$logger.trace("Installed Android Targets are: ", installedTargets);
        return installedTargets;
    }
    getMaxSupportedVersion() {
        return this.parseAndroidSdkString(_.last(AndroidToolsInfo.SUPPORTED_TARGETS.sort()));
    }
}
AndroidToolsInfo.ANDROID_TARGET_PREFIX = "android";
AndroidToolsInfo.SUPPORTED_TARGETS = ["android-17", "android-18", "android-19", "android-21", "android-22", "android-23", "android-24", "android-25", "android-26", "android-27"];
AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET = 22;
AndroidToolsInfo.REQUIRED_BUILD_TOOLS_RANGE_PREFIX = ">=23";
AndroidToolsInfo.VERSION_REGEX = /((\d+\.){2}\d+)/;
AndroidToolsInfo.MIN_JAVA_VERSION = "1.8.0";
AndroidToolsInfo.MAX_JAVA_VERSION = "1.9.0";
__decorate([
    decorators_1.cache()
], AndroidToolsInfo.prototype, "getToolsInfo", null);
__decorate([
    decorators_1.cache()
], AndroidToolsInfo.prototype, "validateAndroidHomeEnvVariable", null);
__decorate([
    decorators_1.cache()
], AndroidToolsInfo.prototype, "getPathToSdkManagementTool", null);
__decorate([
    decorators_1.cache()
], AndroidToolsInfo.prototype, "getInstalledTargets", null);
exports.AndroidToolsInfo = AndroidToolsInfo;
$injector.register("androidToolsInfo", AndroidToolsInfo);
