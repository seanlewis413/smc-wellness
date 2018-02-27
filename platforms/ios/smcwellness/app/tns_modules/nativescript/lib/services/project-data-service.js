"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const project_data_1 = require("../project-data");
class ProjectDataService {
    constructor($fs, $staticConfig, $logger, $injector) {
        this.$fs = $fs;
        this.$staticConfig = $staticConfig;
        this.$logger = $logger;
        this.$injector = $injector;
    }
    getNSValue(projectDir, propertyName) {
        return this.getValue(projectDir, this.getNativeScriptPropertyName(propertyName));
    }
    setNSValue(projectDir, key, value) {
        this.setValue(projectDir, this.getNativeScriptPropertyName(key), value);
    }
    removeNSProperty(projectDir, propertyName) {
        this.removeProperty(projectDir, this.getNativeScriptPropertyName(propertyName));
    }
    removeDependency(projectDir, dependencyName) {
        const projectFileInfo = this.getProjectFileData(projectDir);
        delete projectFileInfo.projectData[ProjectDataService.DEPENDENCIES_KEY_NAME][dependencyName];
        this.$fs.writeJson(projectFileInfo.projectFilePath, projectFileInfo.projectData);
    }
    getProjectData(projectDir) {
        const projectDataInstance = this.$injector.resolve(project_data_1.ProjectData);
        projectDataInstance.initializeProjectData(projectDir);
        return projectDataInstance;
    }
    getValue(projectDir, propertyName) {
        const projectData = this.getProjectFileData(projectDir).projectData;
        if (projectData) {
            try {
                return this.getPropertyValueFromJson(projectData, propertyName);
            }
            catch (err) {
                this.$logger.trace(`Error while trying to get property ${propertyName} from ${projectDir}. Error is:`, err);
            }
        }
        return null;
    }
    getNativeScriptPropertyName(propertyName) {
        return `${this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE}.${propertyName}`;
    }
    getPropertyValueFromJson(jsonData, dottedPropertyName) {
        const props = dottedPropertyName.split(".");
        let result = jsonData[props.shift()];
        for (const prop of props) {
            result = result[prop];
        }
        return result;
    }
    setValue(projectDir, key, value) {
        const projectFileInfo = this.getProjectFileData(projectDir);
        const props = key.split(".");
        const data = projectFileInfo.projectData;
        let currentData = data;
        _.each(props, (prop, index) => {
            if (index === (props.length - 1)) {
                currentData[prop] = value;
            }
            else {
                currentData[prop] = currentData[prop] || Object.create(null);
            }
            currentData = currentData[prop];
        });
        this.$fs.writeJson(projectFileInfo.projectFilePath, data);
    }
    removeProperty(projectDir, propertyName) {
        const projectFileInfo = this.getProjectFileData(projectDir);
        const data = projectFileInfo.projectData;
        let currentData = data;
        const props = propertyName.split(".");
        const propertyToDelete = props.splice(props.length - 1, 1)[0];
        _.each(props, (prop) => {
            currentData = currentData[prop];
        });
        delete currentData[propertyToDelete];
        this.$fs.writeJson(projectFileInfo.projectFilePath, data);
    }
    getProjectFileData(projectDir) {
        const projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
        const projectFileContent = this.$fs.readText(projectFilePath);
        const projectData = projectFileContent ? JSON.parse(projectFileContent) : Object.create(null);
        return {
            projectData,
            projectFilePath
        };
    }
}
ProjectDataService.DEPENDENCIES_KEY_NAME = "dependencies";
exports.ProjectDataService = ProjectDataService;
$injector.register("projectDataService", ProjectDataService);
