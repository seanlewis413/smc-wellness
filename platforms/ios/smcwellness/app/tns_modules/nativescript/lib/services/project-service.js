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
const constants = require("../constants");
const path = require("path");
const shelljs = require("shelljs");
const decorators_1 = require("../common/decorators");
class ProjectService {
    constructor($npm, $errors, $fs, $logger, $projectData, $projectDataService, $projectHelper, $projectNameService, $projectTemplatesService, $staticConfig, $npmInstallationManager) {
        this.$npm = $npm;
        this.$errors = $errors;
        this.$fs = $fs;
        this.$logger = $logger;
        this.$projectData = $projectData;
        this.$projectDataService = $projectDataService;
        this.$projectHelper = $projectHelper;
        this.$projectNameService = $projectNameService;
        this.$projectTemplatesService = $projectTemplatesService;
        this.$staticConfig = $staticConfig;
        this.$npmInstallationManager = $npmInstallationManager;
    }
    createProject(projectOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let projectName = projectOptions.projectName;
            let selectedTemplate = projectOptions.template;
            if (!projectName) {
                this.$errors.fail("You must specify <App name> when creating a new project.");
            }
            projectName = yield this.$projectNameService.ensureValidName(projectName, { force: projectOptions.force });
            const selectedPath = path.resolve(projectOptions.pathToProject || ".");
            const projectDir = path.join(selectedPath, projectName);
            this.$fs.createDirectory(projectDir);
            if (this.$fs.exists(projectDir) && !this.$fs.isEmptyDir(projectDir)) {
                this.$errors.fail("Path already exists and is not empty %s", projectDir);
            }
            const projectId = projectOptions.appId || this.$projectHelper.generateDefaultAppId(projectName, constants.DEFAULT_APP_IDENTIFIER_PREFIX);
            this.createPackageJson(projectDir, projectId);
            this.$logger.trace(`Creating a new NativeScript project with name ${projectName} and id ${projectId} at location ${projectDir}`);
            if (!selectedTemplate) {
                selectedTemplate = constants.RESERVED_TEMPLATE_NAMES["default"];
            }
            try {
                const templatePath = yield this.$projectTemplatesService.prepareTemplate(selectedTemplate, projectDir);
                yield this.extractTemplate(projectDir, templatePath);
                yield this.ensureAppResourcesExist(projectDir);
                const templatePackageJsonData = this.getDataFromJson(templatePath);
                if (!(templatePackageJsonData && templatePackageJsonData.dependencies && templatePackageJsonData.dependencies[constants.TNS_CORE_MODULES_NAME])) {
                    yield this.$npmInstallationManager.install(constants.TNS_CORE_MODULES_NAME, projectDir, { dependencyType: "save" });
                }
                this.mergeProjectAndTemplateProperties(projectDir, templatePackageJsonData);
                this.removeMergedDependencies(projectDir, templatePackageJsonData);
                yield this.$npm.install(projectDir, projectDir, {
                    disableNpmInstall: false,
                    frameworkPath: null,
                    ignoreScripts: projectOptions.ignoreScripts
                });
                const templatePackageJson = this.$fs.readJson(path.join(templatePath, "package.json"));
                yield this.$npm.uninstall(templatePackageJson.name, { save: true }, projectDir);
            }
            catch (err) {
                this.$fs.deleteDirectory(projectDir);
                throw err;
            }
            this.$logger.printMarkdown("Project `%s` was successfully created.", projectName);
        });
    }
    isValidNativeScriptProject(pathToProject) {
        try {
            this.$projectData.initializeProjectData(pathToProject);
            return !!this.$projectData.projectDir && !!this.$projectData.projectId;
        }
        catch (e) {
            return false;
        }
    }
    getDataFromJson(templatePath) {
        const templatePackageJsonPath = path.join(templatePath, constants.PACKAGE_JSON_FILE_NAME);
        if (this.$fs.exists(templatePackageJsonPath)) {
            const templatePackageJsonData = this.$fs.readJson(templatePackageJsonPath);
            return templatePackageJsonData;
        }
        else {
            this.$logger.trace(`Template ${templatePath} does not have ${constants.PACKAGE_JSON_FILE_NAME} file.`);
        }
        return null;
    }
    extractTemplate(projectDir, realTemplatePath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$fs.ensureDirectoryExists(projectDir);
            const appDestinationPath = path.join(projectDir, constants.APP_FOLDER_NAME);
            this.$fs.createDirectory(appDestinationPath);
            this.$logger.trace(`Copying application from '${realTemplatePath}' into '${appDestinationPath}'.`);
            shelljs.cp('-R', path.join(realTemplatePath, "*"), appDestinationPath);
            this.$fs.createDirectory(path.join(projectDir, "platforms"));
        });
    }
    ensureAppResourcesExist(projectDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const appPath = path.join(projectDir, constants.APP_FOLDER_NAME), appResourcesDestinationPath = path.join(appPath, constants.APP_RESOURCES_FOLDER_NAME);
            if (!this.$fs.exists(appResourcesDestinationPath)) {
                this.$fs.createDirectory(appResourcesDestinationPath);
                const defaultTemplateName = constants.RESERVED_TEMPLATE_NAMES["default"];
                yield this.$npm.install(defaultTemplateName, projectDir, {
                    save: true,
                    disableNpmInstall: false,
                    frameworkPath: null,
                    ignoreScripts: false
                });
                const defaultTemplateAppResourcesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, defaultTemplateName, constants.APP_RESOURCES_FOLDER_NAME);
                if (this.$fs.exists(defaultTemplateAppResourcesPath)) {
                    shelljs.cp('-R', defaultTemplateAppResourcesPath, appPath);
                }
                yield this.$npm.uninstall(defaultTemplateName, { save: true }, projectDir);
            }
        });
    }
    removeMergedDependencies(projectDir, templatePackageJsonData) {
        const extractedTemplatePackageJsonPath = path.join(projectDir, constants.APP_FOLDER_NAME, constants.PACKAGE_JSON_FILE_NAME);
        for (const key in templatePackageJsonData) {
            if (constants.PackageJsonKeysToKeep.indexOf(key) === -1) {
                delete templatePackageJsonData[key];
            }
        }
        this.$logger.trace("Deleting unnecessary information from template json.");
        this.$fs.writeJson(extractedTemplatePackageJsonPath, templatePackageJsonData);
    }
    mergeProjectAndTemplateProperties(projectDir, templatePackageJsonData) {
        if (templatePackageJsonData) {
            const projectPackageJsonPath = path.join(projectDir, constants.PACKAGE_JSON_FILE_NAME);
            const projectPackageJsonData = this.$fs.readJson(projectPackageJsonPath);
            this.$logger.trace("Initial project package.json data: ", projectPackageJsonData);
            if (projectPackageJsonData.dependencies || templatePackageJsonData.dependencies) {
                projectPackageJsonData.dependencies = this.mergeDependencies(projectPackageJsonData.dependencies, templatePackageJsonData.dependencies);
            }
            if (projectPackageJsonData.devDependencies || templatePackageJsonData.devDependencies) {
                projectPackageJsonData.devDependencies = this.mergeDependencies(projectPackageJsonData.devDependencies, templatePackageJsonData.devDependencies);
            }
            this.$logger.trace("New project package.json data: ", projectPackageJsonData);
            this.$fs.writeJson(projectPackageJsonPath, projectPackageJsonData);
        }
        else {
            this.$errors.failWithoutHelp(`Couldn't find package.json data in installed template`);
        }
    }
    mergeDependencies(projectDependencies, templateDependencies) {
        this.$logger.trace("Merging dependencies, projectDependencies are: ", projectDependencies, " templateDependencies are: ", templateDependencies);
        projectDependencies = projectDependencies || {};
        _.extend(projectDependencies, templateDependencies || {});
        const sortedDeps = {};
        const dependenciesNames = _.keys(projectDependencies).sort();
        _.each(dependenciesNames, (key) => {
            sortedDeps[key] = projectDependencies[key];
        });
        this.$logger.trace("Sorted merged dependencies are: ", sortedDeps);
        return sortedDeps;
    }
    createPackageJson(projectDir, projectId) {
        const projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
        this.$fs.writeJson(projectFilePath, {
            "description": "NativeScript Application",
            "license": "SEE LICENSE IN <your-license-filename>",
            "readme": "NativeScript Application",
            "repository": "<fill-your-repository-here>"
        });
        this.$projectDataService.setNSValue(projectDir, "id", projectId);
    }
}
__decorate([
    decorators_1.exported("projectService")
], ProjectService.prototype, "createProject", null);
__decorate([
    decorators_1.exported("projectService")
], ProjectService.prototype, "isValidNativeScriptProject", null);
exports.ProjectService = ProjectService;
$injector.register("projectService", ProjectService);
