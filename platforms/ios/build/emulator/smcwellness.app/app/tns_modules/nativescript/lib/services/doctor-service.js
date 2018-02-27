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
const os_1 = require("os");
const semver = require("semver");
const path = require("path");
const helpers = require("../common/helpers");
class DoctorService {
    constructor($analyticsService, $androidToolsInfo, $cocoapodsService, $hostInfo, $logger, $progressIndicator, $staticConfig, $sysInfo, $childProcess, $config, $npm, $opener, $prompter, $fs, $versionsService, $xcprojService) {
        this.$analyticsService = $analyticsService;
        this.$androidToolsInfo = $androidToolsInfo;
        this.$cocoapodsService = $cocoapodsService;
        this.$hostInfo = $hostInfo;
        this.$logger = $logger;
        this.$progressIndicator = $progressIndicator;
        this.$staticConfig = $staticConfig;
        this.$sysInfo = $sysInfo;
        this.$childProcess = $childProcess;
        this.$config = $config;
        this.$npm = $npm;
        this.$opener = $opener;
        this.$prompter = $prompter;
        this.$fs = $fs;
        this.$versionsService = $versionsService;
        this.$xcprojService = $xcprojService;
    }
    printWarnings(configOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = false;
            const sysInfo = yield this.$sysInfo.getSysInfo(this.$staticConfig.pathToPackageJson);
            if (!sysInfo.adbVer) {
                this.$logger.warn("WARNING: adb from the Android SDK is not installed or is not configured properly.");
                this.$logger.out("For Android-related operations, the NativeScript CLI will use a built-in version of adb." + os_1.EOL
                    + "To avoid possible issues with the native Android emulator, Genymotion or connected" + os_1.EOL
                    + "Android devices, verify that you have installed the latest Android SDK and" + os_1.EOL
                    + "its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + os_1.EOL);
                this.printPackageManagerTip();
                result = true;
            }
            if (!sysInfo.emulatorInstalled) {
                this.$logger.warn("WARNING: The Android SDK is not installed or is not configured properly.");
                this.$logger.out("You will not be able to build your projects for Android and run them in the native emulator." + os_1.EOL
                    + "To be able to build for Android and run apps in the native emulator, verify that you have" + os_1.EOL
                    + "installed the latest Android SDK and its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + os_1.EOL);
                this.printPackageManagerTip();
                result = true;
            }
            if (this.$hostInfo.isDarwin) {
                if (!sysInfo.xcodeVer) {
                    this.$logger.warn("WARNING: Xcode is not installed or is not configured properly.");
                    this.$logger.out("You will not be able to build your projects for iOS or run them in the iOS Simulator." + os_1.EOL
                        + "To be able to build for iOS and run apps in the native emulator, verify that you have installed Xcode." + os_1.EOL);
                    result = true;
                }
                if (!sysInfo.xcodeprojGemLocation) {
                    this.$logger.warn("WARNING: xcodeproj gem is not installed or is not configured properly.");
                    this.$logger.out("You will not be able to build your projects for iOS." + os_1.EOL
                        + "To be able to build for iOS and run apps in the native emulator, verify that you have installed xcodeproj." + os_1.EOL);
                    result = true;
                }
                if (!sysInfo.cocoapodVer) {
                    this.$logger.warn("WARNING: CocoaPods is not installed or is not configured properly.");
                    this.$logger.out("You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + os_1.EOL
                        + "To be able to build such projects, verify that you have installed CocoaPods.");
                    result = true;
                }
                if (sysInfo.xcodeVer && sysInfo.cocoapodVer) {
                    const problemWithCocoaPods = yield this.verifyCocoaPods();
                    if (problemWithCocoaPods) {
                        this.$logger.warn("WARNING: There was a problem with CocoaPods");
                        this.$logger.out("Verify that CocoaPods are configured properly.");
                        result = true;
                    }
                }
                if (sysInfo.cocoapodVer && semver.valid(sysInfo.cocoapodVer) && semver.lt(sysInfo.cocoapodVer, DoctorService.MIN_SUPPORTED_POD_VERSION)) {
                    this.$logger.warn(`WARNING: Your current CocoaPods version is earlier than ${DoctorService.MIN_SUPPORTED_POD_VERSION}.`);
                    this.$logger.out("You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + os_1.EOL
                        + `To be able to build such projects, verify that you have at least ${DoctorService.MIN_SUPPORTED_POD_VERSION} version installed.`);
                    result = true;
                }
                if (sysInfo.xcodeVer && sysInfo.cocoapodVer && (yield this.$xcprojService.verifyXcproj(false))) {
                    result = true;
                }
            }
            else {
                this.$logger.out("NOTE: You can develop for iOS only on Mac OS X systems.");
                this.$logger.out("To be able to work with iOS devices and projects, you need Mac OS X Mavericks or later." + os_1.EOL);
            }
            const androidToolsIssues = this.$androidToolsInfo.validateInfo();
            const javaCompilerVersionIssue = this.$androidToolsInfo.validateJavacVersion(sysInfo.javacVersion);
            const pythonIssues = yield this.validatePythonPackages();
            const doctorResult = result || androidToolsIssues || javaCompilerVersionIssue || pythonIssues;
            if (!configOptions || configOptions.trackResult) {
                yield this.$analyticsService.track("DoctorEnvironmentSetup", doctorResult ? "incorrect" : "correct");
            }
            if (doctorResult) {
                this.$logger.info("There seem to be issues with your configuration.");
                if (this.$hostInfo.isDarwin) {
                    yield this.promptForHelp(DoctorService.DarwinSetupDocsLink, DoctorService.DarwinSetupScriptLocation, []);
                }
                else if (this.$hostInfo.isWindows) {
                    yield this.promptForHelp(DoctorService.WindowsSetupDocsLink, DoctorService.WindowsSetupScriptExecutable, DoctorService.WindowsSetupScriptArguments);
                }
                else {
                    yield this.promptForDocs(DoctorService.LinuxSetupDocsLink);
                }
            }
            try {
                yield this.$versionsService.checkComponentsForUpdate();
            }
            catch (err) {
                this.$logger.error("Cannot get the latest versions information from npm. Please try again later.");
            }
            return doctorResult;
        });
    }
    promptForDocs(link) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.$prompter.confirm("Do you want to visit the official documentation?", () => helpers.isInteractive())) {
                this.$opener.open(link);
            }
        });
    }
    promptForHelp(link, commandName, commandArguments) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.promptForDocs(link);
            if (yield this.$prompter.confirm("Do you want to run the setup script?", () => helpers.isInteractive())) {
                yield this.$childProcess.spawnFromEvent(commandName, commandArguments, "close", { stdio: "inherit" });
            }
        });
    }
    printPackageManagerTip() {
        if (this.$hostInfo.isWindows) {
            this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the chocolatey package manager to install the Android SDK and its dependencies." + os_1.EOL);
        }
        else if (this.$hostInfo.isDarwin) {
            this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the Homebrew package manager to install the Android SDK and its dependencies." + os_1.EOL);
        }
    }
    verifyCocoaPods() {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.out("Verifying CocoaPods. This may take more than a minute, please be patient.");
            const temp = require("temp");
            temp.track();
            const projDir = temp.mkdirSync("nativescript-check-cocoapods");
            const packageJsonData = {
                "name": "nativescript-check-cocoapods",
                "version": "0.0.1"
            };
            this.$fs.writeJson(path.join(projDir, "package.json"), packageJsonData);
            const spinner = this.$progressIndicator.getSpinner("Installing iOS runtime.");
            try {
                spinner.start();
                yield this.$npm.install("tns-ios", projDir, {
                    global: false,
                    production: true,
                    save: true,
                    disableNpmInstall: false,
                    frameworkPath: null,
                    ignoreScripts: true
                });
                spinner.stop();
                const iosDir = path.join(projDir, "node_modules", "tns-ios", "framework");
                this.$fs.writeFile(path.join(iosDir, "Podfile"), `${this.$cocoapodsService.getPodfileHeader(DoctorService.PROJECT_NAME_PLACEHOLDER)}pod 'AFNetworking', '~> 1.0'${this.$cocoapodsService.getPodfileFooter()}`);
                spinner.message("Verifying CocoaPods. This may take some time, please be patient.");
                spinner.start();
                const future = this.$childProcess.spawnFromEvent(this.$config.USE_POD_SANDBOX ? "sandbox-pod" : "pod", ["install"], "exit", { cwd: iosDir }, { throwError: false });
                const result = yield this.$progressIndicator.showProgressIndicator(future, 5000);
                if (result.exitCode) {
                    this.$logger.out(result.stdout, result.stderr);
                    return true;
                }
                return !(this.$fs.exists(path.join(iosDir, `${DoctorService.PROJECT_NAME_PLACEHOLDER}.xcworkspace`)));
            }
            catch (err) {
                this.$logger.trace(`verifyCocoaPods error: ${err}`);
                return true;
            }
            finally {
                spinner.stop();
            }
        });
    }
    validatePythonPackages() {
        return __awaiter(this, void 0, void 0, function* () {
            let hasInvalidPackages = false;
            if (this.$hostInfo.isDarwin) {
                try {
                    yield this.$childProcess.exec(`python -c "import six"`);
                }
                catch (error) {
                    if (error.code === 1) {
                        hasInvalidPackages = true;
                        this.$logger.warn("The Python 'six' package not found.");
                        this.$logger.out("This package is required by the Debugger library (LLDB) for iOS. You can install it by running 'pip install six' from the terminal.");
                    }
                    else {
                        this.$logger.warn("Couldn't retrieve installed python packages.");
                        this.$logger.out("We cannot verify your python installation is setup correctly. Please, make sure you have both 'python' and 'pip' installed.");
                        this.$logger.trace(`Error while validating Python packages. Error is: ${error.message}`);
                    }
                }
            }
            return hasInvalidPackages;
        });
    }
}
DoctorService.PROJECT_NAME_PLACEHOLDER = "__PROJECT_NAME__";
DoctorService.MIN_SUPPORTED_POD_VERSION = "1.0.0";
DoctorService.DarwinSetupScriptLocation = path.join(__dirname, "..", "..", "setup", "mac-startup-shell-script.sh");
DoctorService.DarwinSetupDocsLink = "https://docs.nativescript.org/start/ns-setup-os-x";
DoctorService.WindowsSetupScriptExecutable = "powershell.exe";
DoctorService.WindowsSetupScriptArguments = ["start-process", "-FilePath", "PowerShell.exe", "-NoNewWindow", "-Wait", "-ArgumentList", '"-NoProfile -ExecutionPolicy Bypass -Command iex ((new-object net.webclient).DownloadString(\'https://www.nativescript.org/setup/win\'))"'];
DoctorService.WindowsSetupDocsLink = "https://docs.nativescript.org/start/ns-setup-win";
DoctorService.LinuxSetupDocsLink = "https://docs.nativescript.org/start/ns-setup-linux";
$injector.register("doctorService", DoctorService);
