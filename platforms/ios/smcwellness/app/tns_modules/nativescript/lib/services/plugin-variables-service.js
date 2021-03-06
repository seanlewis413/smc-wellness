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
const helpers = require("./../common/helpers");
class PluginVariablesService {
    constructor($errors, $pluginVariablesHelper, $projectDataService, $prompter, $fs) {
        this.$errors = $errors;
        this.$pluginVariablesHelper = $pluginVariablesHelper;
        this.$projectDataService = $projectDataService;
        this.$prompter = $prompter;
        this.$fs = $fs;
    }
    getPluginVariablePropertyName(pluginName) {
        return `${pluginName}-${PluginVariablesService.PLUGIN_VARIABLES_KEY}`;
    }
    savePluginVariablesInProjectFile(pluginData, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = Object.create(null);
            yield this.executeForAllPluginVariables(pluginData, (pluginVariableData) => __awaiter(this, void 0, void 0, function* () {
                const pluginVariableValue = yield this.getPluginVariableValue(pluginVariableData);
                this.ensurePluginVariableValue(pluginVariableValue, `Unable to find value for ${pluginVariableData.name} plugin variable from ${pluginData.name} plugin. Ensure the --var option is specified or the plugin variable has default value.`);
                values[pluginVariableData.name] = pluginVariableValue;
            }), projectData);
            if (!_.isEmpty(values)) {
                this.$projectDataService.setNSValue(projectData.projectDir, this.getPluginVariablePropertyName(pluginData.name), values);
            }
        });
    }
    removePluginVariablesFromProjectFile(pluginName, projectData) {
        this.$projectDataService.removeNSProperty(projectData.projectDir, this.getPluginVariablePropertyName(pluginName));
    }
    interpolatePluginVariables(pluginData, pluginConfigurationFilePath, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            let pluginConfigurationFileContent = this.$fs.readText(pluginConfigurationFilePath);
            yield this.executeForAllPluginVariables(pluginData, (pluginVariableData) => __awaiter(this, void 0, void 0, function* () {
                this.ensurePluginVariableValue(pluginVariableData.value, `Unable to find the value for ${pluginVariableData.name} plugin variable into project package.json file. Verify that your package.json file is correct and try again.`);
                pluginConfigurationFileContent = this.interpolateCore(pluginVariableData.name, pluginVariableData.value, pluginConfigurationFileContent);
            }), projectData);
            this.$fs.writeFile(pluginConfigurationFilePath, pluginConfigurationFileContent);
        });
    }
    interpolateAppIdentifier(pluginConfigurationFilePath, projectData) {
        const pluginConfigurationFileContent = this.$fs.readText(pluginConfigurationFilePath);
        const newContent = this.interpolateCore("nativescript.id", projectData.projectId, pluginConfigurationFileContent);
        this.$fs.writeFile(pluginConfigurationFilePath, newContent);
    }
    interpolate(pluginData, pluginConfigurationFilePath, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.interpolatePluginVariables(pluginData, pluginConfigurationFilePath, projectData);
            this.interpolateAppIdentifier(pluginConfigurationFilePath, projectData);
        });
    }
    interpolateCore(name, value, content) {
        return content.replace(new RegExp(`{${name}}`, "gi"), value);
    }
    ensurePluginVariableValue(pluginVariableValue, errorMessage) {
        if (!pluginVariableValue) {
            this.$errors.failWithoutHelp(errorMessage);
        }
    }
    getPluginVariableValue(pluginVariableData) {
        return __awaiter(this, void 0, void 0, function* () {
            const pluginVariableName = pluginVariableData.name;
            let value = this.$pluginVariablesHelper.getPluginVariableFromVarOption(pluginVariableName);
            if (value) {
                value = value[pluginVariableName];
            }
            else {
                value = pluginVariableData.defaultValue;
                if (!value && helpers.isInteractive()) {
                    const promptSchema = {
                        name: pluginVariableName,
                        type: "input",
                        message: `Enter value for ${pluginVariableName} variable:`,
                        validate: (val) => !!val ? true : 'Please enter a value!'
                    };
                    const promptData = yield this.$prompter.get([promptSchema]);
                    value = promptData[pluginVariableName];
                }
            }
            return value;
        });
    }
    executeForAllPluginVariables(pluginData, action, projectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const pluginVariables = pluginData.pluginVariables;
            const pluginVariablesNames = _.keys(pluginVariables);
            yield Promise.all(_.map(pluginVariablesNames, pluginVariableName => action(this.createPluginVariableData(pluginData, pluginVariableName, projectData))));
        });
    }
    createPluginVariableData(pluginData, pluginVariableName, projectData) {
        const variableData = pluginData.pluginVariables[pluginVariableName];
        variableData.name = pluginVariableName;
        const pluginVariableValues = this.$projectDataService.getNSValue(projectData.projectDir, this.getPluginVariablePropertyName(pluginData.name));
        variableData.value = pluginVariableValues ? pluginVariableValues[pluginVariableName] : undefined;
        return variableData;
    }
}
PluginVariablesService.PLUGIN_VARIABLES_KEY = "variables";
exports.PluginVariablesService = PluginVariablesService;
$injector.register("pluginVariablesService", PluginVariablesService);
