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
const helpers_1 = require("./helpers");
const clui = require("clui");
class ProgressIndicator {
    constructor($logger) {
        this.$logger = $logger;
    }
    showProgressIndicator(promise, timeout, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const surpressTrailingNewLine = options && options.surpressTrailingNewLine;
            let isFulfilled = false;
            const tempPromise = new Promise((resolve, reject) => {
                promise.then((res) => {
                    isFulfilled = true;
                    resolve(res);
                }, (err) => {
                    isFulfilled = true;
                    reject(err);
                });
            });
            if (!helpers_1.isInteractive()) {
                while (!isFulfilled) {
                    yield this.$logger.printMsgWithTimeout(".", timeout);
                }
            }
            if (!surpressTrailingNewLine) {
                this.$logger.out();
            }
            return tempPromise;
        });
    }
    getSpinner(message) {
        if (helpers_1.isInteractive()) {
            return new clui.Spinner(message);
        }
        else {
            let msg = message;
            return {
                start: () => this.$logger.info(msg),
                message: (newMsg) => msg = newMsg,
                stop: () => undefined
            };
        }
    }
}
exports.ProgressIndicator = ProgressIndicator;
$injector.register("progressIndicator", ProgressIndicator);
