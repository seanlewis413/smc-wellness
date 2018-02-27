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
const shelljs = require("shelljs");
const node_modules_dest_copy_1 = require("./node-modules-dest-copy");
class NodeModulesBuilder {
    constructor($fs, $injector, $nodeModulesDependenciesBuilder) {
        this.$fs = $fs;
        this.$injector = $injector;
        this.$nodeModulesDependenciesBuilder = $nodeModulesDependenciesBuilder;
    }
    prepareNodeModules(nodeModulesData) {
        return __awaiter(this, void 0, void 0, function* () {
            const productionDependencies = this.initialPrepareNodeModules(nodeModulesData);
            const npmPluginPrepare = this.$injector.resolve(node_modules_dest_copy_1.NpmPluginPrepare);
            yield npmPluginPrepare.preparePlugins(productionDependencies, nodeModulesData.platform, nodeModulesData.projectData, nodeModulesData.projectFilesConfig);
        });
    }
    prepareJSNodeModules(jsNodeModulesData) {
        return __awaiter(this, void 0, void 0, function* () {
            const productionDependencies = this.initialPrepareNodeModules(jsNodeModulesData);
            const npmPluginPrepare = this.$injector.resolve(node_modules_dest_copy_1.NpmPluginPrepare);
            yield npmPluginPrepare.prepareJSPlugins(productionDependencies, jsNodeModulesData.platform, jsNodeModulesData.projectData, jsNodeModulesData.projectFilesConfig);
        });
    }
    cleanNodeModules(absoluteOutputPath, platform) {
        shelljs.rm("-rf", absoluteOutputPath);
    }
    initialPrepareNodeModules(nodeModulesData) {
        const productionDependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(nodeModulesData.projectData.projectDir);
        if (!this.$fs.exists(nodeModulesData.absoluteOutputPath)) {
            nodeModulesData.lastModifiedTime = null;
        }
        if (!nodeModulesData.appFilesUpdaterOptions.bundle) {
            const tnsModulesCopy = this.$injector.resolve(node_modules_dest_copy_1.TnsModulesCopy, {
                outputRoot: nodeModulesData.absoluteOutputPath
            });
            tnsModulesCopy.copyModules(productionDependencies, nodeModulesData.platform);
        }
        else {
            this.cleanNodeModules(nodeModulesData.absoluteOutputPath, nodeModulesData.platform);
        }
        return productionDependencies;
    }
}
exports.NodeModulesBuilder = NodeModulesBuilder;
$injector.register("nodeModulesBuilder", NodeModulesBuilder);
