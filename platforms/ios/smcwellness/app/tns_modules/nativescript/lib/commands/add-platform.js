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
class AddPlatformCommand {
    constructor($options, $platformService, $projectData, $platformsData, $errors) {
        this.$options = $options;
        this.$platformService = $platformService;
        this.$projectData = $projectData;
        this.$platformsData = $platformsData;
        this.$errors = $errors;
        this.allowedParameters = [];
        this.$projectData.initializeProjectData();
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.$platformService.addPlatforms(args, this.$options.platformTemplate, this.$projectData, this.$options, this.$options.frameworkPath);
        });
    }
    canExecute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args || args.length === 0) {
                this.$errors.fail("No platform specified. Please specify a platform to add");
            }
            for (const arg of args) {
                this.$platformService.validatePlatform(arg, this.$projectData);
                const platformData = this.$platformsData.getPlatformData(arg, this.$projectData);
                const platformProjectService = platformData.platformProjectService;
                yield platformProjectService.validate(this.$projectData);
            }
            return true;
        });
    }
}
exports.AddPlatformCommand = AddPlatformCommand;
$injector.registerCommand("platform|add", AddPlatformCommand);
