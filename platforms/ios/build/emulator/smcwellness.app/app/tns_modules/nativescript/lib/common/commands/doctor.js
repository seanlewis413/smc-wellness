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
const os_1 = require("os");
class DoctorCommand {
    constructor($doctorService, $logger, $staticConfig) {
        this.$doctorService = $doctorService;
        this.$logger = $logger;
        this.$staticConfig = $staticConfig;
        this.allowedParameters = [];
    }
    canExecute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    execute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const warningsPrinted = yield this.$doctorService.printWarnings();
            if (warningsPrinted) {
                const client = this.$staticConfig.CLIENT_NAME_ALIAS || this.$staticConfig.CLIENT_NAME;
                this.$logger.out(`When you file an issue, these warnings will help the ${client} team to investigate, identify, and resolve the report.`.bold
                    + os_1.EOL + `Please, ignore them if you are not experiencing any issues with ${client}.`.bold + os_1.EOL);
            }
            else {
                this.$logger.out("No issues were detected.".bold);
            }
        });
    }
}
exports.DoctorCommand = DoctorCommand;
$injector.registerCommand("doctor", DoctorCommand);
