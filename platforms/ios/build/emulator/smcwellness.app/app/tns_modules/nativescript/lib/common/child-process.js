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
const child_process = require("child_process");
const events_1 = require("events");
class ChildProcess extends events_1.EventEmitter {
    constructor($logger, $errors) {
        super();
        this.$logger = $logger;
        this.$errors = $errors;
    }
    exec(command, options, execOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const callback = (error, stdout, stderr) => {
                    this.$logger.trace("Exec %s \n stdout: %s \n stderr: %s", command, stdout.toString(), stderr.toString());
                    if (error) {
                        reject(error);
                    }
                    else {
                        const output = execOptions && execOptions.showStderr ? { stdout, stderr } : stdout;
                        resolve(output);
                    }
                };
                if (options) {
                    child_process.exec(command, options, callback);
                }
                else {
                    child_process.exec(command, callback);
                }
            });
        });
    }
    execFile(command, args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.debug("execFile: %s %s", command, this.getArgumentsAsQuotedString(args));
            return new Promise((resolve, reject) => {
                child_process.execFile(command, args, (error, stdout) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(stdout);
                    }
                });
            });
        });
    }
    spawn(command, args, options) {
        this.$logger.debug("spawn: %s %s", command, this.getArgumentsAsQuotedString(args));
        return child_process.spawn(command, args, options);
    }
    fork(modulePath, args, options) {
        this.$logger.debug("fork: %s %s", modulePath, this.getArgumentsAsQuotedString(args));
        return child_process.fork(modulePath, args, options);
    }
    spawnFromEvent(command, args, event, options, spawnFromEventOptions) {
        return new Promise((resolve, reject) => {
            const childProcess = this.spawn(command, args, options);
            let isResolved = false;
            let capturedOut = "";
            let capturedErr = "";
            if (childProcess.stdout) {
                childProcess.stdout.on("data", (data) => {
                    if (spawnFromEventOptions && spawnFromEventOptions.emitOptions && spawnFromEventOptions.emitOptions.eventName) {
                        this.emit(spawnFromEventOptions.emitOptions.eventName, { data, pipe: 'stdout' });
                    }
                    capturedOut += data;
                });
            }
            if (childProcess.stderr) {
                childProcess.stderr.on("data", (data) => {
                    if (spawnFromEventOptions && spawnFromEventOptions.emitOptions && spawnFromEventOptions.emitOptions.eventName) {
                        this.emit(spawnFromEventOptions.emitOptions.eventName, { data, pipe: 'stderr' });
                    }
                    capturedErr += data;
                });
            }
            childProcess.on(event, (arg) => {
                const exitCode = typeof arg === "number" ? arg : arg && arg.code;
                const result = {
                    stdout: capturedOut,
                    stderr: capturedErr,
                    exitCode: exitCode
                };
                if (spawnFromEventOptions && spawnFromEventOptions.throwError === false) {
                    if (!isResolved) {
                        this.$logger.trace("Result when throw error is false:");
                        this.$logger.trace(result);
                        isResolved = true;
                        resolve(result);
                    }
                }
                else {
                    if (exitCode === 0) {
                        isResolved = true;
                        resolve(result);
                    }
                    else {
                        let errorMessage = `Command ${command} failed with exit code ${exitCode}`;
                        if (capturedErr) {
                            errorMessage += ` Error output: \n ${capturedErr}`;
                        }
                        if (!isResolved) {
                            isResolved = true;
                            reject(new Error(errorMessage));
                        }
                    }
                }
            });
            childProcess.once("error", (err) => {
                if (!isResolved) {
                    if (spawnFromEventOptions && spawnFromEventOptions.throwError === false) {
                        const result = {
                            stdout: capturedOut,
                            stderr: err.message,
                            exitCode: err.code
                        };
                        isResolved = true;
                        resolve(result);
                    }
                    else {
                        isResolved = true;
                        reject(err);
                    }
                }
            });
        });
    }
    tryExecuteApplication(command, args, event, errorMessage, condition) {
        return __awaiter(this, void 0, void 0, function* () {
            const childProcess = yield this.tryExecuteApplicationCore(command, args, event, errorMessage);
            if (condition && condition(childProcess)) {
                this.$errors.fail(errorMessage);
            }
        });
    }
    tryExecuteApplicationCore(command, args, event, errorMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.spawnFromEvent(command, args, event, undefined, { throwError: false });
            }
            catch (e) {
                const message = (e.code === "ENOENT") ? errorMessage : e.message;
                this.$errors.failWithoutHelp(message);
            }
        });
    }
    getArgumentsAsQuotedString(args) {
        return args && args.length && args.map(argument => `"${argument}"`).join(" ");
    }
}
exports.ChildProcess = ChildProcess;
$injector.register("childProcess", ChildProcess);