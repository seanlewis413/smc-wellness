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
const temp = require("temp");
const constants = require("../constants");
temp.track();
class ProjectTemplatesService {
    constructor($analyticsService, $fs, $logger, $npmInstallationManager) {
        this.$analyticsService = $analyticsService;
        this.$fs = $fs;
        this.$logger = $logger;
        this.$npmInstallationManager = $npmInstallationManager;
    }
    prepareTemplate(originalTemplateName, projectDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = originalTemplateName.split("@"), name = data[0], version = data[1];
            const templateName = constants.RESERVED_TEMPLATE_NAMES[name.toLowerCase()] || name;
            yield this.$analyticsService.track("Template used for project creation", templateName);
            yield this.$analyticsService.trackEventActionInGoogleAnalytics({
                action: "Create project",
                isForDevice: null,
                additionalData: templateName
            });
            const realTemplatePath = yield this.prepareNativeScriptTemplate(templateName, version, projectDir);
            this.$fs.deleteDirectory(path.join(realTemplatePath, constants.NODE_MODULES_FOLDER_NAME));
            return realTemplatePath;
        });
    }
    prepareNativeScriptTemplate(templateName, version, projectDir) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.trace(`Using NativeScript verified template: ${templateName} with version ${version}.`);
            return this.$npmInstallationManager.install(templateName, projectDir, { version: version, dependencyType: "save" });
        });
    }
}
exports.ProjectTemplatesService = ProjectTemplatesService;
$injector.register("projectTemplatesService", ProjectTemplatesService);
