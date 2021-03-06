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
class HostInfo {
    constructor($errors) {
        this.$errors = $errors;
    }
    get isWindows() {
        return process.platform === HostInfo.WIN32_NAME;
    }
    get isWindows64() {
        return this.isWindows && (process.arch === "x64" || process.env.hasOwnProperty(HostInfo.PROCESSOR_ARCHITEW6432));
    }
    get isWindows32() {
        return this.isWindows && !this.isWindows64;
    }
    get isDarwin() {
        return process.platform === HostInfo.DARWIN_OS_NAME;
    }
    get isLinux() {
        return process.platform === HostInfo.LINUX_OS_NAME;
    }
    get isLinux64() {
        return this.isLinux && process.config.variables.host_arch === "x64";
    }
    dotNetVersion() {
        if (this.isWindows) {
            return new Promise((resolve, reject) => {
                const Winreg = require("winreg");
                const regKey = new Winreg({
                    hive: Winreg.HKLM,
                    key: HostInfo.DOT_NET_REGISTRY_PATH
                });
                regKey.get("Version", (err, value) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(value.value);
                    }
                });
            });
        }
        else {
            return Promise.resolve(null);
        }
    }
    isDotNet40Installed(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isWindows) {
                try {
                    yield this.dotNetVersion();
                    return true;
                }
                catch (e) {
                    this.$errors.failWithoutHelp(message || "An error occurred while reading the registry.");
                }
            }
            else {
                return false;
            }
        });
    }
}
HostInfo.WIN32_NAME = "win32";
HostInfo.PROCESSOR_ARCHITEW6432 = "PROCESSOR_ARCHITEW6432";
HostInfo.DARWIN_OS_NAME = "darwin";
HostInfo.LINUX_OS_NAME = "linux";
HostInfo.DOT_NET_REGISTRY_PATH = "\\Software\\Microsoft\\NET Framework Setup\\NDP\\v4\\Client";
exports.HostInfo = HostInfo;
$injector.register("hostInfo", HostInfo);
