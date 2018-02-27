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
class PrepareCommand {
    constructor($options, $platformService, $projectData, $platformCommandParameter, $platformsData) {
        this.$options = $options;
        this.$platformService = $platformService;
        this.$projectData = $projectData;
        this.$platformCommandParameter = $platformCommandParameter;
        this.$platformsData = $platformsData;
        this.allowedParameters = [this.$platformCommandParameter];
        this.$projectData.initializeProjectData();
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const appFilesUpdaterOptions = { bundle: !!this.$options.bundle, release: this.$options.release };
            const platformInfo = {
                platform: args[0],
                appFilesUpdaterOptions,
                platformTemplate: this.$options.platformTemplate,
                projectData: this.$projectData,
                config: this.$options,
                env: this.$options.env
            };
            yield this.$platformService.preparePlatform(platformInfo);
        });
    }
    canExecute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const platform = args[0];
            const result = (yield this.$platformCommandParameter.validate(platform)) && (yield this.$platformService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, platform));
            if (result) {
                const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
                const platformProjectService = platformData.platformProjectService;
                yield platformProjectService.validate(this.$projectData);
            }
            return result;
        });
    }
}
exports.PrepareCommand = PrepareCommand;
$injector.registerCommand("prepare", PrepareCommand);
