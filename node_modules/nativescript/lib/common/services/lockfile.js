"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const lockfile = require("lockfile");
const path = require("path");
const decorators_1 = require("../decorators");
class LockFile {
    constructor($fs, $settingsService) {
        this.$fs = $fs;
        this.$settingsService = $settingsService;
    }
    get defaultLockFilePath() {
        return path.join(this.$settingsService.getProfileDir(), "lockfile.lock");
    }
    get defaultLockParams() {
        const lockParams = {
            retryWait: 100,
            retries: 100,
            stale: 180 * 1000,
        };
        return lockParams;
    }
    lock(lockFilePath, lockFileOpts) {
        const { filePath, fileOpts } = this.getLockFileSettings(lockFilePath, lockFileOpts);
        this.$fs.ensureDirectoryExists(path.dirname(filePath));
        return new Promise((resolve, reject) => {
            lockfile.lock(filePath, fileOpts, (err) => {
                err ? reject(err) : resolve();
            });
        });
    }
    unlock(lockFilePath) {
        const { filePath } = this.getLockFileSettings(lockFilePath);
        lockfile.unlockSync(filePath);
    }
    check(lockFilePath, lockFileOpts) {
        const { filePath, fileOpts } = this.getLockFileSettings(lockFilePath, lockFileOpts);
        return lockfile.checkSync(filePath, fileOpts);
    }
    getLockFileSettings(filePath, fileOpts) {
        filePath = filePath || this.defaultLockFilePath;
        fileOpts = fileOpts || this.defaultLockParams;
        return {
            filePath,
            fileOpts
        };
    }
}
__decorate([
    decorators_1.cache()
], LockFile.prototype, "defaultLockFilePath", null);
exports.LockFile = LockFile;
$injector.register("lockfile", LockFile);
