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
const constants = require("../constants");
const path = require("path");
const os = require("os");
class TestExecutionService {
    constructor($injector, $platformService, $platformsData, $liveSyncService, $debugDataService, $httpClient, $config, $logger, $fs, $options, $pluginsService, $errors, $debugService, $devicesService, $childProcess) {
        this.$injector = $injector;
        this.$platformService = $platformService;
        this.$platformsData = $platformsData;
        this.$liveSyncService = $liveSyncService;
        this.$debugDataService = $debugDataService;
        this.$httpClient = $httpClient;
        this.$config = $config;
        this.$logger = $logger;
        this.$fs = $fs;
        this.$options = $options;
        this.$pluginsService = $pluginsService;
        this.$errors = $errors;
        this.$debugService = $debugService;
        this.$devicesService = $devicesService;
        this.$childProcess = $childProcess;
        this.allowedParameters = [];
    }
    startTestRunner(platform, projectData, projectFilesConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            this.platform = platform;
            this.$options.justlaunch = true;
            yield new Promise((resolve, reject) => {
                process.on('message', (launcherConfig) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const platformData = this.$platformsData.getPlatformData(platform.toLowerCase(), projectData);
                        const projectDir = projectData.projectDir;
                        yield this.$devicesService.initialize({
                            platform: platform,
                            deviceId: this.$options.device,
                            emulator: this.$options.emulator
                        });
                        yield this.$devicesService.detectCurrentlyAttachedDevices();
                        const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
                        const configOptions = JSON.parse(launcherConfig);
                        this.$options.debugBrk = configOptions.debugBrk;
                        this.$options.debugTransport = configOptions.debugTransport;
                        const configJs = this.generateConfig(this.$options.port.toString(), configOptions);
                        this.$fs.writeFile(path.join(projectDir, TestExecutionService.CONFIG_FILE_NAME), configJs);
                        const socketIoJsUrl = `http://localhost:${this.$options.port}/socket.io/socket.io.js`;
                        const socketIoJs = (yield this.$httpClient.httpRequest(socketIoJsUrl)).body;
                        this.$fs.writeFile(path.join(projectDir, TestExecutionService.SOCKETIO_JS_FILE_NAME), socketIoJs);
                        const appFilesUpdaterOptions = { bundle: !!this.$options.bundle, release: this.$options.release };
                        const preparePlatformInfo = {
                            platform,
                            appFilesUpdaterOptions,
                            platformTemplate: this.$options.platformTemplate,
                            projectData,
                            config: this.$options,
                            env: this.$options.env
                        };
                        if (!(yield this.$platformService.preparePlatform(preparePlatformInfo))) {
                            this.$errors.failWithoutHelp("Verify that listed files are well-formed and try again the operation.");
                        }
                        this.detourEntryPoint(projectFilesPath);
                        const deployOptions = {
                            clean: this.$options.clean,
                            device: this.$options.device,
                            emulator: this.$options.emulator,
                            projectDir: this.$options.path,
                            platformTemplate: this.$options.platformTemplate,
                            release: this.$options.release,
                            provision: this.$options.provision,
                            teamId: this.$options.teamId
                        };
                        if (this.$options.bundle) {
                            this.$options.watch = false;
                        }
                        const devices = this.$devicesService.getDeviceInstances();
                        const platformLowerCase = this.platform && this.platform.toLowerCase();
                        const deviceDescriptors = devices.filter(d => !platformLowerCase || d.deviceInfo.platform.toLowerCase() === platformLowerCase)
                            .map(d => {
                            const info = {
                                identifier: d.deviceInfo.identifier,
                                buildAction: () => __awaiter(this, void 0, void 0, function* () {
                                    const buildConfig = {
                                        buildForDevice: !d.isEmulator,
                                        projectDir: this.$options.path,
                                        clean: this.$options.clean,
                                        teamId: this.$options.teamId,
                                        device: this.$options.device,
                                        provision: this.$options.provision,
                                        release: this.$options.release,
                                        keyStoreAlias: this.$options.keyStoreAlias,
                                        keyStorePath: this.$options.keyStorePath,
                                        keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
                                        keyStorePassword: this.$options.keyStorePassword
                                    };
                                    yield this.$platformService.buildPlatform(d.deviceInfo.platform, buildConfig, projectData);
                                    const pathToBuildResult = yield this.$platformService.lastOutputPath(d.deviceInfo.platform, buildConfig, projectData);
                                    return pathToBuildResult;
                                }),
                                debugOptions: this.$options
                            };
                            return info;
                        });
                        const liveSyncInfo = {
                            projectDir: projectData.projectDir,
                            skipWatcher: !this.$options.watch || this.$options.justlaunch,
                            watchAllFiles: this.$options.syncAllFiles,
                            bundle: !!this.$options.bundle,
                            release: this.$options.release,
                            env: this.$options.env
                        };
                        yield this.$liveSyncService.liveSync(deviceDescriptors, liveSyncInfo);
                        if (this.$options.debugBrk) {
                            this.$logger.info('Starting debugger...');
                            const debugService = this.$injector.resolve(`${platform}DebugService`);
                            const debugData = this.getDebugData(platform, projectData, deployOptions);
                            yield debugService.debugStart(debugData, this.$options);
                        }
                        resolve();
                    }
                    catch (err) {
                        reject(err);
                    }
                }));
                process.send("ready");
            });
        });
    }
    startKarmaServer(platform, projectData, projectFilesConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            platform = platform.toLowerCase();
            this.platform = platform;
            if (this.$options.debugBrk && this.$options.watch) {
                this.$errors.failWithoutHelp("You cannot use --watch and --debug-brk simultaneously. Remove one of the flags and try again.");
            }
            yield this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
            const projectDir = projectData.projectDir;
            yield this.$devicesService.initialize({
                platform: platform,
                deviceId: this.$options.device,
                emulator: this.$options.emulator
            });
            const karmaConfig = this.getKarmaConfiguration(platform, projectData), karmaRunner = this.$childProcess.fork(path.join(__dirname, "karma-execution.js")), launchKarmaTests = (karmaData) => __awaiter(this, void 0, void 0, function* () {
                this.$logger.trace("## Unit-testing: Parent process received message", karmaData);
                let port;
                if (karmaData.url) {
                    port = karmaData.url.port;
                    const socketIoJsUrl = `http://${karmaData.url.host}/socket.io/socket.io.js`;
                    const socketIoJs = (yield this.$httpClient.httpRequest(socketIoJsUrl)).body;
                    this.$fs.writeFile(path.join(projectDir, TestExecutionService.SOCKETIO_JS_FILE_NAME), socketIoJs);
                }
                if (karmaData.launcherConfig) {
                    const configOptions = JSON.parse(karmaData.launcherConfig);
                    const configJs = this.generateConfig(port, configOptions);
                    this.$fs.writeFile(path.join(projectDir, TestExecutionService.CONFIG_FILE_NAME), configJs);
                }
                const appFilesUpdaterOptions = { bundle: !!this.$options.bundle, release: this.$options.release };
                const preparePlatformInfo = {
                    platform,
                    appFilesUpdaterOptions,
                    platformTemplate: this.$options.platformTemplate,
                    projectData,
                    config: this.$options,
                    env: this.$options.env
                };
                if (!(yield this.$platformService.preparePlatform(preparePlatformInfo))) {
                    this.$errors.failWithoutHelp("Verify that listed files are well-formed and try again the operation.");
                }
                const deployOptions = {
                    clean: this.$options.clean,
                    device: this.$options.device,
                    emulator: this.$options.emulator,
                    projectDir: this.$options.path,
                    platformTemplate: this.$options.platformTemplate,
                    release: this.$options.release,
                    provision: this.$options.provision,
                    teamId: this.$options.teamId
                };
                if (this.$options.debugBrk) {
                    const debugData = this.getDebugData(platform, projectData, deployOptions);
                    yield this.$debugService.debug(debugData, this.$options);
                }
                else {
                    const devices = this.$devicesService.getDeviceInstances();
                    const platformLowerCase = this.platform && this.platform.toLowerCase();
                    const deviceDescriptors = devices.filter(d => !platformLowerCase || d.deviceInfo.platform.toLowerCase() === platformLowerCase)
                        .map(d => {
                        const info = {
                            identifier: d.deviceInfo.identifier,
                            buildAction: () => __awaiter(this, void 0, void 0, function* () {
                                const buildConfig = {
                                    buildForDevice: !d.isEmulator,
                                    projectDir: this.$options.path,
                                    clean: this.$options.clean,
                                    teamId: this.$options.teamId,
                                    device: this.$options.device,
                                    provision: this.$options.provision,
                                    release: this.$options.release,
                                    keyStoreAlias: this.$options.keyStoreAlias,
                                    keyStorePath: this.$options.keyStorePath,
                                    keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
                                    keyStorePassword: this.$options.keyStorePassword
                                };
                                yield this.$platformService.buildPlatform(d.deviceInfo.platform, buildConfig, projectData);
                                const pathToBuildResult = yield this.$platformService.lastOutputPath(d.deviceInfo.platform, buildConfig, projectData);
                                return pathToBuildResult;
                            }),
                            debugOptions: this.$options
                        };
                        return info;
                    });
                    const liveSyncInfo = {
                        projectDir: projectData.projectDir,
                        skipWatcher: !this.$options.watch || this.$options.justlaunch,
                        watchAllFiles: this.$options.syncAllFiles,
                        bundle: !!this.$options.bundle,
                        release: this.$options.release,
                        env: this.$options.env
                    };
                    yield this.$liveSyncService.liveSync(deviceDescriptors, liveSyncInfo);
                }
            });
            karmaRunner.on("message", (karmaData) => {
                launchKarmaTests(karmaData)
                    .catch((result) => {
                    this.$logger.error(result);
                    process.exit(130);
                });
            });
            return new Promise((resolve, reject) => {
                karmaRunner.on("exit", (exitCode) => {
                    if (exitCode !== 0) {
                        const testError = new Error("Test run failed.");
                        testError.suppressCommandHelp = true;
                        reject(testError);
                    }
                    else {
                        resolve();
                    }
                });
                karmaRunner.send({ karmaConfig: karmaConfig });
            });
        });
    }
    detourEntryPoint(projectFilesPath) {
        const packageJsonPath = path.join(projectFilesPath, 'package.json');
        const packageJson = this.$fs.readJson(packageJsonPath);
        packageJson.main = TestExecutionService.MAIN_APP_NAME;
        this.$fs.writeJson(packageJsonPath, packageJson);
    }
    generateConfig(port, options) {
        const nics = os.networkInterfaces();
        const ips = Object.keys(nics)
            .map(nicName => nics[nicName].filter((binding) => binding.family === 'IPv4')[0])
            .filter(binding => binding)
            .map(binding => binding.address);
        const config = {
            port,
            ips,
            options,
        };
        return 'module.exports = ' + JSON.stringify(config);
    }
    getKarmaConfiguration(platform, projectData) {
        const karmaConfig = {
            browsers: [platform],
            configFile: path.join(projectData.projectDir, 'karma.conf.js'),
            _NS: {
                log: this.$logger.getLevel(),
                path: this.$options.path,
                tns: process.argv[1],
                node: process.execPath,
                options: {
                    debugTransport: this.$options.debugTransport,
                    debugBrk: this.$options.debugBrk,
                    watch: !!this.$options.watch
                }
            },
        };
        if (this.$config.DEBUG || this.$logger.getLevel() === 'TRACE') {
            karmaConfig.logLevel = 'DEBUG';
        }
        if (!this.$options.watch) {
            karmaConfig.singleRun = true;
        }
        if (this.$options.debugBrk) {
            karmaConfig.browserNoActivityTimeout = 1000000000;
        }
        karmaConfig.projectDir = projectData.projectDir;
        this.$logger.debug(JSON.stringify(karmaConfig, null, 4));
        return karmaConfig;
    }
    getDebugData(platform, projectData, deployOptions) {
        const buildConfig = _.merge({ buildForDevice: this.$options.forDevice }, deployOptions);
        const debugData = this.$debugDataService.createDebugData(projectData, this.$options);
        debugData.pathToAppPackage = this.$platformService.lastOutputPath(platform, buildConfig, projectData);
        return debugData;
    }
}
TestExecutionService.MAIN_APP_NAME = `./tns_modules/${constants.TEST_RUNNER_NAME}/app.js`;
TestExecutionService.CONFIG_FILE_NAME = `node_modules/${constants.TEST_RUNNER_NAME}/config.js`;
TestExecutionService.SOCKETIO_JS_FILE_NAME = `node_modules/${constants.TEST_RUNNER_NAME}/socket.io.js`;
$injector.register('testExecutionService', TestExecutionService);
