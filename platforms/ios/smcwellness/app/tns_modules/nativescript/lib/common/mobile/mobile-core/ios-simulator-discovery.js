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
const device_discovery_1 = require("./device-discovery");
const ios_simulator_device_1 = require("./../ios/simulator/ios-simulator-device");
class IOSSimulatorDiscovery extends device_discovery_1.DeviceDiscovery {
    constructor($injector, $childProcess, $iOSSimResolver, $mobileHelper, $hostInfo) {
        super();
        this.$injector = $injector;
        this.$childProcess = $childProcess;
        this.$iOSSimResolver = $iOSSimResolver;
        this.$mobileHelper = $mobileHelper;
        this.$hostInfo = $hostInfo;
    }
    startLookingForDevices(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options && options.platform && !this.$mobileHelper.isiOSPlatform(options.platform)) {
                return;
            }
            return new Promise((resolve, reject) => {
                return this.checkForDevices(resolve, reject);
            });
        });
    }
    checkForDevices(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.$hostInfo.isDarwin) {
                let currentSimulator = null;
                if (yield this.isSimulatorRunning()) {
                    currentSimulator = yield this.$iOSSimResolver.iOSSim.getRunningSimulator();
                }
                if (currentSimulator) {
                    if (!this.cachedSimulator) {
                        this.createAndAddDevice(currentSimulator);
                    }
                    else if (this.cachedSimulator.id !== currentSimulator.id) {
                        this.removeDevice(this.cachedSimulator.id);
                        this.createAndAddDevice(currentSimulator);
                    }
                }
                else if (this.cachedSimulator) {
                    this.removeDevice(this.cachedSimulator.id);
                    this.cachedSimulator = null;
                }
            }
            if (resolve) {
                resolve();
            }
        });
    }
    isSimulatorRunning() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const output = yield this.$childProcess.exec("ps cax | grep launchd_sim");
                return output.indexOf('launchd_sim') !== -1;
            }
            catch (e) {
                return false;
            }
        });
    }
    createAndAddDevice(simulator) {
        this.cachedSimulator = _.cloneDeep(simulator);
        this.addDevice(this.$injector.resolve(ios_simulator_device_1.IOSSimulator, { simulator: this.cachedSimulator }));
    }
}
exports.IOSSimulatorDiscovery = IOSSimulatorDiscovery;
$injector.register("iOSSimulatorDiscovery", IOSSimulatorDiscovery);
