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
const sys_info_base_1 = require("./common/sys-info-base");
const path = require("path");
class SysInfo extends sys_info_base_1.SysInfoBase {
    constructor($childProcess, $hostInfo, $iTunesValidator, $logger, $winreg, $androidEmulatorServices, $androidToolsInfo) {
        super($childProcess, $hostInfo, $iTunesValidator, $logger, $winreg, $androidEmulatorServices);
        this.$childProcess = $childProcess;
        this.$hostInfo = $hostInfo;
        this.$iTunesValidator = $iTunesValidator;
        this.$logger = $logger;
        this.$winreg = $winreg;
        this.$androidEmulatorServices = $androidEmulatorServices;
        this.$androidToolsInfo = $androidToolsInfo;
    }
    getSysInfo(pathToPackageJson, androidToolsInfo) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            const defaultAndroidToolsInfo = {
                pathToAdb: yield this.$androidToolsInfo.getPathToAdbFromAndroidHome()
            };
            return _super("getSysInfo").call(this, pathToPackageJson || (yield path.join(__dirname, "..", "package.json")), androidToolsInfo || defaultAndroidToolsInfo);
        });
    }
}
exports.SysInfo = SysInfo;
$injector.register("sysInfo", SysInfo);
