"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const helpers_1 = require("../helpers");
class DynamicHelpService {
    constructor($dynamicHelpProvider) {
        this.$dynamicHelpProvider = $dynamicHelpProvider;
    }
    isProjectType(...args) {
        return this.$dynamicHelpProvider.isProjectType(args);
    }
    isPlatform(...args) {
        const platform = os.platform().toLowerCase();
        return _.some(args, arg => arg.toLowerCase() === platform);
    }
    getLocalVariables(options) {
        const isHtml = options.isHtml;
        const localVariables = this.$dynamicHelpProvider.getLocalVariables(options);
        localVariables["isLinux"] = isHtml || this.isPlatform("linux");
        localVariables["isWindows"] = isHtml || this.isPlatform("win32");
        localVariables["isMacOS"] = isHtml || this.isPlatform("darwin");
        localVariables["isConsole"] = !isHtml;
        localVariables["isHtml"] = isHtml;
        localVariables["formatListOfNames"] = helpers_1.formatListOfNames;
        return localVariables;
    }
}
exports.DynamicHelpService = DynamicHelpService;
$injector.register("dynamicHelpService", DynamicHelpService);
