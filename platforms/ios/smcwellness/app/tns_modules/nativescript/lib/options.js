"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commonOptionsLibPath = require("./common/options");
class Options extends commonOptionsLibPath.OptionsBase {
    constructor($errors, $staticConfig, $hostInfo, $settingsService) {
        super({
            ipa: { type: "string" },
            frameworkPath: { type: "string" },
            frameworkName: { type: "string" },
            framework: { type: "string" },
            frameworkVersion: { type: "string" },
            forDevice: { type: "boolean" },
            provision: { type: "object" },
            client: { type: "boolean", default: true },
            env: { type: "object" },
            production: { type: "boolean" },
            debugTransport: { type: "boolean" },
            keyStorePath: { type: "string" },
            keyStorePassword: { type: "string", },
            keyStoreAlias: { type: "string" },
            keyStoreAliasPassword: { type: "string" },
            ignoreScripts: { type: "boolean" },
            disableNpmInstall: { type: "boolean" },
            compileSdk: { type: "number" },
            port: { type: "number" },
            copyTo: { type: "string" },
            platformTemplate: { type: "string" },
            ng: { type: "boolean" },
            tsc: { type: "boolean" },
            androidTypings: { type: "boolean" },
            bundle: { type: "string" },
            all: { type: "boolean" },
            teamId: { type: "object" },
            syncAllFiles: { type: "boolean", default: false },
            liveEdit: { type: "boolean" },
            chrome: { type: "boolean" },
            inspector: { type: "boolean" },
            clean: { type: "boolean" },
            watch: { type: "boolean", default: true }
        }, $errors, $staticConfig, $settingsService);
        const that = this;
        if (that.justlaunch) {
            that.watch = false;
        }
    }
}
exports.Options = Options;
$injector.register("options", Options);
