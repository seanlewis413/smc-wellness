"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const constants_1 = require("../../constants");
class NodeModulesDependenciesBuilder {
    constructor($fs) {
        this.$fs = $fs;
    }
    getProductionDependencies(projectPath) {
        const rootNodeModulesPath = path.join(projectPath, constants_1.NODE_MODULES_FOLDER_NAME);
        const projectPackageJsonPath = path.join(projectPath, constants_1.PACKAGE_JSON_FILE_NAME);
        const packageJsonContent = this.$fs.readJson(projectPackageJsonPath);
        const dependencies = packageJsonContent && packageJsonContent.dependencies;
        const resolvedDependencies = [];
        const queue = _.keys(dependencies)
            .map(dependencyName => ({
            parentDir: projectPath,
            name: dependencyName,
            depth: 0
        }));
        while (queue.length) {
            const currentModule = queue.shift();
            const resolvedDependency = this.findModule(rootNodeModulesPath, currentModule.parentDir, currentModule.name, currentModule.depth, resolvedDependencies);
            if (resolvedDependency && !_.some(resolvedDependencies, r => r.directory === resolvedDependency.directory)) {
                _.each(resolvedDependency.dependencies, d => {
                    const dependency = { name: d, parentDir: resolvedDependency.directory, depth: resolvedDependency.depth + 1 };
                    const shouldAdd = !_.some(queue, element => element.name === dependency.name &&
                        element.parentDir === dependency.parentDir &&
                        element.depth === dependency.depth);
                    if (shouldAdd) {
                        queue.push(dependency);
                    }
                });
                resolvedDependencies.push(resolvedDependency);
            }
        }
        return resolvedDependencies;
    }
    findModule(rootNodeModulesPath, parentModulePath, name, depth, resolvedDependencies) {
        let modulePath = path.join(parentModulePath, constants_1.NODE_MODULES_FOLDER_NAME, name);
        const rootModulesPath = path.join(rootNodeModulesPath, name);
        let depthInNodeModules = depth;
        if (!this.moduleExists(modulePath)) {
            modulePath = rootModulesPath;
            if (!this.moduleExists(modulePath)) {
                return null;
            }
            depthInNodeModules = 0;
        }
        if (_.some(resolvedDependencies, r => r.name === name && r.directory === modulePath)) {
            return null;
        }
        return this.getDependencyData(name, modulePath, depthInNodeModules);
    }
    getDependencyData(name, directory, depth) {
        const dependency = {
            name,
            directory,
            depth
        };
        const packageJsonPath = path.join(directory, constants_1.PACKAGE_JSON_FILE_NAME);
        const packageJsonExists = this.$fs.getLsStats(packageJsonPath).isFile();
        if (packageJsonExists) {
            const packageJsonContents = this.$fs.readJson(packageJsonPath);
            if (!!packageJsonContents.nativescript) {
                dependency.nativescript = packageJsonContents.nativescript;
            }
            dependency.dependencies = _.keys(packageJsonContents.dependencies);
            return dependency;
        }
        return null;
    }
    moduleExists(modulePath) {
        try {
            let modulePathLsStat = this.$fs.getLsStats(modulePath);
            if (modulePathLsStat.isSymbolicLink()) {
                modulePathLsStat = this.$fs.getLsStats(this.$fs.realpath(modulePath));
            }
            return modulePathLsStat.isDirectory();
        }
        catch (e) {
            return false;
        }
    }
}
exports.NodeModulesDependenciesBuilder = NodeModulesDependenciesBuilder;
$injector.register("nodeModulesDependenciesBuilder", NodeModulesDependenciesBuilder);
