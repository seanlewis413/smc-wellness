"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BundleBase {
    constructor($projectData, $errors, $options) {
        this.$projectData = $projectData;
        this.$errors = $errors;
        this.$options = $options;
        this.bundlersMap = {
            webpack: "nativescript-dev-webpack"
        };
        this.$projectData.initializeProjectData();
    }
    validateBundling() {
        if (this.$options.bundle) {
            const bundlePluginName = this.bundlersMap[this.$options.bundle];
            const hasBundlerPluginAsDependency = this.$projectData.dependencies && this.$projectData.dependencies[bundlePluginName];
            const hasBundlerPluginAsDevDependency = this.$projectData.devDependencies && this.$projectData.devDependencies[bundlePluginName];
            if (!bundlePluginName || (!hasBundlerPluginAsDependency && !hasBundlerPluginAsDevDependency)) {
                this.$errors.fail("Passing --bundle requires a bundling plugin. No bundling plugin found or the specified bundling plugin is invalid.");
            }
        }
    }
}
exports.BundleBase = BundleBase;
