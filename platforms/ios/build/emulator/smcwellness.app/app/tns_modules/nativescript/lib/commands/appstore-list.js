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
const helpers_1 = require("../common/helpers");
const command_params_1 = require("../common/command-params");
class ListiOSApps {
    constructor($injector, $itmsTransporterService, $logger, $projectData, $devicePlatformsConstants, $platformService, $errors, $prompter) {
        this.$injector = $injector;
        this.$itmsTransporterService = $itmsTransporterService;
        this.$logger = $logger;
        this.$projectData = $projectData;
        this.$devicePlatformsConstants = $devicePlatformsConstants;
        this.$platformService = $platformService;
        this.$errors = $errors;
        this.$prompter = $prompter;
        this.allowedParameters = [new command_params_1.StringCommandParameter(this.$injector), new command_params_1.StringCommandParameter(this.$injector)];
        this.$projectData.initializeProjectData();
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
                this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`);
            }
            let username = args[0];
            let password = args[1];
            if (!username) {
                username = yield this.$prompter.getString("Apple ID", { allowEmpty: false });
            }
            if (!password) {
                password = yield this.$prompter.getPassword("Apple ID password");
            }
            const iOSApplications = yield this.$itmsTransporterService.getiOSApplications({ username, password });
            if (!iOSApplications || !iOSApplications.length) {
                this.$logger.out("Seems you don't have any applications yet.");
            }
            else {
                const table = helpers_1.createTable(["Application Name", "Bundle Identifier", "Version"], iOSApplications.map(element => {
                    return [element.name, element.bundleId, element.version];
                }));
                this.$logger.out(table.toString());
            }
        });
    }
}
exports.ListiOSApps = ListiOSApps;
$injector.registerCommand("appstore|*list", ListiOSApps);
