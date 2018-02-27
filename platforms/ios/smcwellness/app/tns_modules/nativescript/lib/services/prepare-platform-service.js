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
const app_files_updater_1 = require("./app-files-updater");
class PreparePlatformService {
    constructor($fs, $hooksService, $xmlValidator) {
        this.$fs = $fs;
        this.$hooksService = $hooksService;
        this.$xmlValidator = $xmlValidator;
    }
    get _hooksService() {
        return this.$hooksService;
    }
    copyAppFiles(copyAppFilesData) {
        return __awaiter(this, void 0, void 0, function* () {
            copyAppFilesData.platformData.platformProjectService.ensureConfigurationFileInAppResources(copyAppFilesData.projectData);
            const appDestinationDirectoryPath = path.join(copyAppFilesData.platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
            this.$fs.ensureDirectoryExists(appDestinationDirectoryPath);
            const appSourceDirectoryPath = path.join(copyAppFilesData.projectData.projectDir, constants.APP_FOLDER_NAME);
            const appUpdater = new app_files_updater_1.AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, copyAppFilesData.appFilesUpdaterOptions, this.$fs);
            appUpdater.updateApp(sourceFiles => {
                this.$xmlValidator.validateXmlFiles(sourceFiles);
            });
        });
    }
}
exports.PreparePlatformService = PreparePlatformService;
