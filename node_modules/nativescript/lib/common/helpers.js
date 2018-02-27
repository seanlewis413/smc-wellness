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
const uuid = require("uuid");
const os_1 = require("os");
const constants_1 = require("./constants");
const crypto = require("crypto");
const progress = require("progress-stream");
const filesize = require("filesize");
const util = require("util");
const Table = require("cli-table");
function trackDownloadProgress(destinationStream, url) {
    let lastMessageSize = 0;
    const carriageReturn = "\x1B[0G";
    let timeElapsed = 0;
    const isInteractiveTerminal = isInteractive();
    const progressStream = progress({ time: 1000 }, (progress) => {
        timeElapsed = progress.runtime;
        if (timeElapsed >= 1) {
            if (isInteractiveTerminal) {
                this.$logger.write("%s%s", carriageReturn, Array(lastMessageSize + 1).join(" "));
                const message = util.format("%sDownload progress ... %s | %s | %s/s", carriageReturn, Math.floor(progress.percentage) + "%", filesize(progress.transferred), filesize(progress.speed));
                this.$logger.write(message);
                lastMessageSize = message.length;
            }
        }
    });
    progressStream.on("finish", () => {
        if (timeElapsed >= 1) {
            const msg = `Download of ${url} completed.`;
            if (isInteractiveTerminal) {
                this.$logger.out("%s%s%s%s", carriageReturn, Array(lastMessageSize + 1).join(" "), carriageReturn, msg);
            }
            else {
                this.$logger.out(msg);
            }
        }
    });
    progressStream.pipe(destinationStream);
    return progressStream;
}
exports.trackDownloadProgress = trackDownloadProgress;
function executeActionByChunks(initialData, chunkSize, elementAction) {
    return __awaiter(this, void 0, void 0, function* () {
        let arrayToChunk;
        let action;
        if (_.isArray(initialData)) {
            arrayToChunk = initialData;
            action = (element) => elementAction(element, initialData.indexOf(element));
        }
        else {
            arrayToChunk = _.keys(initialData);
            action = (key) => elementAction(initialData[key], key);
        }
        const chunks = _.chunk(arrayToChunk, chunkSize);
        for (const chunk of chunks) {
            yield Promise.all(_.map(chunk, element => action(element)));
        }
    });
}
exports.executeActionByChunks = executeActionByChunks;
function deferPromise() {
    let resolve;
    let reject;
    let isResolved = false;
    let isRejected = false;
    let promise;
    promise = new Promise((innerResolve, innerReject) => {
        resolve = (value) => {
            isResolved = true;
            return innerResolve(value);
        };
        reject = (reason) => {
            isRejected = true;
            return innerReject(reason);
        };
    });
    return {
        promise,
        resolve,
        reject,
        isResolved: () => isResolved,
        isRejected: () => isRejected,
        isPending: () => !isResolved && !isRejected
    };
}
exports.deferPromise = deferPromise;
function settlePromises(promises) {
    return new Promise((resolve, reject) => {
        let settledPromisesCount = 0;
        const results = [];
        const errors = [];
        const length = promises.length;
        if (!promises.length) {
            resolve();
        }
        _.forEach(promises, currentPromise => {
            currentPromise
                .then(result => {
                results.push(result);
            })
                .catch(err => {
                errors.push(err);
            })
                .then(() => {
                settledPromisesCount++;
                if (settledPromisesCount === length) {
                    errors.length ? reject(new Error(`Multiple errors were thrown:${os_1.EOL}${errors.map(e => e.message || e).join(os_1.EOL)}`)) : resolve(results);
                }
            });
        });
    });
}
exports.settlePromises = settlePromises;
function getPropertyName(func) {
    if (func) {
        const match = func.toString().match(/(?:return\s+?.*\.(.+);)|(?:=>\s*?.*\.(.+)\b)/);
        if (match) {
            return (match[1] || match[2]).trim();
        }
    }
    return null;
}
exports.getPropertyName = getPropertyName;
function bashQuote(s) {
    if (s[0] === "'" && s[s.length - 1] === "'") {
        return s;
    }
    return "'" + s.replace(/'/g, '\'"\'"\'') + "'";
}
function cmdQuote(s) {
    if (s[0] === '"' && s[s.length - 1] === '"') {
        return s;
    }
    return '"' + s.replace(/"/g, '\\"') + '"';
}
function quoteString(s) {
    if (!s) {
        return s;
    }
    return (os_1.platform() === "win32") ? cmdQuote(s) : bashQuote(s);
}
exports.quoteString = quoteString;
function createGUID(useBraces) {
    let output;
    useBraces = useBraces === undefined ? true : useBraces;
    if (useBraces) {
        output = "{" + uuid.v4() + "}";
    }
    else {
        output = uuid.v4();
    }
    return output;
}
exports.createGUID = createGUID;
function stringReplaceAll(inputString, find, replace) {
    return inputString.split(find).join(replace);
}
exports.stringReplaceAll = stringReplaceAll;
function isRequestSuccessful(request) {
    return request.statusCode >= 200 && request.statusCode < 300;
}
exports.isRequestSuccessful = isRequestSuccessful;
function isResponseRedirect(response) {
    return _.includes([301, 302, 303, 307, 308], response.statusCode);
}
exports.isResponseRedirect = isResponseRedirect;
function formatListOfNames(names, conjunction) {
    conjunction = conjunction === undefined ? "or" : conjunction;
    if (names.length <= 1) {
        return names[0];
    }
    else {
        return _.initial(names).join(", ") + " " + conjunction + " " + names[names.length - 1];
    }
}
exports.formatListOfNames = formatListOfNames;
function getRelativeToRootPath(rootPath, filePath) {
    const relativeToRootPath = filePath.substr(rootPath.length);
    return relativeToRootPath;
}
exports.getRelativeToRootPath = getRelativeToRootPath;
function getVersionArray(version) {
    let result = [];
    const parseLambda = (x) => parseInt(x, 10);
    const filterLambda = (x) => !isNaN(x);
    if (typeof version === "string") {
        const versionString = version.split("-")[0];
        result = _.map(versionString.split("."), parseLambda);
    }
    else {
        result = _(version).map(parseLambda).filter(filterLambda).value();
    }
    return result;
}
function versionCompare(version1, version2) {
    const v1array = getVersionArray(version1), v2array = getVersionArray(version2);
    if (v1array.length !== v2array.length) {
        throw new Error("Version strings are not in the same format");
    }
    for (let i = 0; i < v1array.length; ++i) {
        if (v1array[i] !== v2array[i]) {
            return v1array[i] > v2array[i] ? 1 : -1;
        }
    }
    return 0;
}
exports.versionCompare = versionCompare;
function isInteractive() {
    return process.stdout.isTTY && process.stdin.isTTY;
}
exports.isInteractive = isInteractive;
function toBoolean(str) {
    return !!(str && str.toString && str.toString().toLowerCase() === "true");
}
exports.toBoolean = toBoolean;
function block(operation) {
    if (isInteractive()) {
        process.stdin.setRawMode(false);
    }
    operation();
    if (isInteractive()) {
        process.stdin.setRawMode(true);
    }
}
exports.block = block;
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
exports.isNumber = isNumber;
function fromWindowsRelativePathToUnix(windowsRelativePath) {
    return windowsRelativePath.replace(/\\/g, "/");
}
exports.fromWindowsRelativePathToUnix = fromWindowsRelativePathToUnix;
function isNullOrWhitespace(input) {
    if (!input && input !== false) {
        return true;
    }
    return _.isString(input) && input.replace(/\s/gi, "").length < 1;
}
exports.isNullOrWhitespace = isNullOrWhitespace;
function getCurrentEpochTime() {
    const dateTime = new Date();
    return dateTime.getTime();
}
exports.getCurrentEpochTime = getCurrentEpochTime;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            setTimeout(() => __awaiter(this, void 0, void 0, function* () { return resolve(); }), ms);
        });
    });
}
exports.sleep = sleep;
function createTable(headers, data) {
    const table = new Table({
        head: headers,
        chars: { "mid": "", "left-mid": "", "mid-mid": "", "right-mid": "" }
    });
    _.forEach(data, row => table.push(row));
    return table;
}
exports.createTable = createTable;
function remove(array, predicate, numberOfElements) {
    numberOfElements = numberOfElements || 1;
    const index = _.findIndex(array, predicate);
    if (index === -1) {
        return new Array();
    }
    return array.splice(index, numberOfElements);
}
exports.remove = remove;
function trimSymbol(str, symbol) {
    while (str.charAt(0) === symbol) {
        str = str.substr(1);
    }
    while (str.charAt(str.length - 1) === symbol) {
        str = str.substr(0, str.length - 1);
    }
    return str;
}
exports.trimSymbol = trimSymbol;
function getFuturesResults(promises, predicate) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield Promise.all(promises);
        return _(results)
            .filter(predicate)
            .flatten()
            .value();
    });
}
exports.getFuturesResults = getFuturesResults;
function appendZeroesToVersion(version, requiredVersionLength) {
    if (version) {
        const zeroesToAppend = requiredVersionLength - version.split(".").length;
        for (let index = 0; index < zeroesToAppend; index++) {
            version += ".0";
        }
    }
    return version;
}
exports.appendZeroesToVersion = appendZeroesToVersion;
function decorateMethod(before, after) {
    return (target, propertyKey, descriptor) => {
        const sink = descriptor.value;
        descriptor.value = function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                let newMethods = null;
                if (before) {
                    newMethods = yield before(sink, this, args);
                }
                let hasBeenReplaced = false;
                let result;
                if (newMethods && newMethods.length) {
                    const replacementMethods = _.filter(newMethods, f => _.isFunction(f));
                    if (replacementMethods.length > 0) {
                        if (replacementMethods.length > 1) {
                            const $logger = $injector.resolve("logger");
                            $logger.warn(`Multiple methods detected which try to replace ${sink.name}. Will execute only the first of them.`);
                        }
                        hasBeenReplaced = true;
                        result = _.head(replacementMethods)(args, sink.bind(this));
                    }
                }
                if (!hasBeenReplaced) {
                    result = sink.apply(this, args);
                }
                if (after) {
                    return yield after(sink, this, result, args);
                }
                return result;
            });
        };
    };
}
exports.decorateMethod = decorateMethod;
function hook(commandName) {
    function getHooksService(self) {
        let hooksService = self.$hooksService;
        if (!hooksService) {
            const injector = self.$injector;
            if (!injector) {
                throw Error('Type with hooks needs to have either $hooksService or $injector injected.');
            }
            hooksService = injector.resolve('hooksService');
        }
        return hooksService;
    }
    function prepareArguments(method, args, hooksService) {
        annotate(method);
        const argHash = {};
        for (let i = 0; i < method.$inject.args.length; ++i) {
            argHash[method.$inject.args[i]] = args[i];
        }
        argHash.$arguments = args;
        const result = {};
        result[hooksService.hookArgsName] = argHash;
        return result;
    }
    return decorateMethod((method, self, args) => __awaiter(this, void 0, void 0, function* () {
        const hooksService = getHooksService(self);
        return hooksService.executeBeforeHooks(commandName, prepareArguments(method, args, hooksService));
    }), (method, self, resultPromise, args) => __awaiter(this, void 0, void 0, function* () {
        const result = yield resultPromise;
        const hooksService = getHooksService(self);
        yield hooksService.executeAfterHooks(commandName, prepareArguments(method, args, hooksService));
        return Promise.resolve(result);
    }));
}
exports.hook = hook;
function isPromise(candidateFuture) {
    return !!(candidateFuture && typeof (candidateFuture.then) === "function");
}
exports.isPromise = isPromise;
function attachAwaitDetach(eventName, eventEmitter, eventHandler, operation) {
    return __awaiter(this, void 0, void 0, function* () {
        eventEmitter.on(eventName, eventHandler);
        try {
            yield operation;
        }
        finally {
            eventEmitter.removeListener(eventName, eventHandler);
        }
    });
}
exports.attachAwaitDetach = attachAwaitDetach;
function connectEventually(factory, handler) {
    return __awaiter(this, void 0, void 0, function* () {
        function tryConnect() {
            return __awaiter(this, void 0, void 0, function* () {
                const tryConnectAfterTimeout = setTimeout.bind(undefined, tryConnect, 1000);
                const socket = yield factory();
                socket.on("connect", () => {
                    socket.removeListener("error", tryConnectAfterTimeout);
                    handler(socket);
                });
                socket.on("error", tryConnectAfterTimeout);
            });
        }
        yield tryConnect();
    });
}
exports.connectEventually = connectEventually;
function getHash(str, options) {
    return crypto.createHash(options && options.algorithm || 'sha256').update(str).digest(options && options.encoding || 'hex');
}
exports.getHash = getHash;
function connectEventuallyUntilTimeout(factory, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let lastKnownError;
            let isResolved = false;
            setTimeout(function () {
                if (!isResolved) {
                    isResolved = true;
                    reject(lastKnownError);
                }
            }, timeout);
            function tryConnect() {
                const tryConnectAfterTimeout = (error) => {
                    if (isResolved) {
                        return;
                    }
                    lastKnownError = error;
                    setTimeout(tryConnect, 1000);
                };
                const socket = factory();
                socket.on("connect", () => {
                    socket.removeListener("error", tryConnectAfterTimeout);
                    isResolved = true;
                    resolve(socket);
                });
                socket.on("error", tryConnectAfterTimeout);
            }
            tryConnect();
        });
    });
}
exports.connectEventuallyUntilTimeout = connectEventuallyUntilTimeout;
function getProjectFilesConfig(opts) {
    const projectFilesConfig = {
        configuration: opts.isReleaseBuild ? constants_1.Configurations.Release.toLowerCase() : constants_1.Configurations.Debug.toLowerCase()
    };
    return projectFilesConfig;
}
exports.getProjectFilesConfig = getProjectFilesConfig;
function getPidFromiOSSimulatorLogs(applicationIdentifier, logLine) {
    if (logLine) {
        const pidRegExp = new RegExp(`${applicationIdentifier}:\\s?(\\d+)`);
        const pidMatch = logLine.match(pidRegExp);
        return pidMatch ? pidMatch[1] : null;
    }
    return null;
}
exports.getPidFromiOSSimulatorLogs = getPidFromiOSSimulatorLogs;
function getValueFromNestedObject(obj, key) {
    function _getValueRecursive(_obj, _key) {
        if (_.has(_obj, _key)) {
            return [_obj];
        }
        const res = [];
        _.forEach(_obj, (v, k) => {
            if (typeof v === "object" && typeof k === "string" && !_.startsWith(k, '$') && !_.endsWith(k.toLowerCase(), "service") && (v = _getValueRecursive(v, _key)).length) {
                res.push.apply(res, v);
            }
        });
        return res;
    }
    return _.head(_getValueRecursive(obj, key));
}
exports.getValueFromNestedObject = getValueFromNestedObject;
const CLASS_NAME = /class\s+([A-Z].+?)(?:\s+.*?)?\{/;
const CONSTRUCTOR_ARGS = /constructor\s*([^\(]*)\(\s*([^\)]*)\)/m;
const FN_NAME_AND_ARGS = /^(?:function)?\s*([^\(]*)\(\s*([^\)]*)\)\s*(=>)?\s*[{_]/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function annotate(fn) {
    let $inject, fnText, argDecl;
    if (typeof fn === "function") {
        if (!($inject = fn.$inject) || $inject.name !== fn.name) {
            $inject = { args: [], name: "" };
            fnText = fn.toString().replace(STRIP_COMMENTS, '');
            let nameMatch = fnText.match(CLASS_NAME);
            if (nameMatch) {
                argDecl = fnText.match(CONSTRUCTOR_ARGS);
            }
            else {
                nameMatch = argDecl = fnText.match(FN_NAME_AND_ARGS);
            }
            $inject.name = nameMatch && nameMatch[1];
            if (argDecl && fnText.length) {
                argDecl[2].split(FN_ARG_SPLIT).forEach((arg) => {
                    arg.replace(FN_ARG, (all, underscore, name) => $inject.args.push(name));
                });
            }
            fn.$inject = $inject;
        }
    }
    return $inject;
}
exports.annotate = annotate;
