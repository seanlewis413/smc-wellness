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
const Registry = require("winreg");
class WinReg {
    constructor() {
        this.registryKeys = {
            HKLM: { registry: Registry.HKLM },
            HKCU: { registry: Registry.HKCU },
            HKCR: { registry: Registry.HKCR },
            HKCC: { registry: Registry.HKCC },
            HKU: { registry: Registry.HKU }
        };
    }
    getRegistryValue(valueName, hive, key, host) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const regKey = new Registry({
                        hive: (hive && hive.registry) ? hive.registry : null,
                        key: key,
                        host: host
                    });
                    regKey.get(valueName, (err, value) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(value);
                        }
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
}
exports.WinReg = WinReg;
$injector.register("winreg", WinReg);
