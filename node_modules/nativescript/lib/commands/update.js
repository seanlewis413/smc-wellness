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
const constants = require("../constants");
class UpdateCommand {
    constructor($options, $projectData, $platformService, $platformsData, $pluginsService, $projectDataService, $fs, $logger) {
        this.$options = $options;
        this.$projectData = $projectData;
        this.$platformService = $platformService;
        this.$platformsData = $platformsData;
        this.$pluginsService = $pluginsService;
        this.$projectDataService = $projectDataService;
        this.$fs = $fs;
        this.$logger = $logger;
        this.allowedParameters = [];
        this.$projectData.initializeProjectData();
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const tmpDir = path.join(this.$projectData.projectDir, UpdateCommand.tempFolder);
            try {
                this.backup(tmpDir);
            }
            catch (error) {
                this.$logger.error(UpdateCommand.backupFailMessage);
                this.$fs.deleteDirectory(tmpDir);
                return;
            }
            try {
                yield this.executeCore(args);
            }
            catch (error) {
                this.restoreBackup(tmpDir);
                this.$logger.error(UpdateCommand.updateFailMessage);
            }
            finally {
                this.$fs.deleteDirectory(tmpDir);
            }
        });
    }
    canExecute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const platforms = this.getPlatforms();
            for (const platform of platforms.packagePlatforms) {
                const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
                const platformProjectService = platformData.platformProjectService;
                yield platformProjectService.validate(this.$projectData);
            }
            return args.length < 2 && this.$projectData.projectDir !== "";
        });
    }
    executeCore(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const platforms = this.getPlatforms();
            for (const platform of _.xor(platforms.installed, platforms.packagePlatforms)) {
                const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
                this.$projectDataService.removeNSProperty(this.$projectData.projectDir, platformData.frameworkPackageName);
            }
            yield this.$platformService.removePlatforms(platforms.installed, this.$projectData);
            yield this.$pluginsService.remove("tns-core-modules", this.$projectData);
            yield this.$pluginsService.remove("tns-core-modules-widgets", this.$projectData);
            for (const folder of UpdateCommand.folders) {
                this.$fs.deleteDirectory(path.join(this.$projectData.projectDir, folder));
            }
            if (args.length === 1) {
                for (const platform of platforms.packagePlatforms) {
                    yield this.$platformService.addPlatforms([platform + "@" + args[0]], this.$options.platformTemplate, this.$projectData, this.$options, this.$options.frameworkPath);
                }
                yield this.$pluginsService.add("tns-core-modules@" + args[0], this.$projectData);
            }
            else {
                yield this.$platformService.addPlatforms(platforms.packagePlatforms, this.$options.platformTemplate, this.$projectData, this.$options, this.$options.frameworkPath);
                yield this.$pluginsService.add("tns-core-modules", this.$projectData);
            }
            yield this.$pluginsService.ensureAllDependenciesAreInstalled(this.$projectData);
        });
    }
    getPlatforms() {
        const installedPlatforms = this.$platformService.getInstalledPlatforms(this.$projectData);
        const availablePlatforms = this.$platformService.getAvailablePlatforms(this.$projectData);
        const packagePlatforms = [];
        for (const platform of availablePlatforms) {
            const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
            const platformVersion = this.$projectDataService.getNSValue(this.$projectData.projectDir, platformData.frameworkPackageName);
            if (platformVersion) {
                packagePlatforms.push(platform);
            }
        }
        return {
            installed: installedPlatforms,
            packagePlatforms: installedPlatforms.concat(packagePlatforms)
        };
    }
    restoreBackup(tmpDir) {
        this.$fs.copyFile(path.join(tmpDir, constants.PACKAGE_JSON_FILE_NAME), this.$projectData.projectDir);
        for (const folder of UpdateCommand.folders) {
            this.$fs.deleteDirectory(path.join(this.$projectData.projectDir, folder));
            const folderToCopy = path.join(tmpDir, folder);
            if (this.$fs.exists(folderToCopy)) {
                this.$fs.copyFile(folderToCopy, this.$projectData.projectDir);
            }
        }
    }
    backup(tmpDir) {
        this.$fs.deleteDirectory(tmpDir);
        this.$fs.createDirectory(tmpDir);
        this.$fs.copyFile(path.join(this.$projectData.projectDir, constants.PACKAGE_JSON_FILE_NAME), tmpDir);
        for (const folder of UpdateCommand.folders) {
            const folderToCopy = path.join(this.$projectData.projectDir, folder);
            if (this.$fs.exists(folderToCopy)) {
                this.$fs.copyFile(folderToCopy, tmpDir);
            }
        }
    }
}
UpdateCommand.folders = [
    constants.LIB_DIR_NAME,
    constants.HOOKS_DIR_NAME,
    constants.PLATFORMS_DIR_NAME,
    constants.NODE_MODULES_FOLDER_NAME
];
UpdateCommand.tempFolder = ".tmp_backup";
UpdateCommand.updateFailMessage = "Could not update the project!";
UpdateCommand.backupFailMessage = "Could not backup project folders!";
exports.UpdateCommand = UpdateCommand;
$injector.registerCommand("update", UpdateCommand);
