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
const util = require("util");
const path = require("path");
const source_map_1 = require("source-map");
function Exception() {
}
Exception.prototype = new Error();
function resolveCallStack(error) {
    const stackLines = error.stack.split("\n");
    const parsed = _.map(stackLines, (line) => {
        let match = line.match(/^\s*at ([^(]*) \((.*?):([0-9]+):([0-9]+)\)$/);
        if (match) {
            return match;
        }
        match = line.match(/^\s*at (.*?):([0-9]+):([0-9]+)$/);
        if (match) {
            match.splice(1, 0, "<anonymous>");
            return match;
        }
        return line;
    });
    const fs = require("fs");
    const remapped = _.map(parsed, (parsedLine) => {
        if (_.isString(parsedLine)) {
            return parsedLine;
        }
        const functionName = parsedLine[1];
        const fileName = parsedLine[2];
        const line = +parsedLine[3];
        const column = +parsedLine[4];
        const mapFileName = fileName + ".map";
        if (!fs.existsSync(mapFileName)) {
            return parsedLine.input;
        }
        const mapData = JSON.parse(fs.readFileSync(mapFileName).toString());
        const consumer = new source_map_1.SourceMapConsumer(mapData);
        const sourcePos = consumer.originalPositionFor({ line: line, column: column });
        if (sourcePos && sourcePos.source) {
            const source = path.join(path.dirname(fileName), sourcePos.source);
            return util.format("    at %s (%s:%s:%s)", functionName, source, sourcePos.line, sourcePos.column);
        }
        return util.format("    at %s (%s:%s:%s)", functionName, fileName, line, column);
    });
    let outputMessage = remapped.join("\n");
    if (outputMessage.indexOf(error.message) === -1) {
        outputMessage = outputMessage.replace(/Error/, "Error: " + error.message);
    }
    return outputMessage;
}
function installUncaughtExceptionListener(actionOnException) {
    const handler = (err) => __awaiter(this, void 0, void 0, function* () {
        try {
            let callstack = err.stack;
            if (callstack) {
                try {
                    callstack = resolveCallStack(err);
                }
                catch (err) {
                    console.error("Error while resolving callStack:", err);
                }
            }
            console.error(callstack || err.toString());
            yield tryTrackException(err, $injector);
            if (actionOnException) {
                actionOnException();
            }
        }
        catch (err) {
            process.exit(131);
        }
    });
    process.on("uncaughtException", handler);
    process.on("unhandledRejection", handler);
}
exports.installUncaughtExceptionListener = installUncaughtExceptionListener;
function tryTrackException(error, injector) {
    return __awaiter(this, void 0, void 0, function* () {
        let disableAnalytics;
        try {
            disableAnalytics = injector.resolve("staticConfig").disableAnalytics;
        }
        catch (err) {
            disableAnalytics = true;
        }
        if (!disableAnalytics) {
            try {
                const analyticsService = injector.resolve("analyticsService");
                yield analyticsService.trackException(error, error.message);
            }
            catch (e) {
                console.error("Error while reporting exception: " + e);
            }
        }
    });
}
class Errors {
    constructor($injector) {
        this.$injector = $injector;
        this.printCallStack = false;
    }
    fail(optsOrFormatStr, ...args) {
        const argsArray = args || [];
        let opts = optsOrFormatStr;
        if (_.isString(opts)) {
            opts = { formatStr: opts };
        }
        const exception = new Exception();
        exception.name = opts.name || "Exception";
        exception.message = util.format.apply(null, [opts.formatStr].concat(argsArray));
        try {
            const $messagesService = this.$injector.resolve("messagesService");
            exception.message = $messagesService.getMessage.apply($messagesService, [opts.formatStr].concat(argsArray));
        }
        catch (err) {
        }
        exception.stack = (new Error(exception.message)).stack;
        exception.errorCode = opts.errorCode || 127;
        exception.suppressCommandHelp = opts.suppressCommandHelp;
        exception.proxyAuthenticationRequired = !!opts.proxyAuthenticationRequired;
        this.$injector.resolve("logger").trace(opts.formatStr);
        throw exception;
    }
    failWithoutHelp(message, ...args) {
        args.unshift(message);
        return this.fail({ formatStr: util.format.apply(null, args), suppressCommandHelp: true });
    }
    beginCommand(action, printCommandHelp) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield action();
            }
            catch (ex) {
                const loggerLevel = $injector.resolve("logger").getLevel().toUpperCase();
                const printCallStack = this.printCallStack || loggerLevel === "TRACE" || loggerLevel === "DEBUG";
                console.error(printCallStack
                    ? resolveCallStack(ex)
                    : "\x1B[31;1m" + ex.message + "\x1B[0m");
                if (!ex.suppressCommandHelp) {
                    try {
                        yield printCommandHelp();
                    }
                    catch (printHelpException) {
                        console.error("Failed to display command help", printHelpException);
                    }
                }
                yield tryTrackException(ex, this.$injector);
                process.exit(_.isNumber(ex.errorCode) ? ex.errorCode : 127);
            }
        });
    }
    verifyHeap(message) {
        if (global.gc) {
            console.log("verifyHeap: '%s'", message);
            global.gc();
        }
    }
}
exports.Errors = Errors;
$injector.register("errors", Errors);
