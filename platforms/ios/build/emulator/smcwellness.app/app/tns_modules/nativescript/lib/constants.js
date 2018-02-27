"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_FOLDER_NAME = "app";
exports.APP_RESOURCES_FOLDER_NAME = "App_Resources";
exports.PROJECT_FRAMEWORK_FOLDER_NAME = "framework";
exports.NATIVESCRIPT_KEY_NAME = "nativescript";
exports.NODE_MODULES_FOLDER_NAME = "node_modules";
exports.TNS_MODULES_FOLDER_NAME = "tns_modules";
exports.TNS_CORE_MODULES_NAME = "tns-core-modules";
exports.TNS_ANDROID_RUNTIME_NAME = "tns-android";
exports.TNS_IOS_RUNTIME_NAME = "tns-ios";
exports.PACKAGE_JSON_FILE_NAME = "package.json";
exports.NODE_MODULE_CACHE_PATH_KEY_NAME = "node-modules-cache-path";
exports.DEFAULT_APP_IDENTIFIER_PREFIX = "org.nativescript";
exports.LIVESYNC_EXCLUDED_DIRECTORIES = ["app_resources"];
exports.TESTING_FRAMEWORKS = ['jasmine', 'mocha', 'qunit'];
exports.TEST_RUNNER_NAME = "nativescript-unit-test-runner";
exports.LIVESYNC_EXCLUDED_FILE_PATTERNS = ["**/*.js.map", "**/*.ts"];
exports.XML_FILE_EXTENSION = ".xml";
exports.PLATFORMS_DIR_NAME = "platforms";
exports.HOOKS_DIR_NAME = "hooks";
exports.LIB_DIR_NAME = "lib";
exports.CODE_SIGN_ENTITLEMENTS = "CODE_SIGN_ENTITLEMENTS";
exports.AWAIT_NOTIFICATION_TIMEOUT_SECONDS = 9;
exports.SRC_DIR = "src";
exports.MAIN_DIR = "main";
exports.ASSETS_DIR = "assets";
exports.MANIFEST_FILE_NAME = "AndroidManifest.xml";
exports.BUILD_DIR = "build";
exports.OUTPUTS_DIR = "outputs";
exports.APK_DIR = "apk";
exports.RESOURCES_DIR = "res";
class PackageVersion {
}
PackageVersion.NEXT = "next";
PackageVersion.LATEST = "latest";
exports.PackageVersion = PackageVersion;
const liveSyncOperation = "LiveSync Operation";
class LiveSyncTrackActionNames {
}
LiveSyncTrackActionNames.LIVESYNC_OPERATION = liveSyncOperation;
LiveSyncTrackActionNames.LIVESYNC_OPERATION_BUILD = `${liveSyncOperation} - Build`;
LiveSyncTrackActionNames.DEVICE_INFO = `Device Info for ${liveSyncOperation}`;
exports.LiveSyncTrackActionNames = LiveSyncTrackActionNames;
exports.PackageJsonKeysToKeep = ["name", "main", "android", "version"];
class SaveOptions {
}
SaveOptions.PRODUCTION = "save";
SaveOptions.DEV = "save-dev";
SaveOptions.OPTIONAL = "save-optional";
SaveOptions.EXACT = "save-exact";
exports.SaveOptions = SaveOptions;
class ReleaseType {
}
ReleaseType.MAJOR = "major";
ReleaseType.PREMAJOR = "premajor";
ReleaseType.MINOR = "minor";
ReleaseType.PREMINOR = "preminor";
ReleaseType.PATCH = "patch";
ReleaseType.PREPATCH = "prepatch";
ReleaseType.PRERELEASE = "prerelease";
exports.ReleaseType = ReleaseType;
exports.RESERVED_TEMPLATE_NAMES = {
    "default": "tns-template-hello-world",
    "tsc": "tns-template-hello-world-ts",
    "typescript": "tns-template-hello-world-ts",
    "ng": "tns-template-hello-world-ng",
    "angular": "tns-template-hello-world-ng"
};
class ITMSConstants {
}
ITMSConstants.ApplicationMetadataFile = "metadata.xml";
ITMSConstants.VerboseLoggingLevels = {
    Informational: "informational",
    Verbose: "detailed"
};
ITMSConstants.iTMSExecutableName = "iTMSTransporter";
ITMSConstants.iTMSDirectoryName = "itms";
exports.ITMSConstants = ITMSConstants;
class ItunesConnectApplicationTypesClass {
    constructor() {
        this.iOS = "iOS App";
        this.Mac = "Mac OS X App";
    }
}
exports.ItunesConnectApplicationTypes = new ItunesConnectApplicationTypesClass();
class LiveSyncPaths {
}
LiveSyncPaths.SYNC_DIR_NAME = "sync";
LiveSyncPaths.REMOVEDSYNC_DIR_NAME = "removedsync";
LiveSyncPaths.FULLSYNC_DIR_NAME = "fullsync";
LiveSyncPaths.IOS_DEVICE_PROJECT_ROOT_PATH = "Library/Application Support/LiveSync";
LiveSyncPaths.IOS_DEVICE_SYNC_ZIP_PATH = "Library/Application Support/LiveSync/sync.zip";
exports.LiveSyncPaths = LiveSyncPaths;
exports.ANGULAR_NAME = "angular";
exports.TYPESCRIPT_NAME = "typescript";
exports.BUILD_OUTPUT_EVENT_NAME = "buildOutput";
exports.CONNECTION_ERROR_EVENT_NAME = "connectionError";
exports.USER_INTERACTION_NEEDED_EVENT_NAME = "userInteractionNeeded";
exports.DEBUGGER_ATTACHED_EVENT_NAME = "debuggerAttached";
exports.DEBUGGER_DETACHED_EVENT_NAME = "debuggerDetached";
exports.VERSION_STRING = "version";
exports.INSPECTOR_CACHE_DIRNAME = "ios-inspector";
exports.POST_INSTALL_COMMAND_NAME = "post-install-cli";
exports.ANDROID_RELEASE_BUILD_ERROR_MESSAGE = "When producing a release build, you need to specify all --key-store-* options.";
class DebugCommandErrors {
}
DebugCommandErrors.UNABLE_TO_USE_FOR_DEVICE_AND_EMULATOR = "The options --for-device and --emulator cannot be used simultaneously. Please use only one of them.";
DebugCommandErrors.NO_DEVICES_EMULATORS_FOUND_FOR_OPTIONS = "Unable to find device or emulator for specified options.";
DebugCommandErrors.UNSUPPORTED_DEVICE_OS_FOR_DEBUGGING = "Unsupported device OS for debugging";
exports.DebugCommandErrors = DebugCommandErrors;
