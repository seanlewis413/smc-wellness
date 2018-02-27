"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
const temp = require("temp");
const decorators_1 = require("../../decorators");
const helpers_1 = require("../../helpers");
const constants_1 = require("../../constants");
class AndroidDeviceHashService {
    constructor(adb, appIdentifier, $fs, $mobileHelper) {
        this.adb = adb;
        this.appIdentifier = appIdentifier;
        this.$fs = $fs;
        this.$mobileHelper = $mobileHelper;
    }
    get hashFileDevicePath() {
        return this.$mobileHelper.buildDevicePath(AndroidDeviceHashService.DEVICE_ROOT_PATH, this.appIdentifier, AndroidDeviceHashService.HASH_FILE_NAME);
    }
    doesShasumFileExistsOnDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            const lsResult = yield this.adb.executeShellCommand(["ls", this.hashFileDevicePath]);
            return !!(lsResult && lsResult.trim() === this.hashFileDevicePath);
        });
    }
    getShasumsFromDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            const hashFileLocalPath = yield this.downloadHashFileFromDevice();
            if (this.$fs.exists(hashFileLocalPath)) {
                return this.$fs.readJson(hashFileLocalPath);
            }
            return null;
        });
    }
    uploadHashFileToDevice(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$fs.writeJson(this.hashFileLocalPath, data);
            yield this.adb.executeCommand(["push", this.hashFileLocalPath, this.hashFileDevicePath]);
        });
    }
    updateHashes(localToDevicePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldShasums = yield this.getShasumsFromDevice();
            if (oldShasums) {
                yield this.generateHashesFromLocalToDevicePaths(localToDevicePaths, oldShasums);
                yield this.uploadHashFileToDevice(oldShasums);
                return true;
            }
            return false;
        });
    }
    generateHashesFromLocalToDevicePaths(localToDevicePaths, shasums) {
        return __awaiter(this, void 0, void 0, function* () {
            const devicePaths = [];
            const action = (localToDevicePathData) => __awaiter(this, void 0, void 0, function* () {
                const localPath = localToDevicePathData.getLocalPath();
                if (this.$fs.getFsStats(localPath).isFile()) {
                    shasums[localPath] = yield this.$fs.getFileShasum(localPath);
                }
                devicePaths.push(`"${localToDevicePathData.getDevicePath()}"`);
            });
            yield helpers_1.executeActionByChunks(localToDevicePaths, constants_1.DEFAULT_CHUNK_SIZE, action);
            return devicePaths;
        });
    }
    removeHashes(localToDevicePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldShasums = yield this.getShasumsFromDevice();
            if (oldShasums) {
                const fileToShasumDictionary = (_.omit(oldShasums, localToDevicePaths.map(ldp => ldp.getLocalPath())));
                yield this.uploadHashFileToDevice(fileToShasumDictionary);
                return true;
            }
            return false;
        });
    }
    get hashFileLocalPath() {
        return path.join(this.tempDir, AndroidDeviceHashService.HASH_FILE_NAME);
    }
    get tempDir() {
        temp.track();
        return temp.mkdirSync(`android-device-hash-service-${this.appIdentifier}`);
    }
    downloadHashFileFromDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.$fs.exists(this.hashFileLocalPath)) {
                yield this.adb.executeCommand(["pull", this.hashFileDevicePath, this.tempDir]);
            }
            return this.hashFileLocalPath;
        });
    }
}
AndroidDeviceHashService.HASH_FILE_NAME = "hashes";
AndroidDeviceHashService.DEVICE_ROOT_PATH = "/data/local/tmp";
__decorate([
    decorators_1.cache()
], AndroidDeviceHashService.prototype, "hashFileDevicePath", null);
__decorate([
    decorators_1.cache()
], AndroidDeviceHashService.prototype, "hashFileLocalPath", null);
__decorate([
    decorators_1.cache()
], AndroidDeviceHashService.prototype, "tempDir", null);
exports.AndroidDeviceHashService = AndroidDeviceHashService;
