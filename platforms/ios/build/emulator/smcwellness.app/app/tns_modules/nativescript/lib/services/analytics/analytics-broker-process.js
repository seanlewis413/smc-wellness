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
const fs = require("fs");
const analytics_broker_1 = require("./analytics-broker");
const pathToBootstrap = process.argv[2];
if (!pathToBootstrap || !fs.existsSync(pathToBootstrap)) {
    throw new Error("Invalid path to bootstrap.");
}
require(pathToBootstrap);
const analyticsBroker = $injector.resolve(analytics_broker_1.AnalyticsBroker, { pathToBootstrap });
let trackingQueue = Promise.resolve();
let sentFinishMsg = false;
let receivedFinishMsg = false;
const sendDataForTracking = (data) => __awaiter(this, void 0, void 0, function* () {
    trackingQueue = trackingQueue.then(() => analyticsBroker.sendDataForTracking(data));
    yield trackingQueue;
});
const finishTracking = (data) => __awaiter(this, void 0, void 0, function* () {
    if (!sentFinishMsg) {
        sentFinishMsg = true;
        data = data || { type: "finish" };
        const action = () => __awaiter(this, void 0, void 0, function* () {
            yield sendDataForTracking(data);
            process.disconnect();
        });
        if (receivedFinishMsg) {
            yield action();
        }
        else {
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                yield action();
            }), 1000);
        }
    }
});
process.on("message", (data) => __awaiter(this, void 0, void 0, function* () {
    if (data.type === "finish") {
        receivedFinishMsg = true;
        yield finishTracking(data);
        return;
    }
    yield sendDataForTracking(data);
}));
process.on("disconnect", () => __awaiter(this, void 0, void 0, function* () {
    yield finishTracking();
}));
process.send("BrokerReadyToReceive");
