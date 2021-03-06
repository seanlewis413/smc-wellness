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
class InfoService {
    constructor($versionsService, $logger) {
        this.$versionsService = $versionsService;
        this.$logger = $logger;
    }
    printComponentsInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const allComponentsInfo = yield this.$versionsService.getAllComponentsVersions();
            const table = this.$versionsService.createTableWithVersionsInformation(allComponentsInfo);
            this.$logger.out("All NativeScript components versions information");
            this.$logger.out(table.toString());
        });
    }
}
exports.InfoService = InfoService;
$injector.register("infoService", InfoService);
