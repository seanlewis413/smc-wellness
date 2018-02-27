"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants = require("./constants");
class DynamicHelpProvider {
    isProjectType(args) {
        return true;
    }
    getLocalVariables(options) {
        const localVariables = {
            constants: constants
        };
        return localVariables;
    }
}
exports.DynamicHelpProvider = DynamicHelpProvider;
$injector.register("dynamicHelpProvider", DynamicHelpProvider);
