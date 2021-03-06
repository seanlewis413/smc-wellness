"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class DebugServiceBase extends events_1.EventEmitter {
    constructor(device, $devicesService) {
        super();
        this.device = device;
        this.$devicesService = $devicesService;
    }
    getCanExecuteAction(deviceIdentifier) {
        return (device) => {
            if (deviceIdentifier) {
                let isSearchedDevice = device.deviceInfo.identifier === deviceIdentifier;
                if (!isSearchedDevice) {
                    const deviceByDeviceOption = this.$devicesService.getDeviceByDeviceOption();
                    isSearchedDevice = deviceByDeviceOption && device.deviceInfo.identifier === deviceByDeviceOption.deviceInfo.identifier;
                }
                return isSearchedDevice;
            }
            else {
                return true;
            }
        };
    }
    getChromeDebugUrl(debugOptions, port) {
        const commitSHA = debugOptions.devToolsCommit || "02e6bde1bbe34e43b309d4ef774b1168d25fd024";
        debugOptions.useHttpUrl = debugOptions.useHttpUrl === undefined ? false : debugOptions.useHttpUrl;
        let chromeDevToolsPrefix = `chrome-devtools://devtools/remote/serve_file/@${commitSHA}`;
        if (debugOptions.useBundledDevTools) {
            chromeDevToolsPrefix = "chrome-devtools://devtools/bundled";
        }
        if (debugOptions.useHttpUrl) {
            chromeDevToolsPrefix = `https://chrome-devtools-frontend.appspot.com/serve_file/@${commitSHA}`;
        }
        const chromeUrl = `${chromeDevToolsPrefix}/inspector.html?experiments=true&ws=localhost:${port}`;
        return chromeUrl;
    }
}
exports.DebugServiceBase = DebugServiceBase;
