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
class LiveSyncCommands {
    static DeployProjectCommand(liveSyncUrl) {
        return `DeployProject ${liveSyncUrl} \r`;
    }
    static ReloadStartViewCommand() {
        return "ReloadStartView \r";
    }
    static SyncFilesCommand() {
        return "SyncFiles \r";
    }
    static RefreshCurrentViewCommand() {
        return "RefreshCurrentView \r";
    }
    static DeleteFile(relativePath) {
        return `DeleteFile "${relativePath}" \r`;
    }
}
class AndroidLiveSyncService {
    constructor(device, $fs, $mobileHelper) {
        this.device = device;
        this.$fs = $fs;
        this.$mobileHelper = $mobileHelper;
    }
    get liveSyncCommands() {
        return LiveSyncCommands;
    }
    livesync(appIdentifier, liveSyncRoot, commands) {
        return __awaiter(this, void 0, void 0, function* () {
            const commandsFileDevicePath = this.$mobileHelper.buildDevicePath(liveSyncRoot, AndroidLiveSyncService.COMMANDS_FILE);
            yield this.createCommandsFileOnDevice(commandsFileDevicePath, commands);
            yield this.device.adb.sendBroadcastToDevice(AndroidLiveSyncService.LIVESYNC_BROADCAST_NAME, { "app-id": appIdentifier });
        });
    }
    createCommandsFileOnDevice(commandsFileDevicePath, commands) {
        return this.device.fileSystem.createFileOnDevice(commandsFileDevicePath, commands.join("\n"));
    }
}
AndroidLiveSyncService.COMMANDS_FILE = "telerik.livesync.commands";
AndroidLiveSyncService.LIVESYNC_BROADCAST_NAME = "com.telerik.LiveSync";
exports.AndroidLiveSyncService = AndroidLiveSyncService;
