"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const project_files_provider_base_1 = require("../../services/project-files-provider-base");
class ProjectFilesProvider extends project_files_provider_base_1.ProjectFilesProviderBase {
    constructor($pathFilteringService, $projectConstants, $injector, $mobileHelper, $options) {
        super($mobileHelper, $options);
        this.$pathFilteringService = $pathFilteringService;
        this.$projectConstants = $projectConstants;
        this.$injector = $injector;
        this._projectDir = null;
        this.ignoreFilesRules = null;
    }
    get projectDir() {
        if (!this._projectDir) {
            const project = this.$injector.resolve("project");
            this._projectDir = project.getProjectDir();
        }
        return this._projectDir;
    }
    isFileExcluded(filePath) {
        const exclusionList = ProjectFilesProvider.INTERNAL_NONPROJECT_FILES.concat(this.getIgnoreFilesRules());
        return this.$pathFilteringService.isFileExcluded(filePath, exclusionList, this.projectDir);
    }
    mapFilePath(filePath, platform) {
        return filePath;
    }
    getIgnoreFilesRules() {
        if (!this.ignoreFilesRules) {
            this.ignoreFilesRules = _(this.ignoreFilesConfigurations)
                .map(configFile => this.$pathFilteringService.getRulesFromFile(path.join(this.projectDir, configFile)))
                .flatten()
                .value();
        }
        return this.ignoreFilesRules;
    }
    get ignoreFilesConfigurations() {
        const configurations = [ProjectFilesProvider.IGNORE_FILE];
        const configFileName = "." +
            (this.$options.release ? this.$projectConstants.RELEASE_CONFIGURATION_NAME : this.$projectConstants.DEBUG_CONFIGURATION_NAME) +
            ProjectFilesProvider.IGNORE_FILE;
        configurations.push(configFileName);
        return configurations;
    }
}
ProjectFilesProvider.IGNORE_FILE = ".abignore";
ProjectFilesProvider.INTERNAL_NONPROJECT_FILES = [".ab", ProjectFilesProvider.IGNORE_FILE, ".*" + ProjectFilesProvider.IGNORE_FILE, "**/*.ipa", "**/*.apk", "**/*.xap"];
exports.ProjectFilesProvider = ProjectFilesProvider;
$injector.register("projectFilesProvider", ProjectFilesProvider);
