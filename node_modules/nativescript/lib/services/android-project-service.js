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
const shell = require("shelljs");
const constants = require("../constants");
const semver = require("semver");
const projectServiceBaseLib = require("./platform-project-service-base");
const device_android_debug_bridge_1 = require("../common/mobile/android/device-android-debug-bridge");
const helpers_1 = require("../common/helpers");
const os_1 = require("os");
const constants_1 = require("../common/constants");
class AndroidProjectService extends projectServiceBaseLib.PlatformProjectServiceBase {
    constructor($androidEmulatorServices, $androidToolsInfo, $childProcess, $errors, $fs, $hostInfo, $logger, $projectDataService, $sysInfo, $injector, $pluginVariablesService, $devicePlatformsConstants, $npm) {
        super($fs, $projectDataService);
        this.$androidEmulatorServices = $androidEmulatorServices;
        this.$androidToolsInfo = $androidToolsInfo;
        this.$childProcess = $childProcess;
        this.$errors = $errors;
        this.$hostInfo = $hostInfo;
        this.$logger = $logger;
        this.$sysInfo = $sysInfo;
        this.$injector = $injector;
        this.$pluginVariablesService = $pluginVariablesService;
        this.$devicePlatformsConstants = $devicePlatformsConstants;
        this.$npm = $npm;
        this._platformsDirCache = null;
        this._platformData = null;
        this._androidProjectPropertiesManagers = Object.create(null);
        this.isAndroidStudioTemplate = false;
    }
    getPlatformData(projectData) {
        if (!projectData && !this._platformData) {
            throw new Error("First call of getPlatformData without providing projectData.");
        }
        if (projectData && projectData.platformsDir) {
            const projectRoot = path.join(projectData.platformsDir, AndroidProjectService.ANDROID_PLATFORM_NAME);
            if (this.isAndroidStudioCompatibleTemplate(projectData)) {
                this.isAndroidStudioTemplate = true;
            }
            const appDestinationDirectoryArr = [projectRoot];
            if (this.isAndroidStudioTemplate) {
                appDestinationDirectoryArr.push(constants.APP_FOLDER_NAME);
            }
            appDestinationDirectoryArr.push(constants.SRC_DIR, constants.MAIN_DIR, constants.ASSETS_DIR);
            const configurationsDirectoryArr = [projectRoot];
            if (this.isAndroidStudioTemplate) {
                configurationsDirectoryArr.push(constants.APP_FOLDER_NAME);
            }
            configurationsDirectoryArr.push(constants.SRC_DIR, constants.MAIN_DIR, constants.MANIFEST_FILE_NAME);
            const deviceBuildOutputArr = [projectRoot];
            if (this.isAndroidStudioTemplate) {
                deviceBuildOutputArr.push(constants.APP_FOLDER_NAME);
            }
            deviceBuildOutputArr.push(constants.BUILD_DIR, constants.OUTPUTS_DIR, constants.APK_DIR);
            this._platformsDirCache = projectData.platformsDir;
            const packageName = this.getProjectNameFromId(projectData);
            this._platformData = {
                frameworkPackageName: constants.TNS_ANDROID_RUNTIME_NAME,
                normalizedPlatformName: "Android",
                appDestinationDirectoryPath: path.join(...appDestinationDirectoryArr),
                platformProjectService: this,
                emulatorServices: this.$androidEmulatorServices,
                projectRoot: projectRoot,
                deviceBuildOutputPath: path.join(...deviceBuildOutputArr),
                getValidPackageNames: (buildOptions) => {
                    const buildMode = buildOptions.isReleaseBuild ? constants_1.Configurations.Release.toLowerCase() : constants_1.Configurations.Debug.toLowerCase();
                    return [
                        `${packageName}-${buildMode}.apk`,
                        `${projectData.projectName}-${buildMode}.apk`,
                        `${projectData.projectName}.apk`
                    ];
                },
                frameworkFilesExtensions: [".jar", ".dat", ".so"],
                configurationFileName: constants.MANIFEST_FILE_NAME,
                configurationFilePath: path.join(...configurationsDirectoryArr),
                relativeToFrameworkConfigurationFilePath: path.join(constants.SRC_DIR, constants.MAIN_DIR, constants.MANIFEST_FILE_NAME),
                fastLivesyncFileExtensions: [".jpg", ".gif", ".png", ".bmp", ".webp"]
            };
        }
        return this._platformData;
    }
    getCurrentPlatformVersion(platformData, projectData) {
        const currentPlatformData = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
        return currentPlatformData && currentPlatformData[constants.VERSION_STRING];
    }
    validateOptions() {
        return Promise.resolve(true);
    }
    getAppResourcesDestinationDirectoryPath(projectData, frameworkVersion) {
        if (this.canUseGradle(projectData, frameworkVersion)) {
            const resourcePath = [constants.SRC_DIR, constants.MAIN_DIR, constants.RESOURCES_DIR];
            if (this.isAndroidStudioTemplate) {
                resourcePath.unshift(constants.APP_FOLDER_NAME);
            }
            return path.join(this.getPlatformData(projectData).projectRoot, ...resourcePath);
        }
        return path.join(this.getPlatformData(projectData).projectRoot, constants.RESOURCES_DIR);
    }
    validate(projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validatePackageName(projectData.projectId);
            this.validateProjectName(projectData.projectName);
            this.$androidToolsInfo.validateAndroidHomeEnvVariable({ showWarningsAsErrors: true });
            const javaCompilerVersion = yield this.$sysInfo.getJavaCompilerVersion();
            this.$androidToolsInfo.validateJavacVersion(javaCompilerVersion, { showWarningsAsErrors: true });
            yield this.$androidToolsInfo.validateInfo({ showWarningsAsErrors: true, validateTargetSdk: true });
        });
    }
    validatePlugins() {
        return __awaiter(this, void 0, void 0, function* () {
            Promise.resolve();
        });
    }
    createProject(frameworkDir, frameworkVersion, projectData, config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (semver.lt(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE)) {
                this.$errors.failWithoutHelp(`The NativeScript CLI requires Android runtime ${AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE} or later to work properly.`);
            }
            this.$fs.ensureDirectoryExists(this.getPlatformData(projectData).projectRoot);
            const androidToolsInfo = this.$androidToolsInfo.getToolsInfo();
            const targetSdkVersion = androidToolsInfo && androidToolsInfo.targetSdkVersion;
            this.$logger.trace(`Using Android SDK '${targetSdkVersion}'.`);
            this.isAndroidStudioTemplate = this.isAndroidStudioCompatibleTemplate(projectData);
            if (this.isAndroidStudioTemplate) {
                this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "*", "-R");
            }
            else {
                this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "libs", "-R");
                if (config.pathToTemplate) {
                    const mainPath = path.join(this.getPlatformData(projectData).projectRoot, constants.SRC_DIR, constants.MAIN_DIR);
                    this.$fs.createDirectory(mainPath);
                    shell.cp("-R", path.join(path.resolve(config.pathToTemplate), "*"), mainPath);
                }
                else {
                    this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, constants.SRC_DIR, "-R");
                }
                this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "build.gradle settings.gradle build-tools", "-Rf");
                try {
                    this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "gradle.properties", "-Rf");
                }
                catch (e) {
                    this.$logger.warn(`\n${e}\nIt's possible, the final .apk file will contain all architectures instead of the ones described in the abiFilters!\nYou can fix this by using the latest android platform.`);
                }
                this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "gradle", "-R");
                this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "gradlew gradlew.bat", "-f");
            }
            this.cleanResValues(targetSdkVersion, projectData, frameworkVersion);
            const npmConfig = {
                save: true,
                "save-dev": true,
                "save-exact": true,
                silent: true,
                disableNpmInstall: false,
                frameworkPath: config.frameworkPath,
                ignoreScripts: config.ignoreScripts
            };
            const projectPackageJson = this.$fs.readJson(projectData.projectFilePath);
            for (const dependency of AndroidProjectService.REQUIRED_DEV_DEPENDENCIES) {
                let dependencyVersionInProject = (projectPackageJson.dependencies && projectPackageJson.dependencies[dependency.name]) ||
                    (projectPackageJson.devDependencies && projectPackageJson.devDependencies[dependency.name]);
                if (!dependencyVersionInProject) {
                    yield this.$npm.install(`${dependency.name}@${dependency.version}`, projectData.projectDir, npmConfig);
                }
                else {
                    const cleanedVerson = semver.clean(dependencyVersionInProject);
                    if (!cleanedVerson) {
                        const pathToPluginPackageJson = path.join(projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME, dependency.name, constants.PACKAGE_JSON_FILE_NAME);
                        dependencyVersionInProject = this.$fs.exists(pathToPluginPackageJson) && this.$fs.readJson(pathToPluginPackageJson).version;
                    }
                    if (!semver.satisfies(dependencyVersionInProject || cleanedVerson, dependency.version)) {
                        this.$errors.failWithoutHelp(`Your project have installed ${dependency.name} version ${cleanedVerson} but Android platform requires version ${dependency.version}.`);
                    }
                }
            }
        });
    }
    cleanResValues(targetSdkVersion, projectData, frameworkVersion) {
        const resDestinationDir = this.getAppResourcesDestinationDirectoryPath(projectData, frameworkVersion);
        const directoriesInResFolder = this.$fs.readDirectory(resDestinationDir);
        const directoriesToClean = directoriesInResFolder
            .map(dir => {
            return {
                dirName: dir,
                sdkNum: parseInt(dir.substr(AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX.length))
            };
        })
            .filter(dir => dir.dirName.match(AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX)
            && dir.sdkNum
            && (!targetSdkVersion || (targetSdkVersion < dir.sdkNum)))
            .map(dir => path.join(resDestinationDir, dir.dirName));
        this.$logger.trace("Directories to clean:");
        this.$logger.trace(directoriesToClean);
        _.map(directoriesToClean, dir => this.$fs.deleteDirectory(dir));
    }
    interpolateData(projectData, platformSpecificData) {
        return __awaiter(this, void 0, void 0, function* () {
            this.interpolateConfigurationFile(projectData, platformSpecificData);
            const stringsFilePath = path.join(this.getAppResourcesDestinationDirectoryPath(projectData), 'values', 'strings.xml');
            shell.sed('-i', /__NAME__/, projectData.projectName, stringsFilePath);
            shell.sed('-i', /__TITLE_ACTIVITY__/, projectData.projectName, stringsFilePath);
            const gradleSettingsFilePath = path.join(this.getPlatformData(projectData).projectRoot, "settings.gradle");
            shell.sed('-i', /__PROJECT_NAME__/, this.getProjectNameFromId(projectData), gradleSettingsFilePath);
            const userAppGradleFilePath = path.join(projectData.appResourcesDirectoryPath, this.$devicePlatformsConstants.Android, "app.gradle");
            try {
                shell.sed('-i', /__PACKAGE__/, projectData.projectId, userAppGradleFilePath);
            }
            catch (e) {
                this.$logger.warn(`\n${e}.\nCheck if you're using an outdated template and update it.`);
            }
        });
    }
    interpolateConfigurationFile(projectData, platformSpecificData) {
        const manifestPath = this.getPlatformData(projectData).configurationFilePath;
        shell.sed('-i', /__PACKAGE__/, projectData.projectId, manifestPath);
        if (this.$androidToolsInfo.getToolsInfo().androidHomeEnvVar) {
            const sdk = (platformSpecificData && platformSpecificData.sdk) || (this.$androidToolsInfo.getToolsInfo().compileSdkVersion || "").toString();
            shell.sed('-i', /__APILEVEL__/, sdk, manifestPath);
        }
    }
    getProjectNameFromId(projectData) {
        let id;
        if (projectData && projectData.projectId) {
            const idParts = projectData.projectId.split(".");
            id = idParts[idParts.length - 1];
        }
        return id;
    }
    afterCreateProject(projectRoot) {
        return null;
    }
    canUpdatePlatform(newInstalledModuleDir, projectData) {
        return true;
    }
    updatePlatform(currentVersion, newVersion, canUpdate, projectData, addPlatform, removePlatforms) {
        return __awaiter(this, void 0, void 0, function* () {
            if (semver.eq(newVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE)) {
                const platformLowercase = this.getPlatformData(projectData).normalizedPlatformName.toLowerCase();
                yield removePlatforms([platformLowercase.split("@")[0]]);
                yield addPlatform(platformLowercase);
                return false;
            }
            return true;
        });
    }
    buildProject(projectRoot, projectData, buildConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canUseGradle(projectData)) {
                const buildOptions = this.getBuildOptions(buildConfig, projectData);
                if (this.$logger.getLevel() === "TRACE") {
                    buildOptions.unshift("--stacktrace");
                    buildOptions.unshift("--debug");
                }
                if (buildConfig.release) {
                    buildOptions.unshift("assembleRelease");
                }
                else {
                    buildOptions.unshift("assembleDebug");
                }
                const handler = (data) => {
                    this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
                };
                yield helpers_1.attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME, this.$childProcess, handler, this.executeGradleCommand(this.getPlatformData(projectData).projectRoot, buildOptions, { stdio: buildConfig.buildOutputStdio || "inherit" }, { emitOptions: { eventName: constants.BUILD_OUTPUT_EVENT_NAME }, throwError: true }));
            }
            else {
                this.$errors.failWithoutHelp("Cannot complete build because this project is ANT-based." + os_1.EOL +
                    "Run `tns platform remove android && tns platform add android` to switch to Gradle and try again.");
            }
        });
    }
    getBuildOptions(settings, projectData) {
        this.$androidToolsInfo.validateInfo({ showWarningsAsErrors: true, validateTargetSdk: true });
        const androidToolsInfo = this.$androidToolsInfo.getToolsInfo();
        const compileSdk = androidToolsInfo.compileSdkVersion;
        const targetSdk = this.getTargetFromAndroidManifest(projectData) || compileSdk;
        const buildToolsVersion = androidToolsInfo.buildToolsVersion;
        const appCompatVersion = androidToolsInfo.supportRepositoryVersion;
        const generateTypings = androidToolsInfo.generateTypings;
        const buildOptions = [
            `-PcompileSdk=android-${compileSdk}`,
            `-PtargetSdk=${targetSdk}`,
            `-PbuildToolsVersion=${buildToolsVersion}`,
            `-PsupportVersion=${appCompatVersion}`,
            `-PgenerateTypings=${generateTypings}`
        ];
        if (settings.release) {
            buildOptions.push("-Prelease");
            buildOptions.push(`-PksPath=${path.resolve(settings.keyStorePath)}`);
            buildOptions.push(`-Palias=${settings.keyStoreAlias}`);
            buildOptions.push(`-Ppassword=${settings.keyStoreAliasPassword}`);
            buildOptions.push(`-PksPassword=${settings.keyStorePassword}`);
        }
        return buildOptions;
    }
    buildForDeploy(projectRoot, projectData, buildConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.buildProject(projectRoot, projectData, buildConfig);
        });
    }
    isPlatformPrepared(projectRoot, projectData) {
        return this.$fs.exists(path.join(this.getPlatformData(projectData).appDestinationDirectoryPath, constants.APP_FOLDER_NAME));
    }
    getFrameworkFilesExtensions() {
        return [".jar", ".dat"];
    }
    prepareProject() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    ensureConfigurationFileInAppResources(projectData) {
        const originalAndroidManifestFilePath = path.join(projectData.appResourcesDirectoryPath, this.$devicePlatformsConstants.Android, this.getPlatformData(projectData).configurationFileName);
        const manifestExists = this.$fs.exists(originalAndroidManifestFilePath);
        if (!manifestExists) {
            this.$logger.warn('No manifest found in ' + originalAndroidManifestFilePath);
            return;
        }
        this.$fs.copyFile(originalAndroidManifestFilePath, this.getPlatformData(projectData).configurationFilePath);
    }
    prepareAppResources(appResourcesDirectoryPath, projectData) {
        const resourcesDirPath = path.join(appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName);
        const valuesDirRegExp = /^values/;
        const resourcesDirs = this.$fs.readDirectory(resourcesDirPath).filter(resDir => !resDir.match(valuesDirRegExp));
        _.each(resourcesDirs, resourceDir => {
            this.$fs.deleteDirectory(path.join(this.getAppResourcesDestinationDirectoryPath(projectData), resourceDir));
        });
    }
    preparePluginNativeCode(pluginData, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.shouldUseNewRuntimeGradleRoutine(projectData)) {
                const pluginPlatformsFolderPath = this.getPluginPlatformsFolderPath(pluginData, AndroidProjectService.ANDROID_PLATFORM_NAME);
                yield this.processResourcesFromPlugin(pluginData, pluginPlatformsFolderPath, projectData);
            }
        });
    }
    processConfigurationFilesFromAppResources() {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    processResourcesFromPlugin(pluginData, pluginPlatformsFolderPath, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const configurationsDirectoryPath = path.join(this.getPlatformData(projectData).projectRoot, "configurations");
            this.$fs.ensureDirectoryExists(configurationsDirectoryPath);
            const pluginConfigurationDirectoryPath = path.join(configurationsDirectoryPath, pluginData.name);
            if (this.$fs.exists(pluginPlatformsFolderPath)) {
                this.$fs.ensureDirectoryExists(pluginConfigurationDirectoryPath);
                const isScoped = pluginData.name.indexOf("@") === 0;
                const flattenedDependencyName = isScoped ? pluginData.name.replace("/", "_") : pluginData.name;
                const resourcesDestinationDirectoryPath = path.join(this.getPlatformData(projectData).projectRoot, constants.SRC_DIR, flattenedDependencyName);
                this.$fs.ensureDirectoryExists(resourcesDestinationDirectoryPath);
                shell.cp("-Rf", path.join(pluginPlatformsFolderPath, "*"), resourcesDestinationDirectoryPath);
                const filesForInterpolation = this.$fs.enumerateFilesInDirectorySync(resourcesDestinationDirectoryPath, file => this.$fs.getFsStats(file).isDirectory() || path.extname(file) === constants.XML_FILE_EXTENSION) || [];
                for (const file of filesForInterpolation) {
                    this.$logger.trace(`Interpolate data for plugin file: ${file}`);
                    yield this.$pluginVariablesService.interpolate(pluginData, file, projectData);
                }
            }
            const includeGradleFilePath = path.join(pluginPlatformsFolderPath, "include.gradle");
            if (this.$fs.exists(includeGradleFilePath)) {
                shell.cp("-f", includeGradleFilePath, pluginConfigurationDirectoryPath);
            }
        });
    }
    removePluginNativeCode(pluginData, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.shouldUseNewRuntimeGradleRoutine(projectData)) {
                    const pluginConfigDir = path.join(this.getPlatformData(projectData).projectRoot, "configurations", pluginData.name);
                    if (this.$fs.exists(pluginConfigDir)) {
                        yield this.cleanProject(this.getPlatformData(projectData).projectRoot, projectData);
                    }
                }
            }
            catch (e) {
                if (e.code === "ENOENT") {
                    this.$logger.debug("No native code jars found: " + e.message);
                }
                else {
                    throw e;
                }
            }
        });
    }
    afterPrepareAllPlugins(projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    beforePrepareAllPlugins(projectData, dependencies) {
        return __awaiter(this, void 0, void 0, function* () {
            const shouldUseNewRoutine = this.shouldUseNewRuntimeGradleRoutine(projectData);
            if (dependencies) {
                dependencies = this.filterUniqueDependencies(dependencies);
                if (shouldUseNewRoutine) {
                    this.provideDependenciesJson(projectData, dependencies);
                }
                else {
                    const platformDir = path.join(projectData.platformsDir, AndroidProjectService.ANDROID_PLATFORM_NAME);
                    const buildDir = path.join(platformDir, "build-tools");
                    const checkV8dependants = path.join(buildDir, "check-v8-dependants.js");
                    if (this.$fs.exists(checkV8dependants)) {
                        const stringifiedDependencies = JSON.stringify(dependencies);
                        try {
                            yield this.spawn('node', [checkV8dependants, stringifiedDependencies, projectData.platformsDir], { stdio: "inherit" });
                        }
                        catch (e) {
                            this.$logger.info("Checking for dependants on v8 public API failed. This is likely caused because of cyclic production dependencies. Error code: " + e.code + "\nMore information: https://github.com/NativeScript/nativescript-cli/issues/2561");
                        }
                    }
                }
            }
            if (!shouldUseNewRoutine) {
                const projectRoot = this.getPlatformData(projectData).projectRoot;
                yield this.cleanProject(projectRoot, projectData);
            }
        });
    }
    filterUniqueDependencies(dependencies) {
        const depsDictionary = dependencies.reduce((dict, dep) => {
            const collision = dict[dep.name];
            if (!collision || collision.depth > dep.depth) {
                dict[dep.name] = dep;
            }
            return dict;
        }, {});
        return _.values(depsDictionary);
    }
    provideDependenciesJson(projectData, dependencies) {
        const platformDir = path.join(projectData.platformsDir, AndroidProjectService.ANDROID_PLATFORM_NAME);
        const dependenciesJsonPath = path.join(platformDir, "dependencies.json");
        const nativeDependencies = dependencies
            .filter(AndroidProjectService.isNativeAndroidDependency)
            .map(({ name, directory }) => ({ name, directory: path.relative(platformDir, directory) }));
        const jsonContent = JSON.stringify(nativeDependencies, null, 4);
        this.$fs.writeFile(dependenciesJsonPath, jsonContent);
    }
    static isNativeAndroidDependency({ nativescript }) {
        return nativescript && (nativescript.android || (nativescript.platforms && nativescript.platforms.android));
    }
    stopServices(projectRoot) {
        return this.executeGradleCommand(projectRoot, ["--stop", "--quiet"]);
    }
    cleanProject(projectRoot, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.$androidToolsInfo.getToolsInfo().androidHomeEnvVar) {
                const buildOptions = this.getBuildOptions({ release: false }, projectData);
                buildOptions.unshift("clean");
                yield this.executeGradleCommand(projectRoot, buildOptions);
            }
        });
    }
    cleanDeviceTempFolder(deviceIdentifier, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const adb = this.$injector.resolve(device_android_debug_bridge_1.DeviceAndroidDebugBridge, { identifier: deviceIdentifier });
            const deviceRootPath = `/data/local/tmp/${projectData.projectId}`;
            yield adb.executeShellCommand(["rm", "-rf", deviceRootPath]);
        });
    }
    checkForChanges(changesInfo, options, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    canUseGradle(projectData, frameworkVersion) {
        if (!this._canUseGradle) {
            if (!frameworkVersion) {
                const frameworkInfoInProjectFile = this.$projectDataService.getNSValue(projectData.projectDir, this.getPlatformData(projectData).frameworkPackageName);
                frameworkVersion = frameworkInfoInProjectFile && frameworkInfoInProjectFile.version;
            }
            this._canUseGradle = !frameworkVersion || semver.gte(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE);
        }
        return this._canUseGradle;
    }
    copy(projectRoot, frameworkDir, files, cpArg) {
        const paths = files.split(' ').map(p => path.join(frameworkDir, p));
        shell.cp(cpArg, paths, projectRoot);
    }
    spawn(command, args, opts, spawnOpts) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.$childProcess.spawnFromEvent(command, args, "close", opts || { stdio: "inherit" }, spawnOpts);
        });
    }
    validatePackageName(packageName) {
        if (!/^[a-zA-Z]+(\.[a-zA-Z0-9][a-zA-Z0-9_]*)+$/.test(packageName)) {
            this.$errors.fail("Package name must look like: com.company.Name");
        }
        if (/\b[Cc]lass\b/.test(packageName)) {
            this.$errors.fail("class is a reserved word");
        }
    }
    validateProjectName(projectName) {
        if (projectName === '') {
            this.$errors.fail("Project name cannot be empty");
        }
        if (/^[0-9]/.test(projectName)) {
            this.$errors.fail("Project name must not begin with a number");
        }
    }
    getTargetFromAndroidManifest(projectData) {
        let versionInManifest;
        if (this.$fs.exists(this.getPlatformData(projectData).configurationFilePath)) {
            const targetFromAndroidManifest = this.$fs.readText(this.getPlatformData(projectData).configurationFilePath);
            if (targetFromAndroidManifest) {
                const match = targetFromAndroidManifest.match(/.*?android:targetSdkVersion=\"(.*?)\"/);
                if (match && match[1]) {
                    versionInManifest = match[1];
                }
            }
        }
        return versionInManifest;
    }
    executeGradleCommand(projectRoot, gradleArgs, childProcessOpts, spawnFromEventOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.$androidToolsInfo.getToolsInfo().androidHomeEnvVar) {
                const gradlew = this.$hostInfo.isWindows ? "gradlew.bat" : "./gradlew";
                const localArgs = [...gradleArgs];
                if (this.$logger.getLevel() === "INFO") {
                    localArgs.push("--quiet");
                    this.$logger.info("Gradle build...");
                }
                childProcessOpts = childProcessOpts || {};
                childProcessOpts.cwd = childProcessOpts.cwd || projectRoot;
                childProcessOpts.stdio = childProcessOpts.stdio || "inherit";
                return yield this.spawn(gradlew, localArgs, childProcessOpts, spawnFromEventOptions);
            }
        });
    }
    shouldUseNewRuntimeGradleRoutine(projectData) {
        const platformVersion = this.getCurrentPlatformVersion(this.getPlatformData(projectData), projectData);
        const newRuntimeGradleRoutineVersion = "3.3.0";
        const normalizedPlatformVersion = `${semver.major(platformVersion)}.${semver.minor(platformVersion)}.0`;
        return semver.gte(normalizedPlatformVersion, newRuntimeGradleRoutineVersion);
    }
    isAndroidStudioCompatibleTemplate(projectData) {
        const currentPlatformData = this.$projectDataService.getNSValue(projectData.projectDir, constants.TNS_ANDROID_RUNTIME_NAME);
        let platformVersion = currentPlatformData && currentPlatformData[constants.VERSION_STRING];
        if (!platformVersion) {
            const tnsAndroidPackageJsonPath = path.join(projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME, constants.TNS_ANDROID_RUNTIME_NAME, constants.PACKAGE_JSON_FILE_NAME);
            if (this.$fs.exists(tnsAndroidPackageJsonPath)) {
                const projectPackageJson = this.$fs.readJson(tnsAndroidPackageJsonPath);
                if (projectPackageJson && projectPackageJson.version) {
                    platformVersion = projectPackageJson.version;
                }
            }
            else {
                return false;
            }
        }
        if (platformVersion === constants.PackageVersion.NEXT || platformVersion === constants.PackageVersion.LATEST) {
            return true;
        }
        const androidStudioCompatibleTemplate = "3.4.0";
        const normalizedPlatformVersion = `${semver.major(platformVersion)}.${semver.minor(platformVersion)}.0`;
        return semver.gte(normalizedPlatformVersion, androidStudioCompatibleTemplate);
    }
}
AndroidProjectService.VALUES_DIRNAME = "values";
AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX = AndroidProjectService.VALUES_DIRNAME + "-v";
AndroidProjectService.ANDROID_PLATFORM_NAME = "android";
AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE = "1.5.0";
AndroidProjectService.REQUIRED_DEV_DEPENDENCIES = [
    { name: "babel-traverse", version: "^6.4.5" },
    { name: "babel-types", version: "^6.4.5" },
    { name: "babylon", version: "^6.4.5" },
    { name: "lazy", version: "^1.0.11" }
];
exports.AndroidProjectService = AndroidProjectService;
$injector.register("androidProjectService", AndroidProjectService);
