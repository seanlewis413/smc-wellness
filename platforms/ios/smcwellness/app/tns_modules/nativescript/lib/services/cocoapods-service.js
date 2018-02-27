"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
class CocoaPodsService {
    constructor($fs) {
        this.$fs = $fs;
    }
    getPodfileHeader(targetName) {
        return `use_frameworks!${os_1.EOL}${os_1.EOL}target "${targetName}" do${os_1.EOL}`;
    }
    getPodfileFooter() {
        return `${os_1.EOL}end`;
    }
    mergePodfileHookContent(hookName, pathToPodfile) {
        if (!this.$fs.exists(pathToPodfile)) {
            throw new Error(`The Podfile ${pathToPodfile} does not exist.`);
        }
        const podfileContent = this.$fs.readText(pathToPodfile);
        const hookStart = `${hookName} do`;
        const hookDefinitionRegExp = new RegExp(`${hookStart} *(\\|(\\w+)\\|)?`, "g");
        let newFunctionNameIndex = 1;
        const newFunctions = [];
        const replacedContent = podfileContent.replace(hookDefinitionRegExp, (substring, firstGroup, secondGroup, index) => {
            const newFunctionName = `${hookName}${newFunctionNameIndex++}`;
            let newDefinition = `def ${newFunctionName}`;
            const rubyFunction = { functionName: newFunctionName };
            if (firstGroup && secondGroup) {
                newDefinition = `${newDefinition} (${secondGroup})`;
                rubyFunction.functionParameters = secondGroup;
            }
            newFunctions.push(rubyFunction);
            return newDefinition;
        });
        if (newFunctions.length > 1) {
            const blokParameterName = "installer";
            let mergedHookContent = `${hookStart} |${blokParameterName}|${os_1.EOL}`;
            _.each(newFunctions, (rubyFunction) => {
                let functionExecution = rubyFunction.functionName;
                if (rubyFunction.functionParameters && rubyFunction.functionParameters.length) {
                    functionExecution = `${functionExecution} ${blokParameterName}`;
                }
                mergedHookContent = `${mergedHookContent}  ${functionExecution}${os_1.EOL}`;
            });
            mergedHookContent = `${mergedHookContent}end`;
            const newPodfileContent = `${replacedContent}${os_1.EOL}${mergedHookContent}`;
            this.$fs.writeFile(pathToPodfile, newPodfileContent);
        }
    }
}
exports.CocoaPodsService = CocoaPodsService;
$injector.register("cocoapodsService", CocoaPodsService);
