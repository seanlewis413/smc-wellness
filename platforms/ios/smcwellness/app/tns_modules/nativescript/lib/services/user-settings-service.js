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
const path = require("path");
const userSettingsServiceBaseLib = require("../common/services/user-settings-service");
class UserSettingsService extends userSettingsServiceBaseLib.UserSettingsServiceBase {
    constructor($fs, $settingsService, $lockfile) {
        const userSettingsFilePath = path.join($settingsService.getProfileDir(), "user-settings.json");
        super(userSettingsFilePath, $fs, $lockfile);
    }
    loadUserSettingsFile() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadUserSettingsData();
        });
    }
}
$injector.register("userSettingsService", UserSettingsService);
